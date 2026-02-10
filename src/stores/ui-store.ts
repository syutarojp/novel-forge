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

  // Binder tab (manuscript vs codex)
  binderTab: "manuscript" | "codex";
  setBinderTab: (tab: "manuscript" | "codex") => void;

  // Selection type (which panel owns the selection)
  selectionType: "binder" | "codex";

  // Selected binder item
  selectedItemId: string | null;
  setSelectedItemId: (id: string | null) => void;

  // Selected codex entry
  selectedCodexEntryId: string | null;
  setSelectedCodexEntryId: (id: string | null) => void;

  // Multi-selection for binder
  selectedItemIds: string[];
  setSelectedItemIds: (ids: string[]) => void;
  toggleItemSelection: (id: string) => void;

  // Panel visibility
  binderVisible: boolean;
  inspectorVisible: boolean;
  toggleBinder: () => void;
  toggleInspector: () => void;

  // Focus mode
  focusMode: boolean;
  toggleFocusMode: () => void;

  // Command palette
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  toggleCommandPalette: () => void;

  // Save status
  saveStatus: "saved" | "saving" | "unsaved";
  setSaveStatus: (status: "saved" | "saving" | "unsaved") => void;

  // Total word count (cached)
  totalWordCount: number;
  setTotalWordCount: (count: number) => void;

  // Current scene word count
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

  selectionType: "binder",

  selectedItemId: null,
  setSelectedItemId: (id) =>
    set({ selectedItemId: id, selectedItemIds: id ? [id] : [], selectionType: "binder" }),

  selectedCodexEntryId: null,
  setSelectedCodexEntryId: (id) => set({ selectedCodexEntryId: id, selectionType: "codex" }),

  selectedItemIds: [],
  setSelectedItemIds: (ids) => set({ selectedItemIds: ids }),
  toggleItemSelection: (id) =>
    set((state) => {
      const ids = state.selectedItemIds.includes(id)
        ? state.selectedItemIds.filter((i) => i !== id)
        : [...state.selectedItemIds, id];
      return { selectedItemIds: ids, selectedItemId: ids[ids.length - 1] ?? null, selectionType: "binder" };
    }),

  binderVisible: true,
  inspectorVisible: true,
  toggleBinder: () => set((s) => ({ binderVisible: !s.binderVisible })),
  toggleInspector: () => set((s) => ({ inspectorVisible: !s.inspectorVisible })),

  focusMode: false,
  toggleFocusMode: () =>
    set((s) => {
      const next = !s.focusMode;
      return {
        focusMode: next,
        binderVisible: next ? false : true,
        inspectorVisible: next ? false : true,
      };
    }),

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
