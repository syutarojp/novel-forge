"use client";

import { useMemo } from "react";
import { useResearchItems, useCreateResearchItem } from "@/hooks/use-binder";
import { useProject } from "@/hooks/use-projects";
import { useUIStore } from "@/stores/ui-store";
import { OutlinePanel } from "./outline-panel";
import { CodexBrowserPanel } from "@/components/codex/codex-browser-panel";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, FileText, Heading2Icon } from "lucide-react";
import type { BinderItem } from "@/types";

interface BinderPanelProps {
  projectId: string;
}

function ResearchPanel({
  items,
  projectId,
}: {
  items: BinderItem[];
  projectId: string;
}) {
  const createItem = useCreateResearchItem();
  const selectedItemId = useUIStore((s) => s.selectedResearchItemId);
  const setSelectedItemId = useUIStore((s) => s.setSelectedResearchItemId);

  const researchItems = useMemo(
    () => items.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()),
    [items]
  );

  const handleAdd = () => {
    createItem.mutate(
      {
        projectId,
        title: "無題のリサーチ",
      },
      {
        onSuccess: (item) => setSelectedItemId(item.id),
      }
    );
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-end px-3 py-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1 px-2 text-xs"
          onClick={handleAdd}
        >
          <Plus className="h-3.5 w-3.5" />
          リサーチ
        </Button>
      </div>
      <ScrollArea className="flex-1">
        {researchItems.length > 0 ? (
          <div className="pb-1">
            {researchItems.map((item) => {
              const isSelected = selectedItemId === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedItemId(item.id)}
                  className={`flex w-full items-center gap-2 px-4 py-1.5 text-sm transition-colors hover:bg-accent/50 ${
                    isSelected
                      ? "bg-accent/50 border-l-2 border-primary"
                      : "border-l-2 border-transparent"
                  }`}
                >
                  <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate">{item.title}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="px-4 py-8 text-center text-xs text-muted-foreground">
            <p>リサーチがありません</p>
            <p className="mt-1">「+ リサーチ」から追加してください</p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

export function BinderPanel({ projectId }: BinderPanelProps) {
  const { data: researchItems = [] } = useResearchItems(projectId);
  const { data: project } = useProject(projectId);
  const binderTab = useUIStore((s) => s.binderTab);
  const setBinderTab = useUIStore((s) => s.setBinderTab);
  const editor = useUIStore((s) => s.editorInstance);

  const handleAddHeading = () => {
    if (!editor) return;

    // Insert a new H2 section at the end of the document
    const { doc } = editor.state;
    const endPos = doc.content.size;

    editor
      .chain()
      .focus()
      .command(({ tr }) => {
        tr.insert(endPos, [
          editor.schema.nodes.paragraph.create(null, [
            editor.schema.text("\n"),
          ]),
          editor.schema.nodes.heading.create({ level: 2 }, [
            editor.schema.text("新しいセクション"),
          ]),
        ]);
        return true;
      })
      .run();
  };

  return (
    <div className="flex h-full flex-col border-r bg-muted/30">
      {/* Header with project name and action buttons */}
      <div className="flex items-center justify-between border-b px-3 py-2">
        <span className="text-sm font-semibold truncate">{project?.title ?? "バインダー"}</span>
        {binderTab === "manuscript" && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 px-2 text-xs"
            onClick={handleAddHeading}
          >
            <Heading2Icon className="h-3.5 w-3.5" />
            セクション
          </Button>
        )}
      </div>

      {/* Tab switcher */}
      <Tabs
        value={binderTab}
        onValueChange={(v) => setBinderTab(v as "manuscript" | "codex" | "research")}
        className="flex flex-1 flex-col min-h-0 !gap-0"
      >
        <TabsList className="mx-2 my-2 grid w-auto grid-cols-3 shrink-0">
          <TabsTrigger value="manuscript" className="text-xs">
            原稿
          </TabsTrigger>
          <TabsTrigger value="codex" className="text-xs">
            世界観
          </TabsTrigger>
          <TabsTrigger value="research" className="text-xs">
            リサーチ
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 min-h-0 flex flex-col">
          {binderTab === "manuscript" && (
            <OutlinePanel projectId={projectId} editor={editor} />
          )}
          {binderTab === "codex" && (
            <CodexBrowserPanel projectId={projectId} />
          )}
          {binderTab === "research" && (
            <ResearchPanel items={researchItems} projectId={projectId} />
          )}
        </div>
      </Tabs>

    </div>
  );
}
