"use client";

import { useState } from "react";
import { useProject } from "@/hooks/use-projects";
import { useBinderItems } from "@/hooks/use-binder";
import { useUIStore } from "@/stores/ui-store";
import { compileToDocx, downloadMarkdown } from "@/lib/compile/compile-docx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { FileText, FileDown, Loader2 } from "lucide-react";

interface CompileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}

export function CompileDialog({
  open,
  onOpenChange,
  projectId,
}: CompileDialogProps) {
  const { data: project } = useProject(projectId);
  const { data: items = [] } = useBinderItems(projectId);
  const [exporting, setExporting] = useState(false);

  const compilableScenes = items.filter(
    (item) => item.includeInCompile && item.type === "scene"
  );
  const totalWords = compilableScenes.reduce(
    (sum, item) => sum + item.wordCount,
    0
  );

  const handleExportDocx = async () => {
    if (!project) return;
    setExporting(true);
    try {
      await compileToDocx(project, items);
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setExporting(false);
    }
  };

  const handleExportMarkdown = () => {
    if (!project) return;
    downloadMarkdown(project, items);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>出力</DialogTitle>
          <DialogDescription>
            原稿をファイルとして出力します
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-lg border bg-muted/50 p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">シーン数</span>
              <span className="font-medium">{compilableScenes.length}</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">合計文字数</span>
              <span className="font-medium">
                {totalWords.toLocaleString()}
              </span>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label className="text-sm font-medium">出力形式</Label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-auto flex-col gap-2 py-4"
                onClick={handleExportDocx}
                disabled={exporting}
              >
                {exporting ? (
                  <Loader2 className="h-8 w-8 animate-spin" />
                ) : (
                  <FileText className="h-8 w-8 text-blue-500" />
                )}
                <span className="text-xs font-medium">DOCX</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto flex-col gap-2 py-4"
                onClick={handleExportMarkdown}
              >
                <FileDown className="h-8 w-8 text-green-500" />
                <span className="text-xs font-medium">Markdown</span>
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            閉じる
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
