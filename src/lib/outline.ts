import type { JSONContent } from "@tiptap/react";
import type { Editor } from "@tiptap/react";
import { Slice } from "@tiptap/pm/model";
import type { OutlineItem } from "@/types";

interface FlatHeading {
  index: number;
  level: number;
  title: string;
  nodeIndex: number; // index in content.content array
}

function extractText(node: JSONContent): string {
  if (node.type === "text") return node.text ?? "";
  if (!node.content) return "";
  return node.content.map(extractText).join("");
}

function countWordsInText(text: string): number {
  if (!text || text.trim().length === 0) return 0;
  const cjk = text.match(
    /[\u4e00-\u9fff\u3400-\u4dbf\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]/g
  );
  const cjkCount = cjk ? cjk.length : 0;
  const nonCjk = text.replace(
    /[\u4e00-\u9fff\u3400-\u4dbf\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]/g,
    " "
  );
  const words = nonCjk
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0);
  return cjkCount + words.length;
}

/**
 * Count words in a range of top-level nodes (from startIdx to endIdx exclusive).
 */
function countWordsInRange(
  nodes: JSONContent[],
  startIdx: number,
  endIdx: number
): number {
  let text = "";
  for (let i = startIdx; i < endIdx; i++) {
    text += extractText(nodes[i]) + "\n";
  }
  return countWordsInText(text);
}

/**
 * Parse TipTap JSONContent and extract a hierarchical outline from headings.
 * Returns a flat list and a nested tree.
 */
export function parseOutline(content: JSONContent | null): OutlineItem[] {
  if (!content?.content) return [];

  const nodes = content.content;

  // Extract flat headings
  const headings: FlatHeading[] = [];
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].type === "heading") {
      headings.push({
        index: headings.length,
        level: nodes[i].attrs?.level ?? 1,
        title: extractText(nodes[i]) || "無題",
        nodeIndex: i,
      });
    }
  }

  if (headings.length === 0) return [];

  // Build flat OutlineItems with word counts
  const flatItems: OutlineItem[] = headings.map((h, idx) => {
    const contentStartIdx = h.nodeIndex + 1;
    const contentEndIdx =
      idx + 1 < headings.length ? headings[idx + 1].nodeIndex : nodes.length;

    return {
      id: `heading-${idx}`,
      level: h.level,
      title: h.title,
      headingIndex: idx,
      pos: idx, // heading index (後方互換)
      endPos: contentEndIdx,
      wordCount: countWordsInRange(nodes, contentStartIdx, contentEndIdx),
      children: [],
    };
  });

  // Build tree from flat list based on heading levels
  return buildOutlineTree(flatItems);
}

function buildOutlineTree(items: OutlineItem[]): OutlineItem[] {
  const root: OutlineItem[] = [];
  const stack: OutlineItem[] = [];

  for (const item of items) {
    // Create a fresh copy to avoid mutation issues
    const node: OutlineItem = { ...item, children: [] };

    // Pop stack until we find a parent with a lower level
    while (stack.length > 0 && stack[stack.length - 1].level >= node.level) {
      stack.pop();
    }

    if (stack.length === 0) {
      root.push(node);
    } else {
      stack[stack.length - 1].children.push(node);
    }
    stack.push(node);
  }

  return root;
}

/**
 * Get total word count from the full document content.
 */
export function getDocumentWordCount(content: JSONContent | null): number {
  if (!content?.content) return 0;
  let text = "";
  for (const node of content.content) {
    text += extractText(node) + "\n";
  }
  return countWordsInText(text);
}

/**
 * Get a flat list of all headings with their node indices.
 */
export function getFlatHeadings(
  content: JSONContent | null
): { level: number; title: string; nodeIndex: number }[] {
  if (!content?.content) return [];
  const result: { level: number; title: string; nodeIndex: number }[] = [];
  for (let i = 0; i < content.content.length; i++) {
    const node = content.content[i];
    if (node.type === "heading") {
      result.push({
        level: node.attrs?.level ?? 1,
        title: extractText(node) || "無題",
        nodeIndex: i,
      });
    }
  }
  return result;
}

// ============================================================
// Editor-based helpers (PM position aware)
// ============================================================

/**
 * Find the ProseMirror position of the headingIndex-th heading node.
 */
export function findHeadingPMPosition(
  editor: Editor,
  headingIndex: number
): number | null {
  let count = 0;
  let targetPos: number | null = null;

  editor.state.doc.descendants((node, pos) => {
    if (targetPos !== null) return false;
    if (node.type.name === "heading") {
      if (count === headingIndex) {
        targetPos = pos;
        return false;
      }
      count++;
    }
  });

  return targetPos;
}

/**
 * Find the PM position range of a section:
 * from the heading node to the start of the next sibling/ancestor heading (or end of doc).
 * "Section" = the heading + all content until the next heading at the same or higher level.
 */
