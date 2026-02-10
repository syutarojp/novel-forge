import { useCallback } from "react";
import { useUIStore } from "@/stores/ui-store";
import { useProofreadingStore } from "@/stores/proofreading-store";
import type { ProofreadingIssue } from "@/lib/proofreading/types";

export function useProofread() {
  const editorInstance = useUIStore((s) => s.editorInstance);
  const setStatus = useProofreadingStore((s) => s.setStatus);
  const setResult = useProofreadingStore((s) => s.setResult);
  const setError = useProofreadingStore((s) => s.setError);

  const run = useCallback(async () => {
    if (!editorInstance) {
      setError("エディタが利用できません");
      return;
    }

    const text = editorInstance.getText();
    if (!text || text.trim().length === 0) {
      setError("校正するテキストがありません");
      return;
    }

    setStatus("loading");

    try {
      const res = await fetch("/api/proofread", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `API error: ${res.status}`);
      }

      const data = await res.json();

      // Add unique IDs to issues
      const issues: ProofreadingIssue[] = (data.issues || []).map(
        (issue: Omit<ProofreadingIssue, "id">, index: number) => ({
          ...issue,
          id: `proof-${Date.now()}-${index}`,
        })
      );

      setResult(issues, data.summary || "");
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "校正処理中にエラーが発生しました"
      );
    }
  }, [editorInstance, setStatus, setResult, setError]);

  return run;
}

/**
 * Find ProseMirror position of a text string by walking the document.
 * Returns { from, to } or null if not found.
 */
function findTextInDoc(
  doc: import("@tiptap/pm/model").Node,
  needle: string
): { from: number; to: number } | null {
  // Build a mapping of text offset → ProseMirror position
  // doc.textBetween(from, to, "\n") mirrors editor.getText()
  let textOffset = 0;

  const result: { from: number; to: number } | null = null;

  // Walk leaf nodes to build text offset mapping
  const ranges: { nodePos: number; textStart: number; text: string }[] = [];
  doc.descendants((node, pos) => {
    if (node.isText && node.text) {
      ranges.push({ nodePos: pos, textStart: textOffset, text: node.text });
      textOffset += node.text.length;
    } else if (node.isLeaf) {
      // Non-text leaves (e.g. hard break) add a character
      textOffset += node.nodeSize;
    }
    // Block boundaries: top-level blocks after the first add a \n separator
    // in getText(). We account for this implicitly since descendants visits
    // text nodes in order.
  });

  // Search for the needle in the concatenated text
  const fullText = ranges.map((r) => r.text).join("");
  const idx = fullText.indexOf(needle);
  if (idx === -1) return null;

  // Convert text offset to ProseMirror position
  let from = 0;
  let accumulated = 0;
  let foundFrom = false;

  for (const range of ranges) {
    if (!foundFrom && accumulated + range.text.length > idx) {
      from = range.nodePos + (idx - accumulated);
      foundFrom = true;
    }
    accumulated += range.text.length;
    if (foundFrom) break;
  }

  if (!foundFrom) return null;

  return { from, to: from + needle.length };
}

export function useApplySuggestion() {
  const editorInstance = useUIStore((s) => s.editorInstance);
  const dismissIssue = useProofreadingStore((s) => s.dismissIssue);

  const apply = useCallback(
    (issue: ProofreadingIssue) => {
      if (!editorInstance) return false;

      const match = findTextInDoc(editorInstance.state.doc, issue.original);
      if (!match) return false;

      editorInstance
        .chain()
        .focus()
        .setTextSelection(match)
        .insertContent(issue.suggestion)
        .run();

      dismissIssue(issue.id);
      return true;
    },
    [editorInstance, dismissIssue]
  );

  return apply;
}
