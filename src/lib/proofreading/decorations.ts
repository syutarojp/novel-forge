import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import type { ProofreadingIssue } from "./types";

const proofreadingPluginKey = new PluginKey("proofreading");

function findTextPosition(
  doc: import("@tiptap/pm/model").Node,
  needle: string
): { from: number; to: number } | null {
  const ranges: { nodePos: number; textStart: number; text: string }[] = [];
  let textOffset = 0;

  doc.descendants((node, pos) => {
    if (node.isText && node.text) {
      ranges.push({ nodePos: pos, textStart: textOffset, text: node.text });
      textOffset += node.text.length;
    }
  });

  const fullText = ranges.map((r) => r.text).join("");
  const idx = fullText.indexOf(needle);
  if (idx === -1) return null;

  for (const range of ranges) {
    if (range.textStart + range.text.length > idx) {
      const from = range.nodePos + (idx - range.textStart);
      return { from, to: from + needle.length };
    }
  }
  return null;
}

export interface ProofreadingStorage {
  issues: ProofreadingIssue[];
}

export const ProofreadingDecoration = Extension.create<
  Record<string, never>,
  ProofreadingStorage
>({
  name: "proofreadingDecoration",

  addStorage() {
    return { issues: [] };
  },

  addProseMirrorPlugins() {
    const storage = this.storage;

    return [
      new Plugin({
        key: proofreadingPluginKey,
        props: {
          decorations(state) {
            const issues = storage.issues;
            if (!issues || issues.length === 0) return DecorationSet.empty;

            const decorations: Decoration[] = [];

            for (const issue of issues) {
              const pos = findTextPosition(state.doc, issue.original);
              if (!pos) continue;

              // Red underline on the original text
              decorations.push(
                Decoration.inline(pos.from, pos.to, {
                  class: "proofreading-mark",
                  "data-issue-id": issue.id,
                  "data-severity": issue.severity,
                })
              );

              // Widget after the original: show suggestion in red
              const widget = document.createElement("span");
              widget.className = "proofreading-suggestion";
              widget.setAttribute("data-issue-id", issue.id);
              widget.textContent = issue.suggestion;
              widget.title = `${issue.category}: ${issue.reason}`;

              decorations.push(
                Decoration.widget(pos.to, widget, {
                  side: 1,
                  key: issue.id,
                })
              );
            }

            return DecorationSet.create(state.doc, decorations);
          },
        },
      }),
    ];
  },
});
