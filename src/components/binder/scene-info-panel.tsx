"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useBinderItem, useUpdateBinderItem } from "@/hooks/use-binder";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

interface SceneInfoPanelProps {
  itemId: string;
  projectId: string;
}

export function SceneInfoPanel({ itemId, projectId }: SceneInfoPanelProps) {
  const { data: item } = useBinderItem(itemId);
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

  const handleCompileToggle = useCallback(() => {
    if (!item) return;
    updateItem.mutate({
      id: itemId,
      projectId,
      data: { includeInCompile: !item.includeInCompile },
    });
  }, [itemId, projectId, item, updateItem]);

  if (!item) return null;

  return (
    <div className="border-t flex flex-col h-full overflow-hidden">
      <Tabs defaultValue="synopsis" className="flex flex-col h-full min-h-0">
        <TabsList className="mx-2 mt-1.5 mb-1 grid w-auto grid-cols-3 h-7 shrink-0">
          <TabsTrigger value="synopsis" className="text-[11px] h-6">
            あらすじ
          </TabsTrigger>
          <TabsTrigger value="notes" className="text-[11px] h-6">
            メモ
          </TabsTrigger>
          <TabsTrigger value="meta" className="text-[11px] h-6">
            メタ
          </TabsTrigger>
        </TabsList>

        <TabsContent value="synopsis" className="flex-1 min-h-0 px-3 pb-2 m-0">
          <textarea
            value={synopsis}
            onChange={(e) => handleSynopsisChange(e.target.value)}
            placeholder="あらすじを入力..."
            className="w-full h-full resize-none text-xs rounded-md border border-input bg-transparent px-3 py-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </TabsContent>

        <TabsContent value="notes" className="flex-1 min-h-0 px-3 pb-2 m-0">
          <textarea
            value={notes}
            onChange={(e) => handleNotesChange(e.target.value)}
            placeholder="メモを入力..."
            className="w-full h-full resize-none text-xs rounded-md border border-input bg-transparent px-3 py-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </TabsContent>

        <TabsContent value="meta" className="flex-1 min-h-0 px-3 pb-2 m-0 overflow-y-auto">
          <div className="space-y-3">
            <div className="space-y-1.5 text-[11px] text-muted-foreground">
              <div className="flex justify-between">
                <span>文字数</span>
                <span className="font-mono">{item.wordCount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>作成日</span>
                <span>{new Date(item.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span>更新日</span>
                <span>{new Date(item.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <Label className="text-[11px] text-muted-foreground">出力に含める</Label>
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
