"use client";

import { useUIStore } from "@/stores/ui-store";
import type { AppMode } from "@/types";
import { cn } from "@/lib/utils";
import { Map, PenLine, BookOpen } from "lucide-react";

const modes: { value: AppMode; label: string; icon: React.ReactNode }[] = [
  { value: "plan", label: "プラン", icon: <Map className="h-4 w-4" /> },
  { value: "write", label: "執筆", icon: <PenLine className="h-4 w-4" /> },
  { value: "review", label: "レビュー", icon: <BookOpen className="h-4 w-4" /> },
];

export function ModeTabBar() {
  const mode = useUIStore((s) => s.mode);
  const setMode = useUIStore((s) => s.setMode);

  return (
    <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
      {modes.map((m) => (
        <button
          key={m.value}
          onClick={() => setMode(m.value)}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            mode === m.value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {m.icon}
          {m.label}
        </button>
      ))}
    </div>
  );
}
