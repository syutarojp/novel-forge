"use client";

import { useUIStore } from "@/stores/ui-store";
import { useProject } from "@/hooks/use-projects";
import { useCodexEntry } from "@/hooks/use-codex";
import { useResearchItem } from "@/hooks/use-binder";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/user-menu";
import {
  ArrowLeft,
  Download,
  PanelLeft,
  Search,
  ChevronRight,
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

function Breadcrumbs() {
  const activeProjectId = useUIStore((s) => s.activeProjectId);
  const binderTab = useUIStore((s) => s.binderTab);
  const selectedCodexEntryId = useUIStore((s) => s.selectedCodexEntryId);
  const selectedResearchItemId = useUIStore((s) => s.selectedResearchItemId);
  const { data: project } = useProject(activeProjectId);
  const { data: codexEntry } = useCodexEntry(selectedCodexEntryId || "", activeProjectId || "");
  const { data: researchItem } = useResearchItem(selectedResearchItemId || "");

  const crumbs: string[] = [];
  if (project) crumbs.push(project.title);

  if (binderTab === "codex" && selectedCodexEntryId && codexEntry) {
    crumbs.push(codexEntry.name);
  } else if (binderTab === "research" && selectedResearchItemId && researchItem) {
    crumbs.push(researchItem.title);
  }
  // manuscript: just project title

  if (crumbs.length === 0) return null;

  return (
    <div className="flex items-center gap-1 text-sm text-muted-foreground min-w-0">
      {crumbs.map((crumb, i) => (
        <span key={i} className="flex items-center gap-1 min-w-0">
          {i > 0 && <ChevronRight className="h-3 w-3 shrink-0 opacity-50" />}
          <span className={`truncate ${i === crumbs.length - 1 ? "text-foreground font-medium" : ""}`}>
            {crumb}
          </span>
        </span>
      ))}
    </div>
  );
}

export function Header({ onCompile }: HeaderProps) {
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const toggleCommandPalette = useUIStore((s) => s.toggleCommandPalette);

  return (
    <header className="flex h-12 items-center justify-between border-b bg-background px-3 gap-4">
      {/* Left: sidebar toggle + back + breadcrumbs */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={toggleSidebar}
            >
              <PanelLeft className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>サイドバー 表示/非表示</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent>プロジェクト一覧に戻る</TooltipContent>
        </Tooltip>
        <Breadcrumbs />
      </div>

      {/* Right: action buttons */}
      <div className="flex items-center gap-1 shrink-0">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 px-2.5"
              onClick={onCompile}
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline text-xs">出力</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>DOCX/Markdown にエクスポート</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={toggleCommandPalette}
            >
              <Search className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>コマンドパレット (⌘K)</TooltipContent>
        </Tooltip>

        <UserMenu />
      </div>
    </header>
  );
}
