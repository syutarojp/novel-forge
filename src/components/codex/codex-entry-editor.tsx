"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import UnderlineExt from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import { useCodexEntry, useUpdateCodexEntry, useDeleteCodexEntry } from "@/hooks/use-codex";
import { useUIStore } from "@/stores/ui-store";
import { getCodexTypeDef, CODEX_COLORS } from "@/lib/codex-utils";
import { EditorToolbar } from "@/components/editor/editor-toolbar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Plus, Trash2, Globe } from "lucide-react";
import type { CodexEntry } from "@/types";
import type { JSONContent } from "@tiptap/react";

interface CodexEntryEditorProps {
  entryId: string;
  projectId: string;
}

export function CodexEntryEditor({ entryId, projectId }: CodexEntryEditorProps) {
  const { data: entry } = useCodexEntry(entryId, projectId);
  const updateEntry = useUpdateCodexEntry();
  const deleteEntry = useDeleteCodexEntry();
  const setSelectedCodexEntryId = useUIStore((s) => s.setSelectedCodexEntryId);

  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [aliasInput, setAliasInput] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [fieldKey, setFieldKey] = useState("");
  const [fieldValue, setFieldValue] = useState("");

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const editorInitRef = useRef(false);

  // Auto-save helper
  const debounceSave = useCallback(
    (data: Partial<CodexEntry>) => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        updateEntry.mutate({ id: entryId, projectId, data });
      }, 800);
    },
    [entryId, projectId, updateEntry]
  );

  // Sync local state
  useEffect(() => {
    if (entry) {
      setName(entry.name);
      setNotes(entry.notes || "");
    }
  }, [entry?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Description TipTap editor
  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
        UnderlineExt,
        Placeholder.configure({ placeholder: "説明を入力..." }),
      ],
      content: entry?.description || "",
      onUpdate: ({ editor: e }) => {
        if (!editorInitRef.current) return;
        debounceSave({ description: e.getJSON() as JSONContent });
      },
      immediatelyRender: false,
    },
  );

  // Sync editor content on entry switch
  useEffect(() => {
    if (editor && entry) {
      editorInitRef.current = false;
      editor.commands.setContent(entry.description || "");
      requestAnimationFrame(() => {
        editorInitRef.current = true;
      });
    }
  }, [editor, entry?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  if (!entry) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <div className="text-center space-y-2">
          <Globe className="h-16 w-16 opacity-10 mx-auto" />
          <p className="text-lg font-medium">エントリが選択されていません</p>
          <p className="text-sm">左の世界観パネルからエントリを選択してください</p>
        </div>
      </div>
    );
  }

  const typeDef = getCodexTypeDef(entry.type);
  const TypeIcon = typeDef.icon;

  const handleNameChange = (value: string) => {
    setName(value);
    debounceSave({ name: value });
  };

  const handleNotesChange = (value: string) => {
    setNotes(value);
    debounceSave({ notes: value });
  };

  const handleAddAlias = () => {
    const v = aliasInput.trim();
    if (!v || entry.aliases.includes(v)) return;
    const newAliases = [...entry.aliases, v];
    updateEntry.mutate({ id: entryId, projectId, data: { aliases: newAliases } });
    setAliasInput("");
  };

  const handleRemoveAlias = (alias: string) => {
    const newAliases = entry.aliases.filter((a) => a !== alias);
    updateEntry.mutate({ id: entryId, projectId, data: { aliases: newAliases } });
  };

  const handleAddTag = () => {
    const v = tagInput.trim();
    if (!v || entry.tags.includes(v)) return;
    const newTags = [...entry.tags, v];
    updateEntry.mutate({ id: entryId, projectId, data: { tags: newTags } });
    setTagInput("");
  };

  const handleRemoveTag = (tag: string) => {
    const newTags = entry.tags.filter((t) => t !== tag);
    updateEntry.mutate({ id: entryId, projectId, data: { tags: newTags } });
  };

  const handleAddField = () => {
    const k = fieldKey.trim();
    const v = fieldValue.trim();
    if (!k) return;
    const newFields = { ...entry.fieldValues, [k]: v };
    updateEntry.mutate({ id: entryId, projectId, data: { fieldValues: newFields } });
    setFieldKey("");
    setFieldValue("");
  };

  const handleRemoveField = (key: string) => {
    const newFields = { ...entry.fieldValues };
    delete newFields[key];
    updateEntry.mutate({ id: entryId, projectId, data: { fieldValues: newFields } });
  };

  const handleColorChange = (color: string | null) => {
    updateEntry.mutate({ id: entryId, projectId, data: { color } });
  };

  const handleDelete = () => {
    deleteEntry.mutate(
      { id: entryId, projectId },
      { onSuccess: () => setSelectedCodexEntryId(null) }
    );
  };

  return (
    <div className="flex h-full flex-col">
      <ScrollArea className="flex-1">
        <div className="mx-auto max-w-3xl p-8 space-y-6">
          {/* Header: type badge + name */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1 capitalize">
                <TypeIcon className="h-3 w-3" />
                {typeDef.label}
              </Badge>
              {/* Color dots */}
              <div className="flex items-center gap-1 ml-auto">
                <button
                  onClick={() => handleColorChange(null)}
                  className={`h-5 w-5 rounded-full border-2 transition-colors ${
                    entry.color === null ? "border-primary" : "border-transparent"
                  } bg-muted`}
                  title="色なし"
                />
                {CODEX_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => handleColorChange(c)}
                    className={`h-5 w-5 rounded-full border-2 transition-colors ${
                      entry.color === c ? "border-primary" : "border-transparent"
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <Input
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="text-xl font-semibold border-none px-0 focus-visible:ring-0 shadow-none"
              placeholder="エントリ名"
            />
          </div>

          <Separator />

          {/* Aliases */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">エイリアス</Label>
            <div className="flex flex-wrap gap-1.5">
              {entry.aliases.map((alias) => (
                <Badge key={alias} variant="secondary" className="gap-1">
                  {alias}
                  <button onClick={() => handleRemoveAlias(alias)}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              <div className="flex items-center gap-1">
                <Input
                  value={aliasInput}
                  onChange={(e) => setAliasInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddAlias()}
                  className="h-6 w-32 text-xs"
                  placeholder="追加..."
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Description (TipTap) */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">説明</Label>
            <div className="rounded-md border">
              <EditorToolbar editor={editor} />
              <div className="p-3">
                <EditorContent
                  editor={editor}
                  className="prose prose-sm dark:prose-invert max-w-none min-h-[150px] focus:outline-none"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Notes */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">メモ</Label>
            <Textarea
              value={notes}
              onChange={(e) => handleNotesChange(e.target.value)}
              placeholder="メモを入力..."
              className="min-h-[100px] resize-none text-sm"
            />
          </div>

          <Separator />

          {/* Tags */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">タグ</Label>
            <div className="flex flex-wrap gap-1.5">
              {entry.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="gap-1">
                  {tag}
                  <button onClick={() => handleRemoveTag(tag)}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              <div className="flex items-center gap-1">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
                  className="h-6 w-32 text-xs"
                  placeholder="追加..."
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Custom Fields */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">カスタムフィールド</Label>
            {Object.entries(entry.fieldValues).length > 0 && (
              <div className="space-y-1.5">
                {Object.entries(entry.fieldValues).map(([k, v]) => (
                  <div key={k} className="flex items-center gap-2 text-sm">
                    <span className="font-medium min-w-[80px]">{k}</span>
                    <span className="flex-1 text-muted-foreground">{v}</span>
                    <button
                      onClick={() => handleRemoveField(k)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2">
              <Input
                value={fieldKey}
                onChange={(e) => setFieldKey(e.target.value)}
                className="h-7 flex-1 text-xs"
                placeholder="キー"
              />
              <Input
                value={fieldValue}
                onChange={(e) => setFieldValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddField()}
                className="h-7 flex-1 text-xs"
                placeholder="値"
              />
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2"
                onClick={handleAddField}
                disabled={!fieldKey.trim()}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          <Separator />

          {/* Delete */}
          <div>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1"
              onClick={handleDelete}
            >
              <Trash2 className="h-3.5 w-3.5" />
              エントリを削除
            </Button>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
