"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useUIStore } from "@/stores/ui-store";
import { useBinderItem, useUpdateBinderItem } from "@/hooks/use-binder";
import { useProject } from "@/hooks/use-projects";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, StickyNote, Tags, Info, SpellCheck } from "lucide-react";
import { ProofreadingTab } from "./proofreading-tab";

interface InspectorPanelProps {
  projectId: string;
}

// Note: We need the switch component. Import it - if it doesn't exist we'll handle it.
// Actually let's use a simple checkbox approach or just use a basic toggle.

export function InspectorPanel({ projectId }: InspectorPanelProps) {
  const selectedItemId = useUIStore((s) => s.selectedItemId);
  const { data: item } = useBinderItem(selectedItemId);
  const { data: project } = useProject(projectId);
  const updateItem = useUpdateBinderItem();

  const [synopsis, setSynopsis] = useState("");
  const [notes, setNotes] = useState("");
  const synopsisTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notesTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync local state with item data
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
        if (selectedItemId) {
          updateItem.mutate({
            id: selectedItemId,
            projectId,
            data: { synopsis: value },
          });
        }
      }, 800);
    },
    [selectedItemId, projectId, updateItem]
  );

  const handleNotesChange = useCallback(
    (value: string) => {
      setNotes(value);
      if (notesTimeoutRef.current) clearTimeout(notesTimeoutRef.current);
      notesTimeoutRef.current = setTimeout(() => {
        if (selectedItemId) {
          updateItem.mutate({
            id: selectedItemId,
            projectId,
            data: { notes: value },
          });
        }
      }, 800);
    },
    [selectedItemId, projectId, updateItem]
  );

  const handleLabelChange = useCallback(
    (value: string) => {
      if (!selectedItemId) return;
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
      if (!selectedItemId) return;
      updateItem.mutate({
        id: selectedItemId,
        projectId,
        data: { statusId: value === "none" ? null : value },
      });
    },
    [selectedItemId, projectId, updateItem]
  );

  const handleCompileToggle = useCallback(() => {
    if (!selectedItemId || !item) return;
    updateItem.mutate({
      id: selectedItemId,
      projectId,
      data: { includeInCompile: !item.includeInCompile },
    });
  }, [selectedItemId, projectId, item, updateItem]);

  if (!selectedItemId || !item) {
    return (
      <div className="flex h-full flex-col border-l bg-muted/30">
        <div className="flex items-center border-b px-3 py-2">
          <span className="text-xs font-semibold uppercase text-muted-foreground">
            インスペクター
          </span>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-4 text-center text-muted-foreground">
          <Info className="h-8 w-8 opacity-20" />
          <div className="space-y-1">
            <p className="text-sm font-medium">アイテムを選択</p>
            <p className="text-xs">バインダーからシーンやフォルダを選択すると、詳細情報をここに表示します</p>
          </div>
        </div>
      </div>
    );
  }

  const labels = project?.settings.labels ?? [];
  const statuses = project?.settings.statuses ?? [];

  return (
    <div className="flex h-full flex-col border-l bg-muted/30">
      <div className="flex items-center border-b px-3 py-2">
        <span className="text-xs font-semibold uppercase text-muted-foreground">
          インスペクター
        </span>
      </div>
      <Tabs defaultValue="synopsis" className="flex flex-1 flex-col">
        <TabsList className="mx-2 mt-2 grid w-auto grid-cols-4">
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
    </div>
  );
}
