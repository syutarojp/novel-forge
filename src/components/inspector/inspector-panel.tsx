"use client";

import React, { useState } from "react";
import { useUIStore } from "@/stores/ui-store";
import { useResearchItem } from "@/hooks/use-binder";
import {
  useCodexEntry,
  useCodexEntries,
  useCodexRelations,
  useCreateCodexRelation,
  useDeleteCodexRelation,
} from "@/hooks/use-codex";
import { useProject } from "@/hooks/use-projects";
import { getCodexTypeDef } from "@/lib/codex-utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  Info,
  SpellCheck,
  Link2,
  Calendar,
  Plus,
  X,
} from "lucide-react";
import { ProofreadingTab } from "./proofreading-tab";

/**
 * InspectorContent — renders inside the sidebar "情報" tab.
 * No outer shell/border — the parent provides the container.
 */
export function InspectorContent({ projectId }: { projectId: string }) {
  const binderTab = useUIStore((s) => s.binderTab);
  const selectedCodexEntryId = useUIStore((s) => s.selectedCodexEntryId);
  const selectedResearchItemId = useUIStore((s) => s.selectedResearchItemId);

  if (binderTab === "codex" && selectedCodexEntryId) {
    return <CodexInspectorContent entryId={selectedCodexEntryId} projectId={projectId} />;
  }

  if (binderTab === "research" && selectedResearchItemId) {
    return <ResearchInspectorContent itemId={selectedResearchItemId} projectId={projectId} />;
  }

  // Default: manuscript inspector
  return <ManuscriptInspectorContent projectId={projectId} />;
}

// === Manuscript Inspector Content ===

