"use client";

import { useEffect, useRef } from "react";
import { useEditor, EditorContent, Extension } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import UnderlineExt from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import { Plugin } from "@tiptap/pm/state";
import { ProofreadingDecoration } from "@/lib/proofreading/decorations";
import { useUIStore } from "@/stores/ui-store";
import { useProofreadingStore } from "@/stores/proofreading-store";
import { useManuscriptContent, useUpdateManuscriptContent } from "@/hooks/use-manuscript";
import { EditorToolbar } from "./editor-toolbar";

interface TipTapEditorProps {
  projectId: string;
  readOnly?: boolean;
}

function countWords(text: string): number {
  if (!text || text.trim().length === 0) return 0;
  const cjk = text.match(/[\u4e00-\u9fff\u3400-\u4dbf\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]/g);
  const cjkCount = cjk ? cjk.length : 0;
  const nonCjk = text.replace(/[\u4e00-\u9fff\u3400-\u4dbf\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]/g, " ");
  const words = nonCjk.trim().split(/\s+/).filter((w) => w.length > 0);
  return cjkCount + words.length;
}

/**
 * H1 Protection Plugin — O(1) per transaction.
 *
 * Strategy: compare firstChild before/after the transaction.
 * - If old doc starts with H1, the new doc must also start with H1 + same text.
 * - setContent() replaces the whole doc; the new doc's H1 comes from saved data,
 *   so the text will be the same → allowed.
 * - User typing in H1 changes the text → blocked.
 * - User deleting H1 removes it → blocked.
 * - Edits to other nodes don't change firstChild → allowed.
 */
const H1Protection = Extension.create({
  name: "h1Protection",
  addProseMirrorPlugins() {
    return [
      new Plugin({
        filterTransaction(tr, state) {
          if (!tr.docChanged) return true;
          if (tr.getMeta("allowH1Edit")) return true;

          // Only protect if the current doc starts with H1
          const oldFirst = state.doc.firstChild;
          if (!oldFirst || oldFirst.type.name !== "heading" || oldFirst.attrs.level !== 1) {
            return true;
          }

          // After the transaction, doc must still start with an H1
          const newFirst = tr.doc.firstChild;
          if (!newFirst || newFirst.type.name !== "heading" || newFirst.attrs.level !== 1) {
            return false;
          }

          // H1 text must remain unchanged (blocks user edits to title)
          if (newFirst.textContent !== oldFirst.textContent) {
            return false;
          }

          return true;
        },
      }),
    ];
  },
});

export function TipTapEditor({ projectId, readOnly = false }: TipTapEditorProps) {
  const { data: manuscriptData } = useManuscriptContent(projectId);
  const updateContent = useUpdateManuscriptContent();
  const setSaveStatus = useUIStore((s) => s.setSaveStatus);
  const setEditorInstance = useUIStore((s) => s.setEditorInstance);
  const setTotalWordCount = useUIStore((s) => s.setTotalWordCount);
  const setCurrentSceneWordCount = useUIStore((s) => s.setCurrentSceneWordCount);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitializedRef = useRef(false);
  const contentLoadedRef = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
      }),
      UnderlineExt,
      Placeholder.configure({
        placeholder: "原稿を書き始めましょう...",
      }),
      CharacterCount,
      ProofreadingDecoration,
      H1Protection,
    ],
    editable: !readOnly,
    content: manuscriptData?.content || "",
    onUpdate: ({ editor }) => {
      if (!isInitializedRef.current) return;
      setSaveStatus("unsaved");

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        const json = editor.getJSON();
        const text = editor.getText();
        const wc = countWords(text);

        setTotalWordCount(wc);
        setCurrentSceneWordCount(wc);
        setSaveStatus("saving");
        updateContent.mutate(
          {
            projectId,
            content: json,
            wordCount: wc,
          },
          {
            onSuccess: () => setSaveStatus("saved"),
            onError: () => setSaveStatus("unsaved"),
          }
        );
      }, 1500);
    },
    immediatelyRender: false,
  });

  // Load content ONCE when manuscript data first arrives.
  // After that, the editor is the source of truth — never overwrite from API.
  useEffect(() => {
    if (editor && manuscriptData && !contentLoadedRef.current) {
      contentLoadedRef.current = true;
      isInitializedRef.current = false;
      editor.commands.setContent(manuscriptData.content || "");
      const text = editor.getText();
      const wc = countWords(text);
      setTotalWordCount(wc);
      setCurrentSceneWordCount(wc);
      requestAnimationFrame(() => {
        isInitializedRef.current = true;
      });
    }
  }, [editor, manuscriptData, setTotalWordCount, setCurrentSceneWordCount]); // eslint-disable-line react-hooks/exhaustive-deps

  // Publish editor instance to store for cross-component access
  useEffect(() => {
    if (editor) {
      setEditorInstance(editor);
    }
    return () => {
      setEditorInstance(null);
    };
  }, [editor, setEditorInstance]);

  // Sync proofreading issues into the decoration extension
  const proofreadingIssues = useProofreadingStore((s) => s.issues);
  useEffect(() => {
    if (!editor) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const storage = (editor.extensionStorage as any).proofreadingDecoration as { issues: typeof proofreadingIssues } | undefined;
    if (storage) {
      storage.issues = proofreadingIssues;
      editor.view.dispatch(editor.state.tr.setMeta("proofreadingUpdate", true));
    }
  }, [editor, proofreadingIssues]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  if (!manuscriptData) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        読み込み中...
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {!readOnly && <EditorToolbar editor={editor} />}
      <div className="flex-1 overflow-auto p-8">
        <div className="mx-auto max-w-3xl">
          <EditorContent editor={editor} className="prose prose-sm dark:prose-invert max-w-none min-h-[500px] focus:outline-none" />
        </div>
      </div>
    </div>
  );
}
