"use client";

import { useUIStore } from "@/stores/ui-store";
import { useProject } from "@/hooks/use-projects";
import { useBinderItem, useBinderItems } from "@/hooks/use-binder";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  ArrowLeft,
  Download,
  Maximize,
  Minimize,
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
  const selectedItemId = useUIStore((s) => s.selectedItemId);
  const { data: project } = useProject(activeProjectId);
  const { data: selectedItem } = useBinderItem(selectedItemId);
  const { data: items = [] } = useBinderItems(activeProjectId);

  // Build breadcrumb path: project > parent folder > scene
  const crumbs: string[] = [];
  if (project) crumbs.push(project.title);

  if (selectedItem) {
    // Find parent chain
    const parents: string[] = [];
    let current = selectedItem;
    while (current?.parentId) {
      const parent = items.find((i) => i.id === current!.parentId);
      if (parent) {
        parents.unshift(parent.title);
        current = parent;
      } else {
        break;
      }
    }
    crumbs.push(...parents);
    crumbs.push(selectedItem.title);
  }

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
  const focusMode = useUIStore((s) => s.focusMode);
  const toggleFocusMode = useUIStore((s) => s.toggleFocusMode);
  const toggleCommandPalette = useUIStore((s) => s.toggleCommandPalette);

  return (
    <header className="flex h-12 items-center justify-between border-b bg-background px-3 gap-4">
      {/* Left: back + breadcrumbs */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
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

      {/* Right: action buttons with labels */}
      <div className="flex items-center gap-1 shrink-0">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={focusMode ? "secondary" : "ghost"}
              size="sm"
              className="h-8 gap-1.5 px-2.5"
              onClick={toggleFocusMode}
            >
              {focusMode ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
              <span className="hidden sm:inline text-xs">
                {focusMode ? "通常" : "集中"}
              </span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>{focusMode ? "通常モードに戻る" : "集中モード"}</TooltipContent>
        </Tooltip>

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

        <ThemeToggle />
      </div>
    </header>
  );
}
