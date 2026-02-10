"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useUIStore } from "@/stores/ui-store";
import { useBinderItem, useUpdateBinderItem } from "@/hooks/use-binder";
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
import { Textarea } from "@/components/ui/textarea";
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
  StickyNote,
  Tags,
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
  const selectionType = useUIStore((s) => s.selectionType);
  const selectedItemId = useUIStore((s) => s.selectedItemId);
  const selectedCodexEntryId = useUIStore((s) => s.selectedCodexEntryId);

  if (selectionType === "codex" && selectedCodexEntryId) {
    return <CodexInspectorContent entryId={selectedCodexEntryId} projectId={projectId} />;
  }

  if (selectedItemId) {
    return <BinderInspectorContent selectedItemId={selectedItemId} projectId={projectId} />;
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-4 text-center text-muted-foreground">
      <Info className="h-8 w-8 opacity-20" />
      <div className="space-y-1">
        <p className="text-sm font-medium">アイテムを選択</p>
        <p className="text-xs">シーンやエントリを選択すると、詳細をここに表示します</p>
      </div>
    </div>
  );
}

// === Codex Inspector Content ===

function CodexInspectorContent({ entryId, projectId }: { entryId: string; projectId: string }) {
  const { data: entry } = useCodexEntry(entryId);
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

// === Binder Inspector Content ===

function BinderInspectorContent({
  selectedItemId,
  projectId,
}: {
  selectedItemId: string;
  projectId: string;
}) {
  const { data: item } = useBinderItem(selectedItemId);
  const { data: project } = useProject(projectId);
  const updateItem = useUpdateBinderItem();

  const [synopsis, setSynopsis] = useState("");
  const [notes, setNotes] = useState("");
  const synopsisTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notesTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (item) {
      setSynopsis(item.synopsis || "");
      setNotes(item.notes || "");
    }
  }, [item?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSynopsisChange = useCallback(
    (value: string) => {
      setSynopsis(value);
      if (synopsisTimeoutRef.current) clearTimeout(synopsisTimeoutRef.current);
      synopsisTimeoutRef.current = setTimeout(() => {
        updateItem.mutate({
          id: selectedItemId,
          projectId,
          data: { synopsis: value },
        });
      }, 800);
    },
    [selectedItemId, projectId, updateItem]
  );

  const handleNotesChange = useCallback(
    (value: string) => {
      setNotes(value);
      if (notesTimeoutRef.current) clearTimeout(notesTimeoutRef.current);
      notesTimeoutRef.current = setTimeout(() => {
        updateItem.mutate({
          id: selectedItemId,
          projectId,
          data: { notes: value },
        });
      }, 800);
    },
    [selectedItemId, projectId, updateItem]
  );

  const handleLabelChange = useCallback(
    (value: string) => {
      updateItem.mutate({
        id: selectedItemId,
        projectId,
        data: { labelId: value === "none" ? null : value },
      });
    },
    [selectedItemId, projectId, updateItem]
  );

  const handleStatusChange = useCallback(
    (value: string) => {
      updateItem.mutate({
        id: selectedItemId,
        projectId,
        data: { statusId: value === "none" ? null : value },
      });
    },
    [selectedItemId, projectId, updateItem]
  );

  const handleCompileToggle = useCallback(() => {
    if (!item) return;
    updateItem.mutate({
      id: selectedItemId,
      projectId,
      data: { includeInCompile: !item.includeInCompile },
    });
  }, [selectedItemId, projectId, item, updateItem]);

  if (!item) return null;

  const labels = project?.settings.labels ?? [];
  const statuses = project?.settings.statuses ?? [];

  return (
    <Tabs defaultValue="synopsis" className="flex flex-1 flex-col">
      <TabsList className="mx-2 mt-1 grid w-auto grid-cols-4">
        <TabsTrigger value="synopsis" className="text-[11px] gap-1">
          <FileText className="h-3 w-3" />
          あらすじ
        </TabsTrigger>
        <TabsTrigger value="notes" className="text-[11px] gap-1">
          <StickyNote className="h-3 w-3" />
          メモ
        </TabsTrigger>
        <TabsTrigger value="metadata" className="text-[11px] gap-1">
          <Tags className="h-3 w-3" />
          メタ
        </TabsTrigger>
        <TabsTrigger value="proofread" className="text-[11px] gap-1">
          <SpellCheck className="h-3 w-3" />
          校正
        </TabsTrigger>
      </TabsList>

      <ScrollArea className="flex-1">
        <TabsContent value="synopsis" className="px-3 pb-3">
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">タイトル</Label>
              <p className="text-sm font-medium">{item.title}</p>
            </div>
            <Separator />
            <div>
              <Label className="text-xs text-muted-foreground">あらすじ</Label>
              <Textarea
                value={synopsis}
                onChange={(e) => handleSynopsisChange(e.target.value)}
                placeholder="あらすじを入力..."
                className="mt-1 min-h-[120px] resize-none text-sm"
              />
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
        </TabsContent>

        <TabsContent value="notes" className="px-3 pb-3">
          <div>
            <Label className="text-xs text-muted-foreground">メモ</Label>
            <Textarea
              value={notes}
              onChange={(e) => handleNotesChange(e.target.value)}
              placeholder="メモを入力..."
              className="mt-1 min-h-[300px] resize-none text-sm"
            />
          </div>
        </TabsContent>

        <TabsContent value="metadata" className="px-3 pb-3">
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground">ラベル</Label>
              <Select
                value={item.labelId ?? "none"}
                onValueChange={handleLabelChange}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="ラベルなし" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">ラベルなし</SelectItem>
                  {labels.map((label) => (
                    <SelectItem key={label.id} value={label.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: label.color }}
                        />
                        {label.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">ステータス</Label>
              <Select
                value={item.statusId ?? "none"}
                onValueChange={handleStatusChange}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="ステータスなし" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">ステータスなし</SelectItem>
                  {statuses.map((status) => (
                    <SelectItem key={status.id} value={status.id}>
                      {status.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs text-muted-foreground">
                  出力に含める
                </Label>
                <p className="text-[10px] text-muted-foreground">
                  エクスポート時にこのアイテムを含めます
                </p>
              </div>
              <button
                onClick={handleCompileToggle}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  item.includeInCompile ? "bg-primary" : "bg-input"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    item.includeInCompile ? "translate-x-4" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>

            <Separator />

            <div>
              <Label className="text-xs text-muted-foreground">種類</Label>
              <Badge variant="outline" className="mt-1 capitalize">
                {item.type}
              </Badge>
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
