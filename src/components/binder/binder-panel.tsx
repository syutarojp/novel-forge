"use client";

import { useMemo } from "react";
import { useBinderItems, useBinderItem, useCreateBinderItem } from "@/hooks/use-binder";
import { useProject } from "@/hooks/use-projects";
import { useUIStore } from "@/stores/ui-store";
import { BinderTree } from "./binder-tree";
import { CodexBrowserPanel } from "@/components/codex/codex-browser-panel";
import { SceneInfoPanel } from "./scene-info-panel";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FilePlus, FolderPlus, Plus, FileText } from "lucide-react";
import type { BinderItem } from "@/types";

interface BinderPanelProps {
  projectId: string;
}

export interface TreeNode {
  id: string;
  name: string;
  children?: TreeNode[];
  data: BinderItem;
}

function buildTree(items: BinderItem[], parentId: string | null): TreeNode[] {
  return items
    .filter((item) => item.parentId === parentId)
    .sort((a, b) => (a.sortOrder < b.sortOrder ? -1 : a.sortOrder > b.sortOrder ? 1 : 0))
    .map((item) => {
      const children = buildTree(items, item.id);
      return {
        id: item.id,
        name: item.title,
        children: item.type === "folder" || item.type === "trash" ? children : undefined,
        data: item,
      };
    });
}

function ResearchPanel({
  items,
  projectId,
}: {
  items: BinderItem[];
  projectId: string;
}) {
  const createItem = useCreateBinderItem();
  const selectedItemId = useUIStore((s) => s.selectedItemId);
  const setSelectedItemId = useUIStore((s) => s.setSelectedItemId);

  const researchItems = useMemo(
    () =>
      items
        .filter((i) => i.type === "research")
        .sort((a, b) => (a.sortOrder < b.sortOrder ? -1 : 1)),
    [items]
  );

  const handleAdd = () => {
    const lastSort =
      researchItems.length > 0
        ? researchItems[researchItems.length - 1].sortOrder
        : null;
    createItem.mutate(
      {
        projectId,
        parentId: null,
        type: "research",
        title: "無題のリサーチ",
        afterSortOrder: lastSort,
        beforeSortOrder: null,
      },
      {
        onSuccess: (item) => setSelectedItemId(item.id),
      }
    );
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-end px-3 py-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1 px-2 text-xs"
          onClick={handleAdd}
        >
          <Plus className="h-3.5 w-3.5" />
          リサーチ
        </Button>
      </div>
      <ScrollArea className="flex-1">
        {researchItems.length > 0 ? (
          <div className="pb-1">
            {researchItems.map((item) => {
              const isSelected = selectedItemId === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedItemId(item.id)}
                  className={`flex w-full items-center gap-2 px-4 py-1.5 text-sm transition-colors hover:bg-accent/50 ${
                    isSelected
                      ? "bg-accent/50 border-l-2 border-primary"
                      : "border-l-2 border-transparent"
                  }`}
                >
                  <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate">{item.title}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="px-4 py-8 text-center text-xs text-muted-foreground">
            <p>リサーチがありません</p>
            <p className="mt-1">「+ リサーチ」から追加してください</p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

export function BinderPanel({ projectId }: BinderPanelProps) {
  const { data: items = [] } = useBinderItems(projectId);
  const { data: project } = useProject(projectId);
  const createItem = useCreateBinderItem();
  const binderTab = useUIStore((s) => s.binderTab);
  const setBinderTab = useUIStore((s) => s.setBinderTab);
  const selectedItemId = useUIStore((s) => s.selectedItemId);
  const { data: selectedItem } = useBinderItem(selectedItemId);

  const treeData = useMemo(
    () => buildTree(items.filter((i) => i.type !== "research"), null),
    [items]
  );

  const handleAddScene = () => {
    const manuscriptFolder = items.find(
      (item) => item.parentId === null && item.type === "folder" && item.title === "原稿"
    );
    const parentId = manuscriptFolder?.id ?? null;
    const siblings = items
      .filter((item) => item.parentId === parentId)
      .sort((a, b) => (a.sortOrder < b.sortOrder ? -1 : 1));
    const lastSortOrder = siblings.length > 0 ? siblings[siblings.length - 1].sortOrder : null;

    createItem.mutate({
      projectId,
      parentId,
      type: "scene",
      afterSortOrder: lastSortOrder,
      beforeSortOrder: null,
    });
  };

  const handleAddFolder = () => {
    const rootItems = items
      .filter((item) => item.parentId === null && item.type !== "trash" && item.type !== "research")
      .sort((a, b) => (a.sortOrder < b.sortOrder ? -1 : 1));
    const trashItem = items.find((item) => item.type === "trash" && item.parentId === null);
    const lastNonTrash = rootItems.length > 0 ? rootItems[rootItems.length - 1] : null;

    createItem.mutate({
      projectId,
      parentId: null,
      type: "folder",
      afterSortOrder: lastNonTrash?.sortOrder ?? null,
      beforeSortOrder: trashItem?.sortOrder ?? null,
    });
  };

  return (
    <div className="flex h-full flex-col border-r bg-muted/30">
      {/* Header with project name and action buttons */}
      <div className="flex items-center justify-between border-b px-3 py-2">
        <span className="text-sm font-semibold truncate">{project?.title ?? "バインダー"}</span>
        {binderTab === "manuscript" && (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs" onClick={handleAddScene}>
              <FilePlus className="h-3.5 w-3.5" />
              シーン
            </Button>
            <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs" onClick={handleAddFolder}>
              <FolderPlus className="h-3.5 w-3.5" />
              フォルダ
            </Button>
          </div>
        )}
      </div>

      {/* Tab switcher */}
      <Tabs
        value={binderTab}
        onValueChange={(v) => setBinderTab(v as "manuscript" | "codex" | "research")}
        className="flex flex-1 flex-col"
      >
        <TabsList className="mx-2 mt-2 grid w-auto grid-cols-3">
          <TabsTrigger value="manuscript" className="text-xs">
            原稿
          </TabsTrigger>
          <TabsTrigger value="codex" className="text-xs">
            世界観
          </TabsTrigger>
          <TabsTrigger value="research" className="text-xs">
            リサーチ
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 min-h-0 flex flex-col">
          {binderTab === "manuscript" && (
            <>
              <ScrollArea className="flex-1 min-h-0">
                <BinderTree data={treeData} projectId={projectId} />
              </ScrollArea>
              {selectedItem?.type === "scene" && selectedItemId && (
                <div className="h-[230px] shrink-0 overflow-hidden">
                  <SceneInfoPanel itemId={selectedItemId} projectId={projectId} />
                </div>
              )}
            </>
          )}
          {binderTab === "codex" && (
            <CodexBrowserPanel projectId={projectId} />
          )}
          {binderTab === "research" && (
            <ResearchPanel items={items} projectId={projectId} />
          )}
        </div>
      </Tabs>

    </div>
  );
}
