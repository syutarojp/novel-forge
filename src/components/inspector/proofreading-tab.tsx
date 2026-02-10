"use client";

import { useProofreadingStore } from "@/stores/proofreading-store";
import { useProofread, useApplySuggestion } from "@/hooks/use-proofreading";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Check,
  X,
  Loader2,
  SpellCheck,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import type { ProofreadingIssue, IssueSeverity } from "@/lib/proofreading/types";

const severityConfig: Record<
  IssueSeverity,
  { label: string; className: string }
> = {
  error: { label: "エラー", className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
  warning: { label: "警告", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
  info: { label: "提案", className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
};

function IssueCard({ issue }: { issue: ProofreadingIssue }) {
  const selectIssue = useProofreadingStore((s) => s.selectIssue);
  const selectedIssueId = useProofreadingStore((s) => s.selectedIssueId);
  const dismissIssue = useProofreadingStore((s) => s.dismissIssue);
  const applySuggestion = useApplySuggestion();
  const isSelected = selectedIssueId === issue.id;

  const severity = severityConfig[issue.severity] || severityConfig.info;

  return (
    <div
      className={`rounded-md border p-2.5 text-xs transition-colors cursor-pointer ${
        isSelected
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/50"
      }`}
      onClick={() => selectIssue(isSelected ? null : issue.id)}
    >
      <div className="flex items-center gap-1.5 mb-1.5">
        <Badge
          variant="outline"
          className={`text-[10px] px-1.5 py-0 ${severity.className}`}
        >
          {issue.category}
        </Badge>
        <span className={`text-[10px] font-medium ${severity.className} rounded px-1`}>
          {severity.label}
        </span>
      </div>

      <div className="space-y-1">
        <div className="flex items-center gap-1.5">
          <span className="line-through text-muted-foreground">{issue.original}</span>
          <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground" />
          <span className="font-medium text-green-700 dark:text-green-400">
            {issue.suggestion}
          </span>
        </div>

        <p className="text-muted-foreground leading-relaxed">{issue.reason}</p>
      </div>

      {isSelected && (
        <div className="flex gap-1.5 mt-2 pt-2 border-t">
          <Button
            size="xs"
            onClick={(e) => {
              e.stopPropagation();
              applySuggestion(issue);
            }}
          >
            <Check className="h-3 w-3" />
            適用
          </Button>
          <Button
            size="xs"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              dismissIssue(issue.id);
            }}
          >
            <X className="h-3 w-3" />
            無視
          </Button>
        </div>
      )}
    </div>
  );
}

export function ProofreadingTab() {
  const status = useProofreadingStore((s) => s.status);
  const issues = useProofreadingStore((s) => s.issues);
  const summary = useProofreadingStore((s) => s.summary);
  const errorMessage = useProofreadingStore((s) => s.errorMessage);
  const clearAll = useProofreadingStore((s) => s.clearAll);
  const runProofread = useProofread();

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={runProofread}
          disabled={status === "loading"}
          className="flex-1"
        >
          {status === "loading" ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              校正中...
            </>
          ) : (
            <>
              <SpellCheck className="h-3.5 w-3.5" />
              校正を実行
            </>
          )}
        </Button>
        {issues.length > 0 && (
          <Button size="sm" variant="ghost" onClick={clearAll}>
            クリア
          </Button>
        )}
      </div>

      {status === "error" && errorMessage && (
        <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-2.5 text-xs text-red-800 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">
          <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {summary && (
        <>
          <div className="rounded-md bg-muted/50 p-2.5 text-xs text-muted-foreground leading-relaxed">
            {summary}
          </div>
          <Separator />
        </>
      )}

      {status === "done" && issues.length === 0 && (
        <div className="text-center py-6 text-xs text-muted-foreground">
          <Check className="h-8 w-8 mx-auto mb-2 text-green-500" />
          問題は見つかりませんでした
        </div>
      )}

      {issues.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>指摘 {issues.length}件</span>
            <span>
              {issues.filter((i) => i.severity === "error").length}エラー /
              {issues.filter((i) => i.severity === "warning").length}警告 /
              {issues.filter((i) => i.severity === "info").length}提案
            </span>
          </div>
          {issues.map((issue) => (
            <IssueCard key={issue.id} issue={issue} />
          ))}
        </div>
      )}
    </div>
  );
}