export function findSectionRange(
  editor: Editor,
  headingIndex: number
): { from: number; to: number } | null {
  const doc = editor.state.doc;
  const headings: { pos: number; level: number; endPos: number }[] = [];

  doc.descendants((node, pos) => {
    if (node.type.name === "heading") {
      headings.push({
        pos,
        level: node.attrs.level ?? 1,
        endPos: pos + node.nodeSize,
      });
    }
  });

  if (headingIndex < 0 || headingIndex >= headings.length) return null;

  const current = headings[headingIndex];
  const from = current.pos;

  // Find the end: next heading at same or higher (lower number) level
  let to = doc.content.size;
  for (let i = headingIndex + 1; i < headings.length; i++) {
    if (headings[i].level <= current.level) {
      to = headings[i].pos;
      break;
    }
  }

  return { from, to };
}

/**
 * Change the heading level of a section.
 */
export function changeSectionLevel(
  editor: Editor,
  headingIndex: number,
  newLevel: number
): void {
  const pos = findHeadingPMPosition(editor, headingIndex);
  if (pos === null) return;

  const { tr } = editor.state;
  tr.setNodeMarkup(pos, undefined, {
    ...editor.state.doc.nodeAt(pos)?.attrs,
    level: newLevel,
  });
  editor.view.dispatch(tr);
}

/**
 * Move a section up or down among its siblings.
 *
 * Strategy: find adjacent sibling, get both ranges, replace the combined
 * range [first.from, second.to) with the content in swapped order.
 * This uses a single tr.replace to avoid position mapping issues.
 */
export function moveSection(
  editor: Editor,
  headingIndex: number,
  direction: "up" | "down"
): void {
  const doc = editor.state.doc;

  const headings: { pos: number; level: number }[] = [];
  doc.descendants((node, pos) => {
    if (node.type.name === "heading") {
      headings.push({ pos, level: node.attrs.level ?? 1 });
    }
  });

  if (headingIndex < 0 || headingIndex >= headings.length) return;
  const current = headings[headingIndex];

  // Find adjacent sibling at same level
  let siblingIndex: number | null = null;
  if (direction === "up") {
    for (let i = headingIndex - 1; i >= 0; i--) {
      if (headings[i].level < current.level) break;
      if (headings[i].level === current.level) { siblingIndex = i; break; }
    }
  } else {
    for (let i = headingIndex + 1; i < headings.length; i++) {
      if (headings[i].level < current.level) break;
      if (headings[i].level === current.level) { siblingIndex = i; break; }
    }
  }
  if (siblingIndex === null) return;

  const rangeA = findSectionRange(editor, headingIndex);
  const rangeB = findSectionRange(editor, siblingIndex);
  if (!rangeA || !rangeB) return;

  // Ensure first < second
  const [first, second] =
    rangeA.from < rangeB.from ? [rangeA, rangeB] : [rangeB, rangeA];

  // Get content slices from the original doc
  const firstSlice = doc.slice(first.from, first.to);
  const secondSlice = doc.slice(second.from, second.to);

  // Build swapped fragment: second content + first content
  const swapped = secondSlice.content.append(firstSlice.content);

  // Single replace over the combined range
  const { tr } = editor.state;
  tr.replace(first.from, second.to, new Slice(swapped, 0, 0));
  editor.view.dispatch(tr);
}

/**
 * Swap two sections directly (for drag-and-drop).
 * Both sections must be at the same heading level.
 */
export function swapSections(
  editor: Editor,
  headingIndexA: number,
  headingIndexB: number
): void {
  if (headingIndexA === headingIndexB) return;

  const rangeA = findSectionRange(editor, headingIndexA);
  const rangeB = findSectionRange(editor, headingIndexB);
  if (!rangeA || !rangeB) return;

  const doc = editor.state.doc;

  // Ensure first < second
  const [first, second] =
    rangeA.from < rangeB.from ? [rangeA, rangeB] : [rangeB, rangeA];

  const firstSlice = doc.slice(first.from, first.to);
  const secondSlice = doc.slice(second.from, second.to);
  const swapped = secondSlice.content.append(firstSlice.content);

  const { tr } = editor.state;
  tr.replace(first.from, second.to, new Slice(swapped, 0, 0));
  editor.view.dispatch(tr);
}

/**
 * Extract section content as JSONContent (for trash).
 */
export function extractSectionContent(
  editor: Editor,
  headingIndex: number
): JSONContent | null {
  const range = findSectionRange(editor, headingIndex);
  if (!range) return null;

  const slice = editor.state.doc.slice(range.from, range.to);
  return slice.toJSON() as unknown as JSONContent;
}

/**
 * Delete a section from the document.
 */
export function deleteSection(
  editor: Editor,
  headingIndex: number
): void {
  const range = findSectionRange(editor, headingIndex);
  if (!range) return;

  const { tr } = editor.state;
  tr.delete(range.from, range.to);
  editor.view.dispatch(tr);
}
