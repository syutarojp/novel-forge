"use client";

import { useCallback, createContext, useContext } from "react";
import { Tree, type NodeRendererProps } from "react-arborist";
import { generateKeyBetween } from "fractional-indexing";
import { useUIStore } from "@/stores/ui-store";
import { useUpdateBinderItem, useMoveBinderItem, useBinderItems } from "@/hooks/use-binder";
import type { TreeNode } from "./binder-panel";
import type { BinderItem } from "@/types";
import {
  FileText,
  Trash2,
  ChevronRight,
  ChevronDown,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BinderTreeProps {
  data: TreeNode[];
  projectId: string;
}

// Context to pass tree-level handlers to Node component
interface TreeActions {
  allItems: BinderItem[];
  projectId: string;
  onIndent: (id: string) => void;
  onOutdent: (id: string) => void;
  onTrash: (id: string) => void;
}

const TreeActionsContext = createContext<TreeActions | null>(null);

function NodeIcon({ item }: { item: BinderItem }) {
  if (item.type === "trash") return <Trash2 className="h-4 w-4 text-muted-foreground" />;
  return <FileText className="h-4 w-4 text-muted-foreground" />;
}

function Node({ node, style, dragHandle }: NodeRendererProps<TreeNode>) {
  const selectedItemId = useUIStore((s) => s.selectedItemId);
  const setSelectedItemId = useUIStore((s) => s.setSelectedItemId);
  const actions = useContext(TreeActionsContext)!;
  const isSelected = selectedItemId === node.data.id;
  const item = node.data.data;
  const isTrash = item.type === "trash";

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
        if (!isTrash) node.edit();
      }}
    >
      {node.data.children !== undefined && (node.data.children.length > 0 || isTrash) ? (
        <button
          className="flex h-4 w-4 items-center justify-center shrink-0"
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
        <span className="w-4 shrink-0" />
      )}
      <NodeIcon item={item} />
      {node.isEditing ? (
        <input
          type="text"
          defaultValue={node.data.name}
          className="flex-1 min-w-0 bg-background px-1 py-0 text-sm border rounded outline-none"
          autoFocus
          onFocus={(e) => e.target.select()}
          onBlur={(e) => node.submit(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") node.submit((e.target as HTMLInputElement).value);
            if (e.key === "Escape") node.reset();
          }}
        />
      ) : (
        <span className="flex-1 min-w-0 truncate">{node.data.name}</span>
      )}
      {item.wordCount > 0 && item.type === "scene" && (
        <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">
          {item.wordCount.toLocaleString()}
        </span>
      )}
      {/* Action buttons (hover) */}
      {!isTrash && !node.isEditing && (
        <div className="flex items-center gap-0 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            className="flex h-5 w-5 items-center justify-center rounded hover:bg-accent"
            title="ネスト（右へ）"
            onClick={(e) => {
              e.stopPropagation();
              actions.onIndent(node.data.id);
            }}
          >
            <ArrowRight className="h-3 w-3 text-muted-foreground" />
          </button>
          <button
            className="flex h-5 w-5 items-center justify-center rounded hover:bg-accent"
            title="ネスト解除（左へ）"
            onClick={(e) => {
              e.stopPropagation();
              actions.onOutdent(node.data.id);
            }}
          >
            <ArrowLeft className="h-3 w-3 text-muted-foreground" />
          </button>
          <button
            className="flex h-5 w-5 items-center justify-center rounded hover:bg-destructive/20"
            title="ゴミ箱へ"
            onClick={(e) => {
              e.stopPropagation();
              actions.onTrash(node.data.id);
            }}
          >
            <Trash2 className="h-3 w-3 text-muted-foreground" />
          </button>
        </div>
      )}
    </div>
  );
}

export function BinderTree({ data, projectId }: BinderTreeProps) {
  const setSelectedItemId = useUIStore((s) => s.setSelectedItemId);
  const updateItem = useUpdateBinderItem();
  const moveItem = useMoveBinderItem();
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

  // Indent: move item as last child of the sibling above it
  const handleIndent = useCallback(
    (id: string) => {
      const item = allItems.find((i) => i.id === id);
      if (!item) return;

      // Find siblings at the same level, sorted
      const siblings = allItems
        .filter((i) => i.parentId === item.parentId && i.type !== "trash")
        .sort((a, b) => (a.sortOrder < b.sortOrder ? -1 : 1));

      const idx = siblings.findIndex((s) => s.id === id);
      if (idx <= 0) return; // Can't indent first item

      const newParent = siblings[idx - 1];
      // Place as last child of the new parent
      const newParentChildren = allItems
        .filter((i) => i.parentId === newParent.id)
        .sort((a, b) => (a.sortOrder < b.sortOrder ? -1 : 1));
      const lastChild = newParentChildren.length > 0 ? newParentChildren[newParentChildren.length - 1] : null;

      moveItem.mutate({
        id,
        projectId,
        newParentId: newParent.id,
        newSortOrder: generateKeyBetween(lastChild?.sortOrder ?? null, null),
      });
    },
    [allItems, moveItem, projectId]
  );

  // Outdent: move item to parent's level, right after parent
  const handleOutdent = useCallback(
    (id: string) => {
      const item = allItems.find((i) => i.id === id);
      if (!item || !item.parentId) return; // Already at root

      const parent = allItems.find((i) => i.id === item.parentId);
      if (!parent) return;

      // Place right after parent in grandparent's children
      const grandparentChildren = allItems
        .filter((i) => i.parentId === parent.parentId && i.type !== "trash")
        .sort((a, b) => (a.sortOrder < b.sortOrder ? -1 : 1));
      const parentIdx = grandparentChildren.findIndex((s) => s.id === parent.id);
      const after = parent.sortOrder;
      const next = parentIdx + 1 < grandparentChildren.length ? grandparentChildren[parentIdx + 1] : null;

      moveItem.mutate({
        id,
        projectId,
        newParentId: parent.parentId,
        newSortOrder: generateKeyBetween(after, next?.sortOrder ?? null),
      });
    },
    [allItems, moveItem, projectId]
  );

  // Move to trash
  const handleTrash = useCallback(
    (id: string) => {
      const trashItem = allItems.find((item) => item.type === "trash" && item.parentId === null);
      if (!trashItem) return;
      const item = allItems.find((i) => i.id === id);
      if (!item || item.type === "trash") return;

      moveItem.mutate({
        id,
        projectId,
        newParentId: trashItem.id,
        newSortOrder: generateKeyBetween(null, null),
      });
    },
    [allItems, moveItem, projectId]
  );

  const actions: TreeActions = {
    allItems,
    projectId,
    onIndent: handleIndent,
    onOutdent: handleOutdent,
    onTrash: handleTrash,
  };

  return (
    <TreeActionsContext.Provider value={actions}>
      <div className="p-1">
        <Tree
          data={data}
          width="100%"
          indent={20}
          rowHeight={32}
          openByDefault={true}
          disableDrag={false}
          disableDrop={(args) => {
            // Only prevent dropping into trash
            if (args.parentNode?.data?.data?.type === "trash") return true;
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
    </TreeActionsContext.Provider>
  );
}
