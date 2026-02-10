import { create } from "zustand";
import type {
  ProofreadingIssue,
  ProofreadingStatus,
} from "@/lib/proofreading/types";

interface ProofreadingState {
  status: ProofreadingStatus;
  issues: ProofreadingIssue[];
  summary: string;
  selectedIssueId: string | null;
  errorMessage: string | null;

  setStatus: (status: ProofreadingStatus) => void;
  setResult: (issues: ProofreadingIssue[], summary: string) => void;
  setError: (message: string) => void;
  selectIssue: (id: string | null) => void;
  dismissIssue: (id: string) => void;
  clearAll: () => void;
}

export const useProofreadingStore = create<ProofreadingState>((set) => ({
  status: "idle",
  issues: [],
  summary: "",
  selectedIssueId: null,
  errorMessage: null,

  setStatus: (status) => set({ status, errorMessage: null }),
  setResult: (issues, summary) =>
    set({ issues, summary, status: "done", errorMessage: null }),
  setError: (message) => set({ status: "error", errorMessage: message }),
  selectIssue: (id) => set({ selectedIssueId: id }),
  dismissIssue: (id) =>
    set((state) => ({
      issues: state.issues.filter((i) => i.id !== id),
      selectedIssueId:
        state.selectedIssueId === id ? null : state.selectedIssueId,
    })),
  clearAll: () =>
    set({
      status: "idle",
      issues: [],
      summary: "",
      selectedIssueId: null,
      errorMessage: null,
    }),
}));
