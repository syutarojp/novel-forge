"use client";

import { useUIStore } from "@/stores/ui-store";
import { useProject } from "@/hooks/use-projects";
import { ModeTabBar } from "./mode-tab-bar";
import { Button } from "@/components/ui/button";
import {
  PanelLeft,
  PanelRight,
  BookMarked,
  ArrowLeft,
  Download,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Link from "next/link";

interface HeaderProps {
  onCompile?: () => void;
}

export function Header({ onCompile }: HeaderProps) {
  const activeProjectId = useUIStore((s) => s.activeProjectId);
  const toggleBinder = useUIStore((s) => s.toggleBinder);
  const toggleInspector = useUIStore((s) => s.toggleInspector);
  const binderVisible = useUIStore((s) => s.binderVisible);
  const inspectorVisible = useUIStore((s) => s.inspectorVisible);
  const openCodex = useUIStore((s) => s.openCodex);
  const { data: project } = useProject(activeProjectId);

  return (
    <header className="flex h-12 items-center justify-between border-b bg-background px-3">
      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent>プロジェクト一覧に戻る</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={toggleBinder}
            >
              <PanelLeft className={`h-4 w-4 ${binderVisible ? "text-foreground" : "text-muted-foreground"}`} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>バインダー表示切替</TooltipContent>
        </Tooltip>
        <span className="text-sm font-semibold">{project?.title ?? "NovelForge"}</span>
      </div>

      <ModeTabBar />

      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onCompile}
            >
              <Download className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>出力</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => openCodex()}
            >
              <BookMarked className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>コーデックス</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={toggleInspector}
            >
              <PanelRight className={`h-4 w-4 ${inspectorVisible ? "text-foreground" : "text-muted-foreground"}`} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>インスペクター表示切替</TooltipContent>
        </Tooltip>
      </div>
    </header>
  );
}
