import type { JSONContent } from "@tiptap/react";

// === Project ===
export interface Project {
  id: string;
  title: string;
  author: string;
  genre: string;
  targetWordCount: number;
  settings: ProjectSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectSettings {
  labels: LabelDef[];
  statuses: StatusDef[];
}

export interface LabelDef {
  id: string;
  name: string;
  color: string;
}

export interface StatusDef {
  id: string;
  name: string;
}

// === Binder Item ===
export type BinderItemType = "folder" | "scene" | "research" | "trash";

export interface SceneMeta {
  povCharacterId?: string;
  locationId?: string;
  characterIds: string[];
  subplotIds: string[];
  goal?: string;
  conflict?: string;
  outcome?: string;
}

export interface BinderItem {
  id: string;
  projectId: string;
  parentId: string | null;
  sortOrder: string; // fractional indexing string
  type: BinderItemType;
  title: string;
  synopsis: string;
  content: JSONContent | null;
  notes: string;
  wordCount: number;
  labelId: string | null;
  statusId: string | null;
  includeInCompile: boolean;
  sceneMeta: SceneMeta;
  createdAt: Date;
  updatedAt: Date;
}

// === Codex ===
export type CodexEntryType =
  | "character"
  | "location"
  | "object"
  | "lore"
  | "subplot"
  | "other";

export interface CodexEntry {
  id: string;
  projectId: string;
  type: CodexEntryType;
  name: string;
  aliases: string[];
  description: JSONContent | null;
  notes: string;
  thumbnail: string | null;
  tags: string[];
  fieldValues: Record<string, string>;
  color: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CodexRelation {
  id: string;
  projectId: string;
  sourceId: string;
  targetId: string;
  label: string;
}

// === Snapshot ===
export interface Snapshot {
  id: string;
  binderItemId: string;
  projectId: string;
  title: string;
  content: JSONContent | null;
  wordCount: number;
  createdAt: Date;
}

// === Collection ===
export type CollectionType = "manual" | "search";

export interface SearchQuery {
  text: string;
  fields: string[];
}

export interface Collection {
  id: string;
  projectId: string;
  name: string;
  type: CollectionType;
  itemIds: string[];
  searchQuery: SearchQuery | null;
  color: string | null;
}

// === App Mode ===
export type AppMode = "plan" | "write" | "review";
