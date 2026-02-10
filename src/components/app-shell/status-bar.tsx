"use client";

import { useUIStore } from "@/stores/ui-store";
import { useProject } from "@/hooks/use-projects";
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";

export function StatusBar() {
  const activeProjectId = useUIStore((s) => s.activeProjectId);
  const saveStatus = useUIStore((s) => s.saveStatus);
  const totalWordCount = useUIStore((s) => s.totalWordCount);
  const { data: project } = useProject(activeProjectId);

  const targetWordCount = project?.targetWordCount ?? 0;
  const progress = targetWordCount > 0 ? Math.min(100, (totalWordCount / targetWordCount) * 100) : 0;

  return (
    <div className="flex h-7 items-center justify-between border-t bg-muted/50 px-4 text-xs text-muted-foreground">
      <div className="flex items-center gap-4">
        <span>
          {totalWordCount.toLocaleString()} words
          {targetWordCount > 0 && (
            <span className="ml-1">
              / {targetWordCount.toLocaleString()} ({progress.toFixed(0)}%)
            </span>
          )}
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        {saveStatus === "saved" && (
          <>
            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
            <span>Saved</span>
          </>
        )}
        {saveStatus === "saving" && (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span>Saving...</span>
          </>
        )}
        {saveStatus === "unsaved" && (
          <>
            <AlertCircle className="h-3.5 w-3.5 text-yellow-500" />
            <span>Unsaved changes</span>
          </>
        )}
      </div>
    </div>
  );
}
