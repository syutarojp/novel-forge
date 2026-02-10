"use client";

import { useUIStore } from "@/stores/ui-store";
import { useBinderItem } from "@/hooks/use-binder";
import { TipTapEditor } from "./tiptap-editor";
import { FileText, PenLine } from "lucide-react";

interface CenterPanelProps {
  projectId: string;
}

export function CenterPanel({ projectId }: CenterPanelProps) {
  const selectedItemId = useUIStore((s) => s.selectedItemId);
  const mode = useUIStore((s) => s.mode);
  const { data: selectedItem } = useBinderItem(selectedItemId);

  // If no item selected, show placeholder
  if (!selectedItemId || !selectedItem) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 text-muted-foreground">
        <PenLine className="h-12 w-12 opacity-20" />
        <div className="text-center">
          <p className="text-lg font-medium">No scene selected</p>
          <p className="text-sm">Select a scene from the Binder to start writing</p>
        </div>
      </div>
    );
  }

  // For folders, show a summary
  if (selectedItem.type === "folder" || selectedItem.type === "trash") {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 text-muted-foreground">
        <FileText className="h-12 w-12 opacity-20" />
        <div className="text-center">
          <p className="text-lg font-medium">{selectedItem.title}</p>
          <p className="text-sm">
            {selectedItem.type === "folder"
              ? "Select a scene within this folder to edit"
              : "Items in the trash"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <TipTapEditor
      key={selectedItemId}
      itemId={selectedItemId}
      projectId={projectId}
      readOnly={mode === "review"}
    />
  );
}
