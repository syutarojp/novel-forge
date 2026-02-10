import { create } from "zustand";
import type { Editor } from "@tiptap/react";
import type { AppMode } from "@/types";

interface UIState {
  // Current mode
  mode: AppMode;
  setMode: (mode: AppMode) => void;

  // Active project
  activeProjectId: string | null;
  setActiveProjectId: (id: string | null) => void;

  // Binder tab (manuscript vs codex vs research)
  binderTab: "manuscript" | "codex" | "research";
  setBinderTab: (tab: "manuscript" | "codex" | "research") => void;

  // Selected research item (for research tab)
  selectedResearchItemId: string | null;
  setSelectedResearchItemId: (id: string | null) => void;

  // Selected codex entry
  selectedCodexEntryId: string | null;
  setSelectedCodexEntryId: (id: string | null) => void;

  // Sidebar visibility
  sidebarVisible: boolean;
  toggleSidebar: () => void;

  // Command palette
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  toggleCommandPalette: () => void;

  // Save status
  saveStatus: "saved" | "saving" | "unsaved";
  setSaveStatus: (status: "saved" | "saving" | "unsaved") => void;

  // Total word count (from the full manuscript)
  totalWordCount: number;
  setTotalWordCount: (count: number) => void;

  // Current scene word count (for status bar — current section or total)
  currentSceneWordCount: number;
  setCurrentSceneWordCount: (count: number) => void;

  // Selection word count
  selectionWordCount: number;
  setSelectionWordCount: (count: number) => void;

  // Editor instance (shared for proofreading etc.)
  editorInstance: Editor | null;
  setEditorInstance: (editor: Editor | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  mode: "write",
  setMode: (mode) => set({ mode }),

  activeProjectId: null,
  setActiveProjectId: (id) => set({ activeProjectId: id }),

  binderTab: "manuscript",
  setBinderTab: (tab) => set({ binderTab: tab }),

  selectedResearchItemId: null,
  setSelectedResearchItemId: (id) => set({ selectedResearchItemId: id }),

  selectedCodexEntryId: null,
  setSelectedCodexEntryId: (id) => set({ selectedCodexEntryId: id }),

  sidebarVisible: true,
  toggleSidebar: () => set((s) => ({ sidebarVisible: !s.sidebarVisible })),

  commandPaletteOpen: false,
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  toggleCommandPalette: () => set((s) => ({ commandPaletteOpen: !s.commandPaletteOpen })),

  saveStatus: "saved",
  setSaveStatus: (status) => set({ saveStatus: status }),

  totalWordCount: 0,
  setTotalWordCount: (count) => set({ totalWordCount: count }),

  currentSceneWordCount: 0,
  setCurrentSceneWordCount: (count) => set({ currentSceneWordCount: count }),

  selectionWordCount: 0,
  setSelectionWordCount: (count) => set({ selectionWordCount: count }),

  editorInstance: null,
  setEditorInstance: (editor) => set({ editorInstance: editor }),
}));
