"use client";

import { useMemo, useState } from "react";
import { useCodexEntries, useCreateCodexEntry } from "@/hooks/use-codex";
import { useUIStore } from "@/stores/ui-store";
import { CODEX_TYPES, getCodexTypeDef } from "@/lib/codex-utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, ChevronRight } from "lucide-react";
import type { CodexEntry, CodexEntryType } from "@/types";

interface CodexBrowserPanelProps {
  projectId: string;
}

function TypeSection({
  type,
  entries,
  projectId,
}: {
  type: (typeof CODEX_TYPES)[number];
  entries: CodexEntry[];
  projectId: string;
}) {
  const [open, setOpen] = useState(true);
  const selectedId = useUIStore((s) => s.selectedCodexEntryId);
  const setSelectedCodexEntryId = useUIStore((s) => s.setSelectedCodexEntryId);
  const createEntry = useCreateCodexEntry();
  const Icon = type.icon;

  const handleAdd = () => {
    createEntry.mutate(
      { projectId, type: type.type },
      {
        onSuccess: (entry) => setSelectedCodexEntryId(entry.id),
      }
    );
  };

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-accent/50 transition-colors"
      >
        <ChevronRight
          className={`h-3 w-3 transition-transform ${open ? "rotate-90" : ""}`}
        />
        <Icon className="h-3.5 w-3.5" />
        <span className="flex-1 text-left">{type.label}</span>
        <span className="text-[10px] tabular-nums opacity-60">
          {entries.length}
        </span>
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            handleAdd();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.stopPropagation();
              handleAdd();
            }
          }}
          className="ml-0.5 rounded p-0.5 hover:bg-accent"
        >
          <Plus className="h-3 w-3" />
        </span>
      </button>
      {open && entries.length > 0 && (
        <div className="pb-1">
          {entries.map((entry) => {
            const isSelected = selectedId === entry.id;
            return (
              <button
                key={entry.id}
                onClick={() => setSelectedCodexEntryId(entry.id)}
                className={`flex w-full items-center gap-2 px-4 py-1 text-sm transition-colors hover:bg-accent/50 ${
                  isSelected
                    ? "bg-accent/50 border-l-2 border-primary"
                    : "border-l-2 border-transparent"
                }`}
              >
                {entry.color && (
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                )}
                <span className="truncate">{entry.name}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function CodexBrowserPanel({ projectId }: CodexBrowserPanelProps) {
  const { data: entries = [] } = useCodexEntries(projectId);
  const setSelectedCodexEntryId = useUIStore((s) => s.setSelectedCodexEntryId);
  const createEntry = useCreateCodexEntry();

  const grouped = useMemo(() => {
    const map = new Map<CodexEntryType, CodexEntry[]>();
    for (const t of CODEX_TYPES) map.set(t.type, []);
    for (const e of entries) {
      const arr = map.get(e.type);
      if (arr) arr.push(e);
      else map.get("other")!.push(e);
    }
    return map;
  }, [entries]);

  const handleCreateEntry = (type: CodexEntryType) => {
    createEntry.mutate(
      { projectId, type },
      {
        onSuccess: (entry) => setSelectedCodexEntryId(entry.id),
      }
    );
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-end px-3 py-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs">
              <Plus className="h-3.5 w-3.5" />
              エントリ
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {CODEX_TYPES.map((t) => {
              const Icon = t.icon;
              return (
                <DropdownMenuItem
                  key={t.type}
                  onClick={() => handleCreateEntry(t.type)}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {t.label}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <ScrollArea className="flex-1">
        {CODEX_TYPES.map((t) => {
          const typeEntries = grouped.get(t.type) ?? [];
          return (
            <TypeSection
              key={t.type}
              type={t}
              entries={typeEntries}
              projectId={projectId}
            />
          );
        })}
        {entries.length === 0 && (
          <div className="px-4 py-8 text-center text-xs text-muted-foreground">
            <p>世界観エントリがありません</p>
            <p className="mt-1">「+ エントリ」から追加してください</p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
