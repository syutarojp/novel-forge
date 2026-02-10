"use client";

import { useEffect } from "react";
import { useUIStore } from "@/stores/ui-store";
import { useManuscriptContent } from "@/hooks/use-manuscript";
import { getFlatHeadings } from "@/lib/outline";
import { useCodexEntries } from "@/hooks/use-codex";
import { getCodexTypeDef } from "@/lib/codex-utils";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import {
  FileText,
  SpellCheck,
  Download,
  PanelLeft,
  PenLine,
  BookOpen,
  Map,
} from "lucide-react";

interface CommandPaletteProps {
  projectId: string | null;
  onCompile?: () => void;
  onProofread?: () => void;
}

export function CommandPalette({
  projectId,
  onCompile,
  onProofread,
}: CommandPaletteProps) {
  const {
    commandPaletteOpen,
    setCommandPaletteOpen,
    setSelectedCodexEntryId,
    setBinderTab,
    toggleSidebar,
    setMode,
    editorInstance: editor,
  } = useUIStore();

  const { data: manuscriptData } = useManuscriptContent(projectId);
  const { data: codexEntries = [] } = useCodexEntries(projectId);
  const headings = getFlatHeadings(manuscriptData?.content ?? null);

  // Register global keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [commandPaletteOpen, setCommandPaletteOpen]);

  const closeAndExecute = (action: () => void) => {
    action();
    setCommandPaletteOpen(false);
  };

  const scrollToHeading = (nodeIndex: number) => {
    if (!editor) return;
    let headingCount = 0;
    let targetPos: number | null = null;
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === "heading") {
        if (headingCount === nodeIndex) {
          targetPos = pos;
          return false;
        }
        headingCount++;
      }
    });
    if (targetPos !== null) {
      editor.chain().setTextSelection(targetPos).scrollIntoView().run();
    }
  };

  return (
    <CommandDialog open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen}>
      <CommandInput placeholder="コマンドを入力..." />
      <CommandList>
        <CommandEmpty>結果が見つかりません</CommandEmpty>

        {headings.length > 0 && (
          <CommandGroup heading="移動 — 原稿">
            {headings.map((h, idx) => (
              <CommandItem
                key={idx}
                onSelect={() =>
                  closeAndExecute(() => {
                    setBinderTab("manuscript");
                    scrollToHeading(idx);
                  })
                }
              >
                <FileText className="mr-2 h-4 w-4" />
                <span className={h.level > 1 ? `ml-${(h.level - 1) * 4}` : ""}>
                  {"#".repeat(h.level)} {h.title}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {codexEntries.length > 0 && (
          <CommandGroup heading="移動 — 世界観">
            {codexEntries.map((entry) => {
              const typeDef = getCodexTypeDef(entry.type);
              const Icon = typeDef.icon;
              return (
                <CommandItem
                  key={entry.id}
                  onSelect={() =>
                    closeAndExecute(() => {
                      setBinderTab("codex");
                      setSelectedCodexEntryId(entry.id);
                    })
                  }
                >
                  <Icon className="mr-2 h-4 w-4" />
                  <span>{entry.name}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {typeDef.label}
                  </span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}

        <CommandGroup heading="操作">
          {onProofread && (
            <CommandItem onSelect={() => closeAndExecute(onProofread)}>
              <SpellCheck className="mr-2 h-4 w-4" />
              <span>校正を実行</span>
            </CommandItem>
          )}
          {onCompile && (
            <CommandItem onSelect={() => closeAndExecute(onCompile)}>
              <Download className="mr-2 h-4 w-4" />
              <span>エクスポート</span>
            </CommandItem>
          )}
        </CommandGroup>

        <CommandGroup heading="表示">
          <CommandItem onSelect={() => closeAndExecute(toggleSidebar)}>
            <PanelLeft className="mr-2 h-4 w-4" />
            <span>サイドバー 表示/非表示</span>
          </CommandItem>
        </CommandGroup>

        <CommandGroup heading="モード">
          <CommandItem onSelect={() => closeAndExecute(() => setMode("write"))}>
            <PenLine className="mr-2 h-4 w-4" />
            <span>執筆モード</span>
          </CommandItem>
          <CommandItem onSelect={() => closeAndExecute(() => setMode("review"))}>
            <BookOpen className="mr-2 h-4 w-4" />
            <span>レビューモード</span>
          </CommandItem>
          <CommandItem onSelect={() => closeAndExecute(() => setMode("plan"))}>
            <Map className="mr-2 h-4 w-4" />
            <span>プランモード</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
