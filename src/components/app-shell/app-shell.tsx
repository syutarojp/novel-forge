"use client";

import { useEffect, useState } from "react";
import { Allotment } from "allotment";
import "allotment/dist/style.css";
import { useUIStore } from "@/stores/ui-store";
import { useBinderItems, useCreateBinderItem } from "@/hooks/use-binder";
import { useProofread } from "@/hooks/use-proofreading";
import { Header } from "./header";
import { StatusBar } from "./status-bar";
import { BinderPanel } from "@/components/binder/binder-panel";
import { CenterPanel } from "@/components/editor/center-panel";
import { InspectorPanel } from "@/components/inspector/inspector-panel";
import { CompileDialog } from "@/components/compile/compile-dialog";
import { CommandPalette } from "@/components/command-palette";

interface AppShellProps {
  projectId: string;
}

export function AppShell({ projectId }: AppShellProps) {
  const setActiveProjectId = useUIStore((s) => s.setActiveProjectId);
  const binderVisible = useUIStore((s) => s.binderVisible);
  const inspectorVisible = useUIStore((s) => s.inspectorVisible);
  const focusMode = useUIStore((s) => s.focusMode);
  const setTotalWordCount = useUIStore((s) => s.setTotalWordCount);
  const { data: items } = useBinderItems(projectId);
  const [compileOpen, setCompileOpen] = useState(false);
  const runProofread = useProofread();
  const createItem = useCreateBinderItem();

  useEffect(() => {
    setActiveProjectId(projectId);
    return () => setActiveProjectId(null);
  }, [projectId, setActiveProjectId]);

  // Calculate total word count from binder items
  useEffect(() => {
    if (items) {
      const total = items
        .filter((item) => item.includeInCompile && item.type === "scene")
        .reduce((sum, item) => sum + item.wordCount, 0);
      setTotalWordCount(total);
    }
  }, [items, setTotalWordCount]);

  const handleAddScene = () => {
    if (!items) return;
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
    if (!items) return;
    const rootItems = items
      .filter((item) => item.parentId === null && item.type !== "trash")
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
    <div className="flex h-screen flex-col">
      {!focusMode && (
        <Header onCompile={() => setCompileOpen(true)} />
      )}
      <CompileDialog
        open={compileOpen}
        onOpenChange={setCompileOpen}
        projectId={projectId}
      />
      <CommandPalette
        projectId={projectId}
        onCompile={() => setCompileOpen(true)}
        onProofread={runProofread}
        onAddScene={handleAddScene}
        onAddFolder={handleAddFolder}
      />
      <div className="flex-1 overflow-hidden">
        <Allotment>
          {binderVisible && (
            <Allotment.Pane preferredSize={250} minSize={180} maxSize={400}>
              <BinderPanel projectId={projectId} />
            </Allotment.Pane>
          )}
          <Allotment.Pane>
            <CenterPanel projectId={projectId} />
          </Allotment.Pane>
          {inspectorVisible && (
            <Allotment.Pane preferredSize={280} minSize={200} maxSize={400}>
              <InspectorPanel projectId={projectId} />
            </Allotment.Pane>
          )}
        </Allotment>
      </div>
      {!focusMode && <StatusBar />}
    </div>
  );
}
