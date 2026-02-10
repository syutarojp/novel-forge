"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useBinderItem, useUpdateBinderItem } from "@/hooks/use-binder";
import { useProject } from "@/hooks/use-projects";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SceneInfoPanelProps {
  itemId: string;
  projectId: string;
}

export function SceneInfoPanel({ itemId, projectId }: SceneInfoPanelProps) {
  const { data: item } = useBinderItem(itemId);
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
          id: itemId,
          projectId,
          data: { synopsis: value },
        });
      }, 800);
    },
    [itemId, projectId, updateItem]
  );

  const handleNotesChange = useCallback(
    (value: string) => {
      setNotes(value);
      if (notesTimeoutRef.current) clearTimeout(notesTimeoutRef.current);
      notesTimeoutRef.current = setTimeout(() => {
        updateItem.mutate({
          id: itemId,
          projectId,
          data: { notes: value },
        });
      }, 800);
    },
    [itemId, projectId, updateItem]
  );

  const handleLabelChange = useCallback(
    (value: string) => {
      updateItem.mutate({
        id: itemId,
        projectId,
        data: { labelId: value === "none" ? null : value },
      });
    },
    [itemId, projectId, updateItem]
  );

  const handleStatusChange = useCallback(
    (value: string) => {
      updateItem.mutate({
        id: itemId,
        projectId,
        data: { statusId: value === "none" ? null : value },
      });
    },
    [itemId, projectId, updateItem]
  );

  const handleCompileToggle = useCallback(() => {
    if (!item) return;
    updateItem.mutate({
      id: itemId,
      projectId,
      data: { includeInCompile: !item.includeInCompile },
    });
  }, [itemId, projectId, item, updateItem]);

  if (!item) return null;

  const labels = project?.settings.labels ?? [];
  const statuses = project?.settings.statuses ?? [];

  return (
    <div className="border-t">
      <div className="space-y-2 p-3">
        {/* Synopsis */}
        <div>
          <Label className="text-[10px] text-muted-foreground">あらすじ</Label>
          <Textarea
            value={synopsis}
            onChange={(e) => handleSynopsisChange(e.target.value)}
            placeholder="あらすじを入力..."
            className="mt-0.5 min-h-[60px] max-h-[80px] resize-none text-xs"
          />
        </div>

        {/* Notes */}
        <div>
          <Label className="text-[10px] text-muted-foreground">メモ</Label>
          <Textarea
            value={notes}
            onChange={(e) => handleNotesChange(e.target.value)}
            placeholder="メモを入力..."
            className="mt-0.5 min-h-[40px] max-h-[60px] resize-none text-xs"
          />
        </div>

        <Separator />

        {/* Compact metadata row */}
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-muted-foreground">
          <span>{item.wordCount.toLocaleString()} 文字</span>
          <span>作成 {new Date(item.createdAt).toLocaleDateString()}</span>
          <span>更新 {new Date(item.updatedAt).toLocaleDateString()}</span>
        </div>

        {/* Label & Status selects */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-[10px] text-muted-foreground">ラベル</Label>
            <Select
              value={item.labelId ?? "none"}
              onValueChange={handleLabelChange}
            >
              <SelectTrigger className="h-7 text-xs mt-0.5">
                <SelectValue placeholder="なし" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">なし</SelectItem>
                {labels.map((label) => (
                  <SelectItem key={label.id} value={label.id}>
                    <div className="flex items-center gap-1.5">
                      <div
                        className="h-2 w-2 rounded-full"
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
            <Label className="text-[10px] text-muted-foreground">ステータス</Label>
            <Select
              value={item.statusId ?? "none"}
              onValueChange={handleStatusChange}
            >
              <SelectTrigger className="h-7 text-xs mt-0.5">
                <SelectValue placeholder="なし" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">なし</SelectItem>
                {statuses.map((status) => (
                  <SelectItem key={status.id} value={status.id}>
                    {status.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Include in compile toggle */}
        <div className="flex items-center justify-between">
          <Label className="text-[10px] text-muted-foreground">出力に含める</Label>
          <button
            onClick={handleCompileToggle}
            className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${
              item.includeInCompile ? "bg-primary" : "bg-input"
            }`}
          >
            <span
              className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                item.includeInCompile ? "translate-x-3.5" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
