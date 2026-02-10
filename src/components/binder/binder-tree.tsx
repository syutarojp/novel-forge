"use client";

import { useRef, useCallback } from "react";
import { Tree, type NodeRendererProps } from "react-arborist";
import { generateKeyBetween } from "fractional-indexing";
import { useUIStore } from "@/stores/ui-store";
import { useUpdateBinderItem, useMoveBinderItem, useDeleteBinderItem, useCreateBinderItem, useBinderItems } from "@/hooks/use-binder";
import type { TreeNode } from "./binder-panel";
import type { BinderItem } from "@/types";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  FileText,
  Folder,
  FolderOpen,
  Trash2,
  ChevronRight,
  ChevronDown,
  FilePlus,
  FolderPlus,
  Pencil,
  Copy,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";

// We need the context-menu shadcn component. First let me check if it exists.
// If not, we'll use a simple approach.

interface BinderTreeProps {
  data: TreeNode[];
  projectId: string;
}

function NodeIcon({ item }: { item: BinderItem }) {
  if (item.type === "trash") return <Trash2 className="h-4 w-4 text-muted-foreground" />;
  if (item.type === "folder") return <Folder className="h-4 w-4 text-blue-500" />;
  return <FileText className="h-4 w-4 text-muted-foreground" />;
}

function Node({ node, style, dragHandle }: NodeRendererProps<TreeNode>) {
  const selectedItemId = useUIStore((s) => s.selectedItemId);
  const setSelectedItemId = useUIStore((s) => s.setSelectedItemId);
  const updateItem = useUpdateBinderItem();
  const isSelected = selectedItemId === node.data.id;
  const item = node.data.data;

  return (
    <div
      style={style}
      ref={dragHandle}
      className={cn(
        "group flex items-center gap-1 rounded-sm px-1 py-0.5 text-sm cursor-pointer select-none",
        isSelected
          ? "border-l-2 border-primary bg-accent/50 text-foreground"
          : "border-l-2 border-transparent hover:bg-accent/30"
      )}
      onClick={() => setSelectedItemId(node.data.id)}
      onDoubleClick={() => {
        if (item.type !== "trash") {
          node.edit();
        }
      }}
    >
      {node.data.children !== undefined ? (
        <button
          className="flex h-4 w-4 items-center justify-center"
          onClick={(e) => {
            e.stopPropagation();
            node.toggle();
          }}
        >
          {node.isOpen ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronRight className="h-3 w-3" />
          )}
        </button>
      ) : (
        <span className="w-4" />
      )}
      <NodeIcon item={item} />
      {item.type === "scene" && (
        <span className="h-1.5 w-1.5 rounded-full bg-green-500 shrink-0" />
      )}
      {node.isEditing ? (
        <input
          type="text"
          defaultValue={node.data.name}
          className="flex-1 bg-background px-1 py-0 text-sm border rounded outline-none"
          autoFocus
          onFocus={(e) => e.target.select()}
          onBlur={(e) => {
            node.submit(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") node.submit((e.target as HTMLInputElement).value);
            if (e.key === "Escape") node.reset();
          }}
        />
      ) : (
        <span className="flex-1 truncate">{node.data.name}</span>
      )}
      {item.wordCount > 0 && item.type === "scene" && (
        <span className="text-[10px] text-muted-foreground tabular-nums">
          {item.wordCount.toLocaleString()}
        </span>
      )}
      <MoreHorizontal className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
    </div>
  );
}

export function BinderTree({ data, projectId }: BinderTreeProps) {
  const setSelectedItemId = useUIStore((s) => s.setSelectedItemId);
  const updateItem = useUpdateBinderItem();
  const moveItem = useMoveBinderItem();
  const deleteItem = useDeleteBinderItem();
  const { data: allItems = [] } = useBinderItems(projectId);

  const handleRename = useCallback(
    ({ id, name }: { id: string; name: string }) => {
      updateItem.mutate({ id, projectId, data: { title: name } });
    },
    [updateItem, projectId]
  );

  const handleMove = useCallback(
    ({ dragIds, parentId, index }: { dragIds: string[]; parentId: string | null; index: number }) => {
      const siblings = allItems
        .filter((item) => item.parentId === parentId && !dragIds.includes(item.id))
        .sort((a, b) => (a.sortOrder < b.sortOrder ? -1 : 1));

      for (const dragId of dragIds) {
        const before = index > 0 ? siblings[index - 1]?.sortOrder ?? null : null;
        const after = index < siblings.length ? siblings[index]?.sortOrder ?? null : null;
        const newSortOrder = generateKeyBetween(before, after);

        moveItem.mutate({
          id: dragId,
          projectId,
          newParentId: parentId,
          newSortOrder,
        });
      }
    },
    [allItems, moveItem, projectId]
  );

  const handleDelete = useCallback(
    ({ ids }: { ids: string[] }) => {
      // Move to trash instead of deleting
      const trashItem = allItems.find((item) => item.type === "trash" && item.parentId === null);
      if (trashItem) {
        for (const id of ids) {
          const item = allItems.find((i) => i.id === id);
          if (item && item.type !== "trash") {
            moveItem.mutate({
              id,
              projectId,
              newParentId: trashItem.id,
              newSortOrder: generateKeyBetween(null, null),
            });
          }
        }
      }
    },
    [allItems, moveItem, projectId]
  );

  return (
    <div className="p-1">
      <Tree
        data={data}
        width="100%"
        indent={20}
        rowHeight={32}
        openByDefault={true}
        disableDrag={false}
        disableDrop={(args) => {
          // Don't allow dropping into scene nodes or trash
          if (args.parentNode?.data?.data?.type === "scene") return true;
          return false;
        }}
        onRename={handleRename}
        onMove={handleMove}
        onDelete={handleDelete}
        onSelect={(nodes) => {
          if (nodes.length > 0) {
            setSelectedItemId(nodes[0].data.id);
          }
        }}
      >
        {Node}
      </Tree>
    </div>
  );
}
