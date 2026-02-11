import { Extension } from "@tiptap/core";
import { Plugin, PluginKey, TextSelection } from "@tiptap/pm/state";
import type { Node as PMNode } from "@tiptap/pm/model";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

const sectionFocusKey = new PluginKey("sectionFocus");

export interface SectionFocusStorage {
  focusedHeadingIndex: number | null;
}

/**
 * Compute hiding decorations for the given document and focused heading index.
 * Returns DecorationSet.empty when nothing should be hidden.
 */
function buildDecorations(doc: PMNode, focusedIndex: number | null): DecorationSet {
  if (focusedIndex === null || focusedIndex === 0) return DecorationSet.empty;

  // Collect all headings with their document positions
  const headings: { index: number; level: number; pos: number }[] = [];
  let headingCount = 0;
  doc.descendants((node, pos) => {
    if (node.type.name === "heading") {
      headings.push({
        index: headingCount++,
        level: node.attrs.level ?? 1,
        pos,
      });
    }
    return false; // only top-level children
  });

  const focusedIdx = headings.findIndex((h) => h.index === focusedIndex);
  if (focusedIdx === -1) return DecorationSet.empty;

  const focusedLevel = headings[focusedIdx].level;
  const visibleFrom = headings[focusedIdx].pos;
  let visibleTo = doc.content.size;
  for (let i = focusedIdx + 1; i < headings.length; i++) {
    if (headings[i].level <= focusedLevel) {
      visibleTo = headings[i].pos;
      break;
    }
  }

  // Hide every top-level node outside [visibleFrom, visibleTo)
  const decorations: Decoration[] = [];
  doc.descendants((node, pos) => {
    if (pos < visibleFrom || pos >= visibleTo) {
      decorations.push(
        Decoration.node(pos, pos + node.nodeSize, {
          class: "section-hidden",
        })
      );
    }
    return false; // only top-level children
  });

  if (decorations.length === 0) return DecorationSet.empty;
  return DecorationSet.create(doc, decorations);
}

/**
 * Section Focus Extension
 *
 * Hides sections outside the focused heading's range using Node Decorations.
 * The document model is untouched — only CSS `display:none` is toggled.
 *
 * Control flow:
 *   1. React sets `editor.extensionStorage.sectionFocus.focusedHeadingIndex`
 *   2. React dispatches tr with meta `sectionFocusUpdate: true`
 *   3. Plugin state.apply rebuilds DecorationSet
 *   4. props.decorations reads from plugin state
 */
export const SectionFocus = Extension.create<
  Record<string, never>,
  SectionFocusStorage
>({
  name: "sectionFocus",

  addStorage() {
    return { focusedHeadingIndex: null };
  },

  addProseMirrorPlugins() {
    const storage = this.storage;

    return [
      new Plugin({
        key: sectionFocusKey,

        state: {
          init(_, state) {
            return buildDecorations(state.doc, storage.focusedHeadingIndex);
          },
          apply(tr, oldSet, _oldState, newState) {
            // Rebuild when focus changes or document changes
            if (tr.getMeta("sectionFocusUpdate") || tr.docChanged) {
              return buildDecorations(newState.doc, storage.focusedHeadingIndex);
            }
            return oldSet;
          },
        },

        props: {
          decorations(state) {
            return sectionFocusKey.getState(state) as DecorationSet;
          },
        },

        // Constrain cursor to visible range
        appendTransaction(transactions, _oldState, newState) {
          const idx = storage.focusedHeadingIndex;
          if (idx === null || idx === 0) return null;

          // Don't constrain during the focus-update transaction itself
          for (const tr of transactions) {
            if (tr.getMeta("sectionFocusUpdate")) return null;
          }

          const doc = newState.doc;
          const headings: { index: number; level: number; pos: number }[] = [];
          let hc = 0;
          doc.descendants((node, pos) => {
            if (node.type.name === "heading") {
              headings.push({ index: hc++, level: node.attrs.level ?? 1, pos });
            }
            return false;
          });

          const fi = headings.findIndex((h) => h.index === idx);
          if (fi === -1) return null;

          const level = headings[fi].level;
          const visibleFrom = headings[fi].pos;
          let visibleTo = doc.content.size;
          for (let i = fi + 1; i < headings.length; i++) {
            if (headings[i].level <= level) {
              visibleTo = headings[i].pos;
              break;
            }
          }

          const { from, to } = newState.selection;
          if (from >= visibleFrom && to <= visibleTo) return null;

          // Snap to the start of the focused heading
          const tr = newState.tr;
          tr.setSelection(TextSelection.create(doc, visibleFrom + 1));
          return tr;
        },
      }),
    ];
  },
});
