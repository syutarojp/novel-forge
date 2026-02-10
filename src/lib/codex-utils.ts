import {
  User,
  MapPin,
  Package,
  BookOpen,
  GitBranch,
  Circle,
  type LucideIcon,
} from "lucide-react";
import type { CodexEntryType } from "@/types";

export interface CodexTypeDef {
  type: CodexEntryType;
  label: string;
  icon: LucideIcon;
}

export const CODEX_TYPES: CodexTypeDef[] = [
  { type: "character", label: "キャラクター", icon: User },
  { type: "location", label: "場所", icon: MapPin },
  { type: "object", label: "アイテム", icon: Package },
  { type: "lore", label: "設定", icon: BookOpen },
  { type: "subplot", label: "サブプロット", icon: GitBranch },
  { type: "other", label: "その他", icon: Circle },
];

const typeMap = new Map(CODEX_TYPES.map((t) => [t.type, t]));

export function getCodexTypeDef(type: CodexEntryType): CodexTypeDef {
  return typeMap.get(type) ?? CODEX_TYPES[5]; // fallback to "other"
}

export const CODEX_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#3b82f6", // blue
  "#a855f7", // purple
] as const;
