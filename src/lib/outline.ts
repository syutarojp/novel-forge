import type { JSONContent } from "@tiptap/react";
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
      pos: h.nodeIndex, // node index (for scrolling we'll use this)
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
