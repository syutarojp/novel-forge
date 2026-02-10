"use client";

import { useMemo } from "react";
import { useBinderItems, useCreateBinderItem } from "@/hooks/use-binder";
import { useUIStore } from "@/stores/ui-store";
import { BinderTree } from "./binder-tree";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FilePlus, FolderPlus } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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

export function BinderPanel({ projectId }: BinderPanelProps) {
  const { data: items = [] } = useBinderItems(projectId);
  const createItem = useCreateBinderItem();
  const selectedItemId = useUIStore((s) => s.selectedItemId);

  const treeData = useMemo(() => buildTree(items, null), [items]);

  const handleAddScene = () => {
    // Find the manuscript folder or first folder
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
      .filter((item) => item.parentId === null && item.type !== "trash")
      .sort((a, b) => (a.sortOrder < b.sortOrder ? -1 : 1));
    // Insert before trash
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
      <div className="flex items-center justify-between border-b px-3 py-2">
        <span className="text-xs font-semibold uppercase text-muted-foreground">
          バインダー
        </span>
        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={handleAddScene}
              >
                <FilePlus className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>シーン追加</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={handleAddFolder}
              >
                <FolderPlus className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>フォルダ追加</TooltipContent>
          </Tooltip>
        </div>
      </div>
      <ScrollArea className="flex-1">
        <BinderTree data={treeData} projectId={projectId} />
      </ScrollArea>
    </div>
  );
}
