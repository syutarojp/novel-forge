"use client";

import { useEffect, useState } from "react";
import { Allotment } from "allotment";
import "allotment/dist/style.css";
import { useUIStore } from "@/stores/ui-store";
import { useBinderItems } from "@/hooks/use-binder";
import { Header } from "./header";
import { StatusBar } from "./status-bar";
import { BinderPanel } from "@/components/binder/binder-panel";
import { CenterPanel } from "@/components/editor/center-panel";
import { InspectorPanel } from "@/components/inspector/inspector-panel";
import { CompileDialog } from "@/components/compile/compile-dialog";

interface AppShellProps {
  projectId: string;
}

export function AppShell({ projectId }: AppShellProps) {
  const setActiveProjectId = useUIStore((s) => s.setActiveProjectId);
  const binderVisible = useUIStore((s) => s.binderVisible);
  const inspectorVisible = useUIStore((s) => s.inspectorVisible);
  const setTotalWordCount = useUIStore((s) => s.setTotalWordCount);
  const { data: items } = useBinderItems(projectId);
  const [compileOpen, setCompileOpen] = useState(false);

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

  return (
    <div className="flex h-screen flex-col">
      <Header onCompile={() => setCompileOpen(true)} />
      <CompileDialog
        open={compileOpen}
        onOpenChange={setCompileOpen}
        projectId={projectId}
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
      <StatusBar />
    </div>
  );
}
