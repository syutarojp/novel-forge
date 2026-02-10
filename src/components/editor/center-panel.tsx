"use client";

import { useUIStore } from "@/stores/ui-store";
import { TipTapEditor } from "./tiptap-editor";
import { ResearchEditor } from "./research-editor";
import { CodexEntryEditor } from "@/components/codex/codex-entry-editor";
import { PenLine, Globe, FileText } from "lucide-react";

interface CenterPanelProps {
  projectId: string;
}

export function CenterPanel({ projectId }: CenterPanelProps) {
  const binderTab = useUIStore((s) => s.binderTab);
  const selectedCodexEntryId = useUIStore((s) => s.selectedCodexEntryId);
  const selectedResearchItemId = useUIStore((s) => s.selectedResearchItemId);
  const mode = useUIStore((s) => s.mode);

  // Codex tab
  if (binderTab === "codex") {
    if (!selectedCodexEntryId) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-6 text-muted-foreground p-8">
          <Globe className="h-16 w-16 opacity-10" />
          <div className="text-center space-y-2">
            <p className="text-lg font-medium">エントリが選択されていません</p>
            <p className="text-sm">左の世界観パネルからエントリを選択してください</p>
          </div>
        </div>
      );
    }
    return (
      <CodexEntryEditor
        key={selectedCodexEntryId}
        entryId={selectedCodexEntryId}
        projectId={projectId}
      />
    );
  }

  // Research tab
  if (binderTab === "research") {
    if (!selectedResearchItemId) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-6 text-muted-foreground p-8">
          <FileText className="h-16 w-16 opacity-10" />
          <div className="text-center space-y-2">
            <p className="text-lg font-medium">リサーチが選択されていません</p>
            <p className="text-sm">左のリサーチパネルからアイテムを選択してください</p>
          </div>
        </div>
      );
    }
    return (
      <ResearchEditor
        key={selectedResearchItemId}
        itemId={selectedResearchItemId}
        projectId={projectId}
      />
    );
  }

  // Manuscript tab (default)
  return (
    <TipTapEditor
      key={projectId}
      projectId={projectId}
      readOnly={mode === "review"}
    />
  );
}
