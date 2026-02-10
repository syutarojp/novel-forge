"use client";

import { useEffect, useState } from "react";
import { Allotment } from "allotment";
import "allotment/dist/style.css";
import { useUIStore } from "@/stores/ui-store";
import { useProofread } from "@/hooks/use-proofreading";
import { Header } from "./header";
import { StatusBar } from "./status-bar";
import { BinderPanel } from "@/components/binder/binder-panel";
import { CenterPanel } from "@/components/editor/center-panel";
import { CompileDialog } from "@/components/compile/compile-dialog";
import { CommandPalette } from "@/components/command-palette";

interface AppShellProps {
  projectId: string;
}

export function AppShell({ projectId }: AppShellProps) {
  const setActiveProjectId = useUIStore((s) => s.setActiveProjectId);
  const sidebarVisible = useUIStore((s) => s.sidebarVisible);
  const [compileOpen, setCompileOpen] = useState(false);
  const runProofread = useProofread();

  useEffect(() => {
    setActiveProjectId(projectId);
    return () => setActiveProjectId(null);
  }, [projectId, setActiveProjectId]);

  // Word count is now managed by TipTapEditor directly (sets totalWordCount in UIStore)
  // No need to calculate from binder items

  return (
    <div className="flex h-screen flex-col">
      <Header onCompile={() => setCompileOpen(true)} />
      <CompileDialog
        open={compileOpen}
        onOpenChange={setCompileOpen}
        projectId={projectId}
      />
      <CommandPalette
        projectId={projectId}
        onCompile={() => setCompileOpen(true)}
        onProofread={runProofread}
      />
      <div className="flex-1 overflow-hidden">
        <Allotment>
          {sidebarVisible && (
            <Allotment.Pane preferredSize={280} minSize={200} maxSize={450}>
              <BinderPanel projectId={projectId} />
            </Allotment.Pane>
          )}
          <Allotment.Pane>
            <CenterPanel projectId={projectId} />
          </Allotment.Pane>
        </Allotment>
      </div>
      <StatusBar />
    </div>
  );
}
