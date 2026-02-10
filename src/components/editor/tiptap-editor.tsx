"use client";

import { useEffect, useRef, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import UnderlineExt from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
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
  // Count both CJK characters and space-separated words
  const cjk = text.match(/[\u4e00-\u9fff\u3400-\u4dbf\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]/g);
  const cjkCount = cjk ? cjk.length : 0;
  // Remove CJK characters and count remaining words
  const nonCjk = text.replace(/[\u4e00-\u9fff\u3400-\u4dbf\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]/g, " ");
  const words = nonCjk.trim().split(/\s+/).filter((w) => w.length > 0);
  return cjkCount + words.length;
}

export function TipTapEditor({ projectId, readOnly = false }: TipTapEditorProps) {
  const { data: manuscriptData } = useManuscriptContent(projectId);
  const updateContent = useUpdateManuscriptContent();
  const setSaveStatus = useUIStore((s) => s.setSaveStatus);
  const setEditorInstance = useUIStore((s) => s.setEditorInstance);
  const setTotalWordCount = useUIStore((s) => s.setTotalWordCount);
  const setCurrentSceneWordCount = useUIStore((s) => s.setCurrentSceneWordCount);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitializedRef = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      UnderlineExt,
      Placeholder.configure({
        placeholder: "原稿を書き始めましょう...",
      }),
      CharacterCount,
      ProofreadingDecoration,
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

  // Update content when manuscript data loads
  useEffect(() => {
    if (editor && manuscriptData) {
      isInitializedRef.current = false;
      editor.commands.setContent(manuscriptData.content || "");
      // Update word count for initial load
      const text = editor.getText();
      const wc = countWords(text);
      setTotalWordCount(wc);
      setCurrentSceneWordCount(wc);
      // Small delay so the onUpdate doesn't fire for the setContent
      requestAnimationFrame(() => {
        isInitializedRef.current = true;
      });
    }
  }, [editor, manuscriptData?.content, setTotalWordCount, setCurrentSceneWordCount]); // eslint-disable-line react-hooks/exhaustive-deps

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
      // Force ProseMirror to re-evaluate decorations
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
