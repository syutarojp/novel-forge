"use client";

import { useUIStore } from "@/stores/ui-store";
import { useBinderItem, useBinderItems } from "@/hooks/use-binder";
import { TipTapEditor } from "./tiptap-editor";
import { FileText, PenLine } from "lucide-react";

interface CenterPanelProps {
  projectId: string;
}

export function CenterPanel({ projectId }: CenterPanelProps) {
  const selectedItemId = useUIStore((s) => s.selectedItemId);
  const setSelectedItemId = useUIStore((s) => s.setSelectedItemId);
  const mode = useUIStore((s) => s.mode);
  const { data: selectedItem } = useBinderItem(selectedItemId);
  const { data: allItems = [] } = useBinderItems(projectId);

  // If no item selected, show placeholder
  if (!selectedItemId || !selectedItem) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-6 text-muted-foreground p-8">
        <PenLine className="h-16 w-16 opacity-10" />
        <div className="text-center space-y-2">
          <p className="text-lg font-medium">シーンが選択されていません</p>
          <p className="text-sm">左のバインダーからシーンを選択するか</p>
          <p className="text-sm">
            <kbd className="rounded border bg-muted px-1.5 py-0.5 text-xs font-mono">⌘K</kbd>
            {" "}でシーンを検索
          </p>
        </div>
      </div>
    );
  }

  // For folders, show child scenes
  if (selectedItem.type === "folder" || selectedItem.type === "trash") {
    const childScenes = allItems
      .filter((i) => i.parentId === selectedItemId && i.type === "scene")
      .sort((a, b) => (a.sortOrder < b.sortOrder ? -1 : 1));

    return (
      <div className="flex h-full flex-col p-8">
        <div className="mx-auto max-w-3xl w-full">
          <h2 className="text-xl font-semibold mb-1">{selectedItem.title}</h2>
          <p className="text-sm text-muted-foreground mb-6">
            {childScenes.length > 0
              ? `${childScenes.length} シーン`
              : "シーンがありません"}
          </p>
          {childScenes.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {childScenes.map((scene) => (
                <button
                  key={scene.id}
                  onClick={() => setSelectedItemId(scene.id)}
                  className="text-left rounded-lg border bg-card p-4 hover:bg-accent/50 transition-colors"
                >
                  <p className="font-medium text-sm">{scene.title}</p>
                  {scene.synopsis && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{scene.synopsis}</p>
                  )}
                  <p className="text-[10px] text-muted-foreground mt-2">
                    {scene.wordCount.toLocaleString()} 文字
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <TipTapEditor
      key={selectedItemId}
      itemId={selectedItemId}
      projectId={projectId}
      readOnly={mode === "review"}
    />
  );
}
