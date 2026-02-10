"use client";

import { useState, useEffect, useMemo } from "react";
import type { Editor } from "@tiptap/react";
import { ChevronRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useManuscriptContent } from "@/hooks/use-manuscript";
import { parseOutline } from "@/lib/outline";
import type { OutlineItem } from "@/types";

interface OutlinePanelProps {
  projectId: string;
  editor: Editor | null;
}

interface CollapsedState {
  [id: string]: boolean;
}

export function OutlinePanel({ projectId, editor }: OutlinePanelProps) {
  const { data: manuscript } = useManuscriptContent(projectId);
  const [collapsed, setCollapsed] = useState<CollapsedState>({});
  const [activeHeadingId, setActiveHeadingId] = useState<string | null>(null);

  // Parse outline from manuscript content
  const outline = useMemo(() => {
    if (!manuscript?.content) return [];
    return parseOutline(manuscript.content);
  }, [manuscript?.content]);

  // Track cursor position to highlight current heading
  useEffect(() => {
    if (!editor) return;

    const updateActiveHeading = () => {
      const { from } = editor.state.selection;
      let currentHeadingId: string | null = null;
      let currentPos = 0;

      // Walk through the document to find which heading contains the cursor
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === "heading") {
          currentPos++;
          currentHeadingId = `heading-${currentPos - 1}`;
        }

        // Check if cursor is before the next heading
        if (pos > from && currentHeadingId !== null) {
          return false; // stop traversal
        }
      });

      setActiveHeadingId(currentHeadingId);
    };

    // Update on selection change
    editor.on("selectionUpdate", updateActiveHeading);
    updateActiveHeading();

    return () => {
      editor.off("selectionUpdate", updateActiveHeading);
    };
  }, [editor]);

  const toggleCollapse = (id: string) => {
    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const scrollToHeading = (item: OutlineItem) => {
    if (!editor) return;

    // Find the ProseMirror position of the heading node
    let targetPos: number | null = null;
    let currentNodeIndex = 0;

    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === "heading") {
        if (currentNodeIndex === item.pos) {
          targetPos = pos;
          return false; // stop
        }
        currentNodeIndex++;
      }
    });

    if (targetPos !== null) {
      editor
        .chain()
        .setTextSelection(targetPos)
        .scrollIntoView()
        .run();
    }
  };

  const renderItem = (item: OutlineItem, depth: number = 0) => {
    const isCollapsed = collapsed[item.id] ?? false;
    const hasChildren = item.children.length > 0;
    const isActive = activeHeadingId === item.id;
    const indent = depth * 16; // 16px per level

    return (
      <div key={item.id}>
        <div
          className={cn(
            "group flex items-center gap-1 rounded-sm px-1 py-0.5 text-sm cursor-pointer select-none",
            isActive
              ? "border-l-2 border-primary bg-accent/50 text-foreground"
              : "border-l-2 border-transparent hover:bg-accent/30"
          )}
          style={{ paddingLeft: `${indent + 4}px` }}
          onClick={() => scrollToHeading(item)}
        >
          {hasChildren ? (
            <button
              className="flex h-4 w-4 items-center justify-center shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                toggleCollapse(item.id);
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
          <span className="flex-1 min-w-0 truncate">{item.title}</span>
          {item.wordCount > 0 && (
            <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">
              {item.wordCount.toLocaleString()}
            </span>
          )}
        </div>
        {hasChildren && !isCollapsed && (
          <div>
            {item.children.map((child) => renderItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (outline.length === 0) {
    return (
      <div className="p-4 text-sm text-muted-foreground text-center">
        アウトラインはありません
        <br />
        見出しを追加してください
      </div>
    );
  }

  return (
    <div className="p-1">
      {outline.map((item) => renderItem(item))}
    </div>
  );
}
