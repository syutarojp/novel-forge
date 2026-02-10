"use client";

import { useEffect, useRef, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import UnderlineExt from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import { useUIStore } from "@/stores/ui-store";
import { useBinderItem, useUpdateBinderItem } from "@/hooks/use-binder";
import { EditorToolbar } from "./editor-toolbar";

interface TipTapEditorProps {
  itemId: string;
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

export function TipTapEditor({ itemId, projectId, readOnly = false }: TipTapEditorProps) {
  const { data: item } = useBinderItem(itemId);
  const updateItem = useUpdateBinderItem();
  const setSaveStatus = useUIStore((s) => s.setSaveStatus);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitializedRef = useRef(false);
  const currentItemIdRef = useRef(itemId);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      UnderlineExt,
      Placeholder.configure({
        placeholder: "ここに本文を入力...",
      }),
      CharacterCount,
    ],
    editable: !readOnly,
    content: item?.content || "",
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

        setSaveStatus("saving");
        updateItem.mutate(
          {
            id: currentItemIdRef.current,
            projectId,
            data: {
              content: json,
              wordCount: wc,
            },
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

  // Update content when item changes (switching scenes)
  useEffect(() => {
    if (editor && item) {
      currentItemIdRef.current = itemId;
      isInitializedRef.current = false;
      editor.commands.setContent(item.content || "");
      // Small delay so the onUpdate doesn't fire for the setContent
      requestAnimationFrame(() => {
        isInitializedRef.current = true;
      });
    }
  }, [editor, itemId, item?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  if (!item) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        Select a scene to start writing
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
