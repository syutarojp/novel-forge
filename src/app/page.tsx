"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useProjects, useCreateProject, useDeleteProject } from "@/hooks/use-projects";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, BookOpen, Trash2, Calendar } from "lucide-react";
import { UserMenu } from "@/components/user-menu";

function getRelativeTime(date: Date | string): string {
  const now = Date.now();
  const diff = now - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "たった今";
  if (minutes < 60) return `${minutes}分前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}時間前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}日前`;
  return new Date(date).toLocaleDateString();
}

export default function HomePage() {
  const router = useRouter();
  const { data: projects = [], isLoading } = useProjects();
  const createProject = useCreateProject();
  const deleteProject = useDeleteProject();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [genre, setGenre] = useState("");
  const [targetWords, setTargetWords] = useState("80000");

  const handleCreate = async () => {
    if (!title.trim()) return;
    const project = await createProject.mutateAsync({
      title: title.trim(),
      author: author.trim(),
      genre: genre.trim(),
      targetWordCount: parseInt(targetWords) || 80000,
    });
    setDialogOpen(false);
    setTitle("");
    setAuthor("");
    setGenre("");
    setTargetWords("80000");
    router.push(`/project/${project.id}`);
  };

  const handleDelete = async (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    if (confirm("このプロジェクトを削除しますか？この操作は元に戻せません。")) {
      await deleteProject.mutateAsync(projectId);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">NovelForge</h1>
            <p className="mt-1 text-muted-foreground">
              プロジェクト一覧
            </p>
          </div>
          <div className="flex items-center gap-2">
            <UserMenu />
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  新規プロジェクト
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>新規プロジェクト作成</DialogTitle>
                  <DialogDescription>
                    新しい執筆プロジェクトを始めましょう。設定は後から変更できます。
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">タイトル *</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="私の小説"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleCreate();
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="author">著者</Label>
                    <Input
                      id="author"
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      placeholder="著者名"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="genre">ジャンル</Label>
                      <Input
                        id="genre"
                        value={genre}
                        onChange={(e) => setGenre(e.target.value)}
                        placeholder="ファンタジー、SF..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="target">目標文字数</Label>
                      <Input
                        id="target"
                        type="number"
                        value={targetWords}
                        onChange={(e) => setTargetWords(e.target.value)}
                        placeholder="80000"
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    キャンセル
                  </Button>
                  <Button onClick={handleCreate} disabled={!title.trim()}>
                    作成
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            プロジェクトを読み込み中...
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <BookOpen className="mb-6 h-20 w-20 text-muted-foreground/20" />
            <h2 className="text-xl font-semibold mb-6">はじめましょう</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl">
              <div className="flex flex-col items-center gap-2 p-4 rounded-lg border bg-card">
                <span className="text-2xl font-bold text-primary">1</span>
                <p className="text-sm font-medium">プロジェクトを作成</p>
                <p className="text-xs text-muted-foreground">上のボタンから新規プロジェクトを作成</p>
              </div>
              <div className="flex flex-col items-center gap-2 p-4 rounded-lg border bg-card">
                <span className="text-2xl font-bold text-primary">2</span>
                <p className="text-sm font-medium">シーンを追加</p>
                <p className="text-xs text-muted-foreground">バインダーでシーンやフォルダを作成</p>
              </div>
              <div className="flex flex-col items-center gap-2 p-4 rounded-lg border bg-card">
                <span className="text-2xl font-bold text-primary">3</span>
                <p className="text-sm font-medium">執筆開始</p>
                <p className="text-xs text-muted-foreground">AI校正で文章をブラッシュアップ</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Card
                key={project.id}
                className="cursor-pointer transition-shadow hover:shadow-md"
                onClick={() => router.push(`/project/${project.id}`)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{project.title}</CardTitle>
                  {project.author && (
                    <CardDescription>{project.author}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {project.genre && (
                      <span className="rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-xs font-medium">
                        {project.genre}
                      </span>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {getRelativeTime(project.updatedAt)}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={(e) => handleDelete(e, project.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
