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

  // Selected binder item
  selectedItemId: string | null;
  setSelectedItemId: (id: string | null) => void;

  // Multi-selection for binder
  selectedItemIds: string[];
  setSelectedItemIds: (ids: string[]) => void;
  toggleItemSelection: (id: string) => void;

  // Panel visibility
  binderVisible: boolean;
  inspectorVisible: boolean;
  toggleBinder: () => void;
  toggleInspector: () => void;

  // Codex drawer
  codexOpen: boolean;
  codexEntryId: string | null;
  openCodex: (entryId?: string) => void;
  closeCodex: () => void;

  // Save status
  saveStatus: "saved" | "saving" | "unsaved";
  setSaveStatus: (status: "saved" | "saving" | "unsaved") => void;

  // Total word count (cached)
  totalWordCount: number;
  setTotalWordCount: (count: number) => void;

  // Editor instance (shared for proofreading etc.)
  editorInstance: Editor | null;
  setEditorInstance: (editor: Editor | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  mode: "write",
  setMode: (mode) => set({ mode }),

  activeProjectId: null,
  setActiveProjectId: (id) => set({ activeProjectId: id }),

  selectedItemId: null,
  setSelectedItemId: (id) => set({ selectedItemId: id, selectedItemIds: id ? [id] : [] }),

  selectedItemIds: [],
  setSelectedItemIds: (ids) => set({ selectedItemIds: ids }),
  toggleItemSelection: (id) =>
    set((state) => {
      const ids = state.selectedItemIds.includes(id)
        ? state.selectedItemIds.filter((i) => i !== id)
        : [...state.selectedItemIds, id];
      return { selectedItemIds: ids, selectedItemId: ids[ids.length - 1] ?? null };
    }),

  binderVisible: true,
  inspectorVisible: true,
  toggleBinder: () => set((s) => ({ binderVisible: !s.binderVisible })),
  toggleInspector: () => set((s) => ({ inspectorVisible: !s.inspectorVisible })),

  codexOpen: false,
  codexEntryId: null,
  openCodex: (entryId) => set({ codexOpen: true, codexEntryId: entryId ?? null }),
  closeCodex: () => set({ codexOpen: false, codexEntryId: null }),

  saveStatus: "saved",
  setSaveStatus: (status) => set({ saveStatus: status }),

  totalWordCount: 0,
  setTotalWordCount: (count) => set({ totalWordCount: count }),

  editorInstance: null,
  setEditorInstance: (editor) => set({ editorInstance: editor }),
}));