function ManuscriptInspectorContent({ projectId }: { projectId: string }) {
  const { data: project } = useProject(projectId);
  const totalWordCount = useUIStore((s) => s.totalWordCount);

  if (!project) return null;

  const progress = project.targetWordCount > 0
    ? Math.round((totalWordCount / project.targetWordCount) * 100)
    : 0;

  return (
    <Tabs defaultValue="info" className="flex flex-1 flex-col">
      <TabsList className="mx-2 mt-1 grid w-auto grid-cols-2">
        <TabsTrigger value="info" className="text-[11px] gap-1">
          <FileText className="h-3 w-3" />
          情報
        </TabsTrigger>
        <TabsTrigger value="proofread" className="text-[11px] gap-1">
          <SpellCheck className="h-3 w-3" />
          校正
        </TabsTrigger>
      </TabsList>

      <ScrollArea className="flex-1">
        <TabsContent value="info" className="px-3 pb-3">
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">タイトル</Label>
              <p className="text-sm font-medium">{project.title}</p>
            </div>
            <Separator />
            <div>
              <Label className="text-xs text-muted-foreground">著者</Label>
              <p className="text-sm">{project.author || "—"}</p>
            </div>
            <Separator />
            <div>
              <Label className="text-xs text-muted-foreground">ジャンル</Label>
              <p className="text-sm">{project.genre || "—"}</p>
            </div>
            <Separator />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>現在の文字数</span>
              <span className="font-mono text-foreground">{totalWordCount.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>目標文字数</span>
              <span className="font-mono">
                {project.targetWordCount > 0
                  ? project.targetWordCount.toLocaleString()
                  : "—"}
              </span>
            </div>
            {project.targetWordCount > 0 && (
              <div>
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>進捗</span>
                  <span className="font-mono">{progress}%</span>
                </div>
                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
              </div>
            )}
            <Separator />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>作成日</span>
              <span>{new Date(project.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>更新日</span>
              <span>{new Date(project.updatedAt).toLocaleDateString()}</span>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="proofread" className="px-3 pb-3">
          <ProofreadingTab />
        </TabsContent>
      </ScrollArea>
    </Tabs>
  );
}

// === Research Inspector Content ===

function ResearchInspectorContent({ itemId, projectId }: { itemId: string; projectId: string }) {
  const { data: item } = useResearchItem(itemId);

  if (!item) return null;

  return (
    <div className="flex flex-1 flex-col">
      <ScrollArea className="flex-1">
        <div className="px-3 py-3 space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">タイトル</Label>
            <p className="text-sm font-medium">{item.title}</p>
          </div>
          <Separator />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>文字数</span>
            <span className="font-mono">{item.wordCount.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>作成日</span>
            <span>{new Date(item.createdAt).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>更新日</span>
            <span>{new Date(item.updatedAt).toLocaleDateString()}</span>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

// === Codex Inspector Content ===

function CodexInspectorContent({ entryId, projectId }: { entryId: string; projectId: string }) {
  const { data: entry } = useCodexEntry(entryId, projectId);
  const { data: allEntries = [] } = useCodexEntries(projectId);
  const { data: relations = [] } = useCodexRelations(projectId);
  const createRelation = useCreateCodexRelation();
  const deleteRelation = useDeleteCodexRelation();
  const setSelectedCodexEntryId = useUIStore((s) => s.setSelectedCodexEntryId);

  const [relationTarget, setRelationTarget] = useState("");
  const [relationLabel, setRelationLabel] = useState("");

  if (!entry) return null;

  const entryRelations = relations.filter(
    (r) => r.sourceId === entryId || r.targetId === entryId
  );

  const handleAddRelation = () => {
    if (!relationTarget || !relationLabel.trim()) return;
    createRelation.mutate({
      projectId,
      sourceId: entryId,
      targetId: relationTarget,
      label: relationLabel.trim(),
    });
    setRelationTarget("");
    setRelationLabel("");
  };

  const typeDef = getCodexTypeDef(entry.type);

  return (
    <Tabs defaultValue="relations" className="flex flex-1 flex-col">
      <TabsList className="mx-2 mt-1 grid w-auto grid-cols-2">
        <TabsTrigger value="relations" className="text-[11px] gap-1">
          <Link2 className="h-3 w-3" />
          関連
        </TabsTrigger>
        <TabsTrigger value="meta" className="text-[11px] gap-1">
          <Calendar className="h-3 w-3" />
          メタ
        </TabsTrigger>
      </TabsList>

      <ScrollArea className="flex-1">
        <TabsContent value="relations" className="px-3 pb-3">
          <div className="space-y-3">
            {entryRelations.length > 0 ? (
              <div className="space-y-1.5">
                {entryRelations.map((rel) => {
                  const otherId =
                    rel.sourceId === entryId ? rel.targetId : rel.sourceId;
                  const other = allEntries.find((e) => e.id === otherId);
                  if (!other) return null;
                  const otherType = getCodexTypeDef(other.type);
                  const OtherIcon = otherType.icon;
                  return (
                    <div
                      key={rel.id}
                      className="flex items-center gap-2 text-sm rounded-md border px-2 py-1.5"
                    >
                      <OtherIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <button
                        className="truncate hover:underline text-left flex-1"
                        onClick={() => setSelectedCodexEntryId(otherId)}
                      >
                        {other.name}
                      </button>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {rel.label}
                      </span>
                      <button
                        onClick={() =>
                          deleteRelation.mutate({ id: rel.id, projectId })
                        }
                        className="text-muted-foreground hover:text-destructive shrink-0"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground py-2">
                関連エントリがありません
              </p>
            )}

            <Separator />

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">関連を追加</Label>
              <Select value={relationTarget} onValueChange={setRelationTarget}>
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="エントリを選択..." />
                </SelectTrigger>
                <SelectContent>
                  {allEntries
                    .filter((e) => e.id !== entryId)
                    .map((e) => {
                      const t = getCodexTypeDef(e.type);
                      const TIcon = t.icon;
                      return (
                        <SelectItem key={e.id} value={e.id}>
                          <div className="flex items-center gap-2">
                            <TIcon className="h-3.5 w-3.5" />
                            {e.name}
                          </div>
                        </SelectItem>
                      );
                    })}
                </SelectContent>
              </Select>
              <Input
                value={relationLabel}
                onChange={(e) => setRelationLabel(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddRelation()}
                placeholder="関係ラベル (例: 友人、所在地)"
                className="text-xs"
              />
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-1 text-xs"
                onClick={handleAddRelation}
                disabled={!relationTarget || !relationLabel.trim()}
              >
                <Plus className="h-3 w-3" />
                追加
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="meta" className="px-3 pb-3">
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">種類</Label>
              <Badge variant="outline" className="mt-1 gap-1">
                {React.createElement(typeDef.icon, { className: "h-3 w-3" })}
                {typeDef.label}
              </Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>作成日</span>
              <span>{new Date(entry.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>更新日</span>
              <span>{new Date(entry.updatedAt).toLocaleDateString()}</span>
            </div>
            {entry.tags.length > 0 && (
              <>
                <Separator />
                <div>
                  <Label className="text-xs text-muted-foreground">タグ</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {entry.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-[10px]">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </TabsContent>
      </ScrollArea>
    </Tabs>
  );
}
