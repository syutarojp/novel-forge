"use client";

import { useEffect } from "react";
import { useUIStore } from "@/stores/ui-store";
import { useBinderItems } from "@/hooks/use-binder";
import { useCodexEntries } from "@/hooks/use-codex";
import { getCodexTypeDef } from "@/lib/codex-utils";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
} from "@/components/ui/command";
import {
  FileText,
  SpellCheck,
  Download,
  FilePlus,
  FolderPlus,
  PanelLeft,
  PanelRight,
  Maximize,
  PenLine,
  BookOpen,
  Map,
} from "lucide-react";

interface CommandPaletteProps {
  projectId: string | null;
  onCompile?: () => void;
  onProofread?: () => void;
  onAddScene?: () => void;
  onAddFolder?: () => void;
}

export function CommandPalette({
  projectId,
  onCompile,
  onProofread,
  onAddScene,
  onAddFolder,
}: CommandPaletteProps) {
  const {
    commandPaletteOpen,
    setCommandPaletteOpen,
    setSelectedItemId,
    setSelectedCodexEntryId,
    setBinderTab,
    toggleBinder,
    toggleInspector,
    toggleFocusMode,
    setMode,
  } = useUIStore();

  const { data: items = [] } = useBinderItems(projectId);
  const { data: codexEntries = [] } = useCodexEntries(projectId);
  const scenes = items.filter((item) => item.type === "scene");

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

  return (
    <CommandDialog open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen}>
      <CommandInput placeholder="コマンドを入力..." />
      <CommandList>
        <CommandEmpty>結果が見つかりません</CommandEmpty>

        {scenes.length > 0 && (
          <CommandGroup heading="移動 — シーン">
            {scenes.map((scene) => (
              <CommandItem
                key={scene.id}
                onSelect={() =>
                  closeAndExecute(() => {
                    setBinderTab("manuscript");
                    setSelectedItemId(scene.id);
                  })
                }
              >
                <FileText className="mr-2 h-4 w-4" />
                <span>{scene.title}</span>
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
          {onAddScene && (
            <CommandItem onSelect={() => closeAndExecute(onAddScene)}>
              <FilePlus className="mr-2 h-4 w-4" />
              <span>新規シーン</span>
            </CommandItem>
          )}
          {onAddFolder && (
            <CommandItem onSelect={() => closeAndExecute(onAddFolder)}>
              <FolderPlus className="mr-2 h-4 w-4" />
              <span>新規フォルダ</span>
            </CommandItem>
          )}
        </CommandGroup>

        <CommandGroup heading="表示">
          <CommandItem onSelect={() => closeAndExecute(toggleBinder)}>
            <PanelLeft className="mr-2 h-4 w-4" />
            <span>バインダー 表示/非表示</span>
          </CommandItem>
          <CommandItem onSelect={() => closeAndExecute(toggleInspector)}>
            <PanelRight className="mr-2 h-4 w-4" />
            <span>インスペクター 表示/非表示</span>
          </CommandItem>
          <CommandItem onSelect={() => closeAndExecute(toggleFocusMode)}>
            <Maximize className="mr-2 h-4 w-4" />
            <span>集中モード</span>
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
