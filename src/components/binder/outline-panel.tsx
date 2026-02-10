"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import type { Editor } from "@tiptap/react";
import {
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ArrowLeftFromLine,
  ArrowRightFromLine,
  Trash2,
  RotateCcw,
  X,
  GripVertical,
  BookOpen,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { useManuscriptContent } from "@/hooks/use-manuscript";
import {
  parseOutline,
  findHeadingPMPosition,
  changeSectionLevel,
  moveSection,
  swapSections,
  extractSectionContent,
  deleteSection,
} from "@/lib/outline";
import {
  useTrashItems,
  useTrashSection,
  useRestoreSection,
  useDeleteTrashItem,
} from "@/hooks/use-trash";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { OutlineItem, SectionTrashItem } from "@/types";

const SKIP_CONFIRM_KEY = "novelforge-skip-delete-confirm";

interface OutlinePanelProps {
  projectId: string;
  editor: Editor | null;
}

// ============================================================
// H1 item (non-sortable, no actions)
// ============================================================

function H1Item({
  item,
  isActive,
  hasChildren,
  isCollapsed,
  onToggleCollapse,
  onScrollTo,
  children,
}: {
  item: OutlineItem;
  isActive: boolean;
  hasChildren: boolean;
  isCollapsed: boolean;
  onToggleCollapse: (id: string) => void;
  onScrollTo: (item: OutlineItem) => void;
  children?: React.ReactNode;
}) {
  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-1 rounded-sm px-2 py-1 text-sm cursor-pointer select-none",
          isActive
            ? "border-l-2 border-primary bg-accent/50 text-foreground"
            : "border-l-2 border-transparent hover:bg-accent/30"
        )}
        onClick={() => onScrollTo(item)}
      >
        {hasChildren ? (
          <button
            className="flex h-4 w-4 items-center justify-center shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              onToggleCollapse(item.id);
            }}
          >
            {isCollapsed ? (
              <ChevronRight className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </button>
        ) : (
          <span className="w-4 shrink-0" />
        )}
        <BookOpen className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <span className="flex-1 min-w-0 truncate font-bold">{item.title}</span>
        {item.wordCount > 0 && (
          <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">
            {item.wordCount.toLocaleString()}
          </span>
        )}
      </div>
      {hasChildren && !isCollapsed && children}
    </div>
  );
}

// ============================================================
// Sortable section item (H2-H4)
// ============================================================

