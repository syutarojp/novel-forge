import type { JSONContent } from "@tiptap/react";

// === Project ===
export interface Project {
  id: string;
  title: string;
  author: string;
  genre: string;
  targetWordCount: number;
  content: JSONContent | null;
  wordCount: number;
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

// === Outline (derived from project content headings) ===
export interface OutlineItem {
  id: string;       // e.g. "heading-0", "heading-1"
  level: number;    // 1-4
  title: string;
  headingIndex: number; // 全見出しの連番 (0始まり)
  pos: number;      // = headingIndex (後方互換)
  endPos: number;   // end of this section (start of next heading or end of doc)
  wordCount: number;
  children: OutlineItem[];
}

// === Section Trash ===
export interface SectionTrashItem {
  id: string;
  projectId: string;
  title: string;
  level: number;
  content: JSONContent;
  deletedAt: string; // ISO date
}

// === Binder Item (research items only) ===
export type BinderItemType = "research";

export interface BinderItem {
  id: string;
  projectId: string;
  parentId: string | null;
  sortOrder: string;
  type: BinderItemType;
  title: string;
  synopsis: string;
  content: JSONContent | null;
  notes: string;
  wordCount: number;
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
