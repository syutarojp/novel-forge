export type IssueCategory =
  | "誤字脱字"
  | "表記ゆれ"
  | "文法"
  | "句読点"
  | "表現改善"
  | "文体統一";

export type IssueSeverity = "error" | "warning" | "info";

export interface ProofreadingIssue {
  id: string;
  category: IssueCategory;
  severity: IssueSeverity;
  original: string;
  suggestion: string;
  reason: string;
  context: string;
}

export interface ProofreadingResult {
  issues: ProofreadingIssue[];
  summary: string;
}

export type ProofreadingStatus = "idle" | "loading" | "done" | "error";

export interface ProofreadingState {
  status: ProofreadingStatus;
  issues: ProofreadingIssue[];
  summary: string;
  selectedIssueId: string | null;
  errorMessage: string | null;
}