function SectionItem({
  item,
  depth,
  isActive,
  hasChildren,
  isCollapsed,
  canMoveUp,
  canMoveDown,
  onToggleCollapse,
  onScrollTo,
  onMoveUp,
  onMoveDown,
  onLevelUp,
  onLevelDown,
  onDelete,
  children,
}: {
  item: OutlineItem;
  depth: number;
  isActive: boolean;
  hasChildren: boolean;
  isCollapsed: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onToggleCollapse: (id: string) => void;
  onScrollTo: (item: OutlineItem) => void;
  onMoveUp: (idx: number) => void;
  onMoveDown: (idx: number) => void;
  onLevelUp: (idx: number) => void;
  onLevelDown: (idx: number) => void;
  onDelete: (item: OutlineItem) => void;
  children?: React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const indent = depth * 16;

  return (
    <div ref={setNodeRef} style={style}>
      <div
        className={cn(
          "group/row flex items-center gap-0.5 rounded-sm py-0.5 text-sm cursor-pointer select-none",
          isDragging && "opacity-50 bg-accent/30",
          isActive
            ? "border-l-2 border-primary bg-accent/50 text-foreground"
            : "border-l-2 border-transparent hover:bg-accent/30"
        )}
        style={{ paddingLeft: `${indent + 4}px`, paddingRight: "4px" }}
        onClick={() => onScrollTo(item)}
      >
        {/* Drag handle */}
        <button
          className="flex h-5 w-5 items-center justify-center shrink-0 text-muted-foreground/40 hover:text-muted-foreground cursor-grab active:cursor-grabbing"
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-3 w-3" />
        </button>

        {/* Collapse toggle */}
        {hasChildren ? (
          <button
            className="flex h-4 w-4 items-center justify-center shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              onToggleCollapse(item.id);
            }}
          >
            {isCollapsed ? (
              <ChevronRight className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </button>
        ) : (
          <span className="w-4 shrink-0" />
        )}

        {/* Title */}
        <span className="flex-1 min-w-0 truncate">{item.title}</span>

        {/* Word count */}
        {item.wordCount > 0 && (
          <span className="text-[10px] text-muted-foreground tabular-nums shrink-0 mr-1">
            {item.wordCount.toLocaleString()}
          </span>
        )}

        {/* Action buttons — visible on row hover */}
        <div className="flex items-center shrink-0 opacity-0 group-hover/row:opacity-100 transition-opacity">
          {canMoveUp && (
            <button
              className="flex h-5 w-5 items-center justify-center rounded hover:bg-accent text-muted-foreground hover:text-foreground"
              title="上に移動"
              onClick={(e) => { e.stopPropagation(); onMoveUp(item.headingIndex); }}
            >
              <ChevronUp className="h-3 w-3" />
            </button>
          )}
          {canMoveDown && (
            <button
              className="flex h-5 w-5 items-center justify-center rounded hover:bg-accent text-muted-foreground hover:text-foreground"
              title="下に移動"
              onClick={(e) => { e.stopPropagation(); onMoveDown(item.headingIndex); }}
            >
              <ChevronDown className="h-3 w-3" />
            </button>
          )}
          {item.level > 2 && (
            <button
              className="flex h-5 w-5 items-center justify-center rounded hover:bg-accent text-muted-foreground hover:text-foreground"
              title="レベルを上げる"
              onClick={(e) => { e.stopPropagation(); onLevelUp(item.headingIndex); }}
            >
              <ArrowLeftFromLine className="h-3 w-3" />
            </button>
          )}
          {item.level < 4 && (
            <button
              className="flex h-5 w-5 items-center justify-center rounded hover:bg-accent text-muted-foreground hover:text-foreground"
              title="レベルを下げる"
              onClick={(e) => { e.stopPropagation(); onLevelDown(item.headingIndex); }}
            >
              <ArrowRightFromLine className="h-3 w-3" />
            </button>
          )}
          <button
            className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:bg-destructive/20 hover:text-destructive"
            title="ゴミ箱へ移動"
            onClick={(e) => { e.stopPropagation(); onDelete(item); }}
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>
      {hasChildren && !isCollapsed && children}
    </div>
  );
}

// ============================================================
// Trash item
// ============================================================

function TrashItem({
  item,
  onRestore,
  onDelete,
}: {
  item: SectionTrashItem;
  onRestore: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const dateStr = new Date(item.deletedAt).toLocaleDateString("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="flex items-center gap-1 px-3 py-1 text-xs text-muted-foreground hover:bg-accent/30 rounded-sm">
      <span className="flex-1 min-w-0 truncate">{item.title}</span>
      <span className="text-[10px] tabular-nums shrink-0">{dateStr}</span>
      <button
        className="flex h-5 w-5 items-center justify-center rounded hover:bg-accent hover:text-foreground"
        title="復元"
        onClick={() => onRestore(item.id)}
      >
        <RotateCcw className="h-3 w-3" />
      </button>
      <button
        className="flex h-5 w-5 items-center justify-center rounded hover:bg-destructive/20 hover:text-destructive"
        title="完全削除"
        onClick={() => onDelete(item.id)}
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

// ============================================================
// Main OutlinePanel
// ============================================================

export function OutlinePanel({ projectId, editor }: OutlinePanelProps) {
  const { data: manuscript } = useManuscriptContent(projectId);
  const { data: trashItems = [] } = useTrashItems(projectId);
  const trashSection = useTrashSection();
  const restoreSection = useRestoreSection();
  const deleteTrashItem = useDeleteTrashItem();

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [activeHeadingId, setActiveHeadingId] = useState<string | null>(null);
  const [trashOpen, setTrashOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<OutlineItem | null>(null);
  const [skipConfirm, setSkipConfirm] = useState(false);
  const [docVersion, setDocVersion] = useState(0);

  useEffect(() => {
    const stored = localStorage.getItem(SKIP_CONFIRM_KEY);
    if (stored === "true") setSkipConfirm(true);
  }, []);

  // Track editor document changes for live outline updates
  useEffect(() => {
    if (!editor) return;
    const onUpdate = () => setDocVersion((v) => v + 1);
    editor.on("update", onUpdate);
    // Also bump when editor first becomes available
    setDocVersion((v) => v + 1);
    return () => { editor.off("update", onUpdate); };
  }, [editor]);

  const outline = useMemo(() => {
    // Parse from editor's live state for immediate updates
    if (editor) {
      return parseOutline(editor.getJSON());
    }
    // Fallback to API data when editor isn't ready
    if (manuscript?.content) {
      return parseOutline(manuscript.content);
    }
    return [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, docVersion, manuscript?.content]);

  // Flatten for DnD ids (H2+ only)
  const sortableIds = useMemo(() => {
    const ids: string[] = [];
    function walk(items: OutlineItem[]) {
      for (const item of items) {
        if (item.level > 1) ids.push(item.id);
        if (item.children.length > 0) walk(item.children);
      }
    }
    walk(outline);
    return ids;
  }, [outline]);

  // Flat lookup for DnD
  const flatMap = useMemo(() => {
    const map = new Map<string, OutlineItem>();
    function walk(items: OutlineItem[]) {
      for (const item of items) {
        map.set(item.id, item);
        if (item.children.length > 0) walk(item.children);
      }
    }
    walk(outline);
    return map;
  }, [outline]);

  // Track cursor → active heading (debounced via RAF)
  useEffect(() => {
    if (!editor) return;
    let rafId: number | null = null;

    const updateActiveHeading = () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const { from } = editor.state.selection;
        let currentId: string | null = null;
        let count = 0;
        editor.state.doc.descendants((node, pos) => {
          if (node.type.name === "heading") {
            if (pos <= from) currentId = `heading-${count}`;
            count++;
            if (pos > from) return false;
          }
        });
        setActiveHeadingId(currentId);
      });
    };

    editor.on("selectionUpdate", updateActiveHeading);
    updateActiveHeading();
    return () => {
      editor.off("selectionUpdate", updateActiveHeading);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [editor]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const toggleCollapse = useCallback((id: string) => {
    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const scrollToHeading = useCallback(
    (item: OutlineItem) => {
      if (!editor) return;
      const pos = findHeadingPMPosition(editor, item.headingIndex);
      if (pos !== null) {
        editor.chain().setTextSelection(pos).scrollIntoView().run();
      }
    },
    [editor]
  );

  const handleMoveUp = useCallback(
    (idx: number) => { if (editor) moveSection(editor, idx, "up"); },
    [editor]
  );
  const handleMoveDown = useCallback(
    (idx: number) => { if (editor) moveSection(editor, idx, "down"); },
    [editor]
  );

  const handleLevelUp = useCallback(
    (idx: number) => {
      if (!editor) return;
      const node = findHeadingNode(editor, idx);
      if (node && node.level > 2) changeSectionLevel(editor, idx, node.level - 1);
    },
    [editor]
  );
  const handleLevelDown = useCallback(
    (idx: number) => {
      if (!editor) return;
      const node = findHeadingNode(editor, idx);
      if (node && node.level < 4) changeSectionLevel(editor, idx, node.level + 1);
    },
    [editor]
  );

  const performDelete = useCallback(
    (item: OutlineItem) => {
      if (!editor) return;
      const content = extractSectionContent(editor, item.headingIndex);
      if (!content) return;
      trashSection.mutate({ projectId, title: item.title, level: item.level, content });
      deleteSection(editor, item.headingIndex);
    },
    [editor, projectId, trashSection]
  );

  const handleDeleteRequest = useCallback(
    (item: OutlineItem) => {
      if (skipConfirm) {
        performDelete(item);
      } else {
        setDeleteTarget(item);
      }
    },
    [skipConfirm, performDelete]
  );

  const handleConfirmDelete = useCallback(() => {
    if (!deleteTarget) return;
    performDelete(deleteTarget);
    setDeleteTarget(null);
  }, [deleteTarget, performDelete]);

  const handleRestore = useCallback(
    (trashId: string) => {
      if (!editor) return;
      restoreSection.mutate(
        { projectId, trashId },
        {
          onSuccess: (data) => {
            if (data.content) {
              const endPos = editor.state.doc.content.size;
              editor.chain().insertContentAt(endPos, data.content).run();
            }
          },
        }
      );
    },
    [editor, projectId, restoreSection]
  );

  const handlePermanentDelete = useCallback(
    (trashId: string) => { deleteTrashItem.mutate({ projectId, trashId }); },
    [projectId, deleteTrashItem]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      if (!editor) return;
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const a = flatMap.get(active.id as string);
      const o = flatMap.get(over.id as string);
      if (!a || !o || a.level !== o.level) return;

      swapSections(editor, a.headingIndex, o.headingIndex);
    },
    [editor, flatMap]
  );

  // Sibling checks
  const hasSiblingAbove = (item: OutlineItem, siblings: OutlineItem[]) => {
    const idx = siblings.findIndex((s) => s.id === item.id);
    return idx > 0;
  };
  const hasSiblingBelow = (item: OutlineItem, siblings: OutlineItem[]) => {
    const idx = siblings.findIndex((s) => s.id === item.id);
    return idx >= 0 && idx < siblings.length - 1;
  };

  // Recursive render
  function renderItem(item: OutlineItem, depth: number, siblings: OutlineItem[]) {
    const isCollapsed_ = collapsed[item.id] ?? false;
    const hasChildren = item.children.length > 0;
    const isActive = activeHeadingId === item.id;

    if (item.level === 1) {
      return (
        <H1Item
          key={item.id}
          item={item}
          isActive={isActive}
          hasChildren={hasChildren}
          isCollapsed={isCollapsed_}
          onToggleCollapse={toggleCollapse}
          onScrollTo={scrollToHeading}
        >
          {item.children.map((child) => renderItem(child, depth + 1, item.children))}
        </H1Item>
      );
    }

    return (
      <SectionItem
        key={item.id}
        item={item}
        depth={depth}
        isActive={isActive}
        hasChildren={hasChildren}
        isCollapsed={isCollapsed_}
        canMoveUp={hasSiblingAbove(item, siblings)}
        canMoveDown={hasSiblingBelow(item, siblings)}
        onToggleCollapse={toggleCollapse}
        onScrollTo={scrollToHeading}
        onMoveUp={handleMoveUp}
        onMoveDown={handleMoveDown}
        onLevelUp={handleLevelUp}
        onLevelDown={handleLevelDown}
        onDelete={handleDeleteRequest}
      >
        {item.children.map((child) => renderItem(child, depth + 1, item.children))}
      </SectionItem>
    );
  }

  if (outline.length === 0) {
    return (
      <div className="p-4 text-sm text-muted-foreground text-center">
        アウトラインはありません
        <br />
        セクションを追加してください
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <ScrollArea className="flex-1">
        <div className="p-1">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
              {outline.map((item) => renderItem(item, 0, outline))}
            </SortableContext>
          </DndContext>
        </div>
      </ScrollArea>

      {/* Trash section */}
      <div className="border-t shrink-0">
        <button
          className="flex w-full items-center gap-1.5 px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent/30"
          onClick={() => setTrashOpen((prev) => !prev)}
        >
          {trashOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          <Trash2 className="h-3 w-3" />
          <span>ゴミ箱</span>
          {trashItems.length > 0 && (
            <span className="text-[10px] tabular-nums">({trashItems.length})</span>
          )}
        </button>
        {trashOpen && (
          <div className="max-h-48 overflow-y-auto">
            {trashItems.length === 0 ? (
              <div className="px-3 py-2 text-[10px] text-muted-foreground text-center">
                ゴミ箱は空です
              </div>
            ) : (
              trashItems.map((item) => (
                <TrashItem
                  key={item.id}
                  item={item}
                  onRestore={handleRestore}
                  onDelete={handlePermanentDelete}
                />
              ))
            )}
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>セクションの削除</AlertDialogTitle>
            <AlertDialogDescription>
              「{deleteTarget?.title}」とその内容を削除します。下位のセクションもすべてゴミ箱に移動されます。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex items-center gap-2 py-2">
            <Checkbox
              id="skip-confirm"
              checked={skipConfirm}
              onCheckedChange={(checked) => {
                const val = checked === true;
                setSkipConfirm(val);
                localStorage.setItem(SKIP_CONFIRM_KEY, String(val));
              }}
            />
            <label htmlFor="skip-confirm" className="text-sm text-muted-foreground cursor-pointer">
              次回から確認しない
            </label>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleConfirmDelete}>
              削除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ============================================================
// Helper: get heading node info by index
// ============================================================

function findHeadingNode(editor: Editor, headingIndex: number): { level: number } | null {
  let count = 0;
  let result: { level: number } | null = null;
  editor.state.doc.descendants((node) => {
    if (result) return false;
    if (node.type.name === "heading") {
      if (count === headingIndex) {
        result = { level: node.attrs.level ?? 1 };
        return false;
      }
      count++;
    }
  });
  return result;
}
