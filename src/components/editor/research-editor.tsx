"use client";

import { useEffect, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import UnderlineExt from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import { useResearchItem, useUpdateResearchItem } from "@/hooks/use-binder";
import { EditorToolbar } from "./editor-toolbar";

interface ResearchEditorProps {
  itemId: string;
  projectId: string;
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

export function ResearchEditor({ itemId, projectId }: ResearchEditorProps) {
  const { data: researchItem } = useResearchItem(itemId);
  const updateResearchItem = useUpdateResearchItem();
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitializedRef = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      UnderlineExt,
      Placeholder.configure({
        placeholder: "リサーチノートを入力...",
      }),
      CharacterCount,
    ],
    editable: true,
    content: researchItem?.content || "",
    onUpdate: ({ editor }) => {
      if (!isInitializedRef.current) return;

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        const json = editor.getJSON();
        const text = editor.getText();
        const wc = countWords(text);

        updateResearchItem.mutate({
          id: itemId,
          projectId,
          data: {
            content: json,
            wordCount: wc,
          },
        });
      }, 1500);
    },
    immediatelyRender: false,
  });

  // Update content when research item data loads
  useEffect(() => {
    if (editor && researchItem) {
      isInitializedRef.current = false;
      editor.commands.setContent(researchItem.content || "");
      // Small delay so the onUpdate doesn't fire for the setContent
      requestAnimationFrame(() => {
        isInitializedRef.current = true;
      });
    }
  }, [editor, researchItem?.content]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  if (!researchItem) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        読み込み中...
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <EditorToolbar editor={editor} />
      <div className="flex-1 overflow-auto p-8">
        <div className="mx-auto max-w-3xl">
          <EditorContent editor={editor} className="prose prose-sm dark:prose-invert max-w-none min-h-[500px] focus:outline-none" />
        </div>
      </div>
    </div>
  );
}
