import { NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { projects, binderItems } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getSession, unauthorized, badRequest } from "@/lib/api-helpers";

export async function GET() {
  const session = await getSession();
  if (!session) return unauthorized();

  const rows = await db
    .select()
    .from(projects)
    .where(eq(projects.userId, session.user!.id))
    .orderBy(desc(projects.updatedAt));

  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return unauthorized();

  const body = await request.json().catch(() => null);
  if (!body?.title?.trim()) return badRequest("title is required");

  const userId = session.user!.id;
  const now = new Date();
  const projectId = crypto.randomUUID();
  const manuscriptId = crypto.randomUUID();
  const firstSceneId = crypto.randomUUID();
  const researchId = crypto.randomUUID();
  const trashId = crypto.randomUUID();

  const settings = {
    labels: [
      { id: "label-1", name: "章", color: "#3b82f6" },
      { id: "label-2", name: "シーン", color: "#10b981" },
      { id: "label-3", name: "アイデア", color: "#f59e0b" },
      { id: "label-4", name: "要修正", color: "#ef4444" },
    ],
    statuses: [
      { id: "status-1", name: "未着手" },
      { id: "status-2", name: "下書き" },
      { id: "status-3", name: "推敲済み" },
      { id: "status-4", name: "完了" },
    ],
  };

  const defaultSceneMeta = { characterIds: [], subplotIds: [] };

  // Transaction: create project + seed binder items
  const [project] = await db.transaction(async (tx) => {
    const [p] = await tx
      .insert(projects)
      .values({
        id: projectId,
        userId,
        title: body.title.trim(),
        author: body.author?.trim() ?? "",
        genre: body.genre?.trim() ?? "",
        targetWordCount: body.targetWordCount ?? 80000,
        settings,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    await tx.insert(binderItems).values([
      {
        id: manuscriptId,
        projectId,
        parentId: null,
        sortOrder: "a0",
        type: "folder",
        title: "原稿",
        synopsis: "",
        content: null,
        notes: "",
        wordCount: 0,
        labelId: null,
        statusId: null,
        includeInCompile: true,
        sceneMeta: defaultSceneMeta,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: firstSceneId,
        projectId,
        parentId: manuscriptId,
        sortOrder: "a0",
        type: "scene",
        title: "無題のシーン",
        synopsis: "",
        content: null,
        notes: "",
        wordCount: 0,
        labelId: null,
        statusId: "status-1",
        includeInCompile: true,
        sceneMeta: defaultSceneMeta,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: researchId,
        projectId,
        parentId: null,
        sortOrder: "a1",
        type: "folder",
        title: "リサーチ",
        synopsis: "",
        content: null,
        notes: "",
        wordCount: 0,
        labelId: null,
        statusId: null,
        includeInCompile: false,
        sceneMeta: defaultSceneMeta,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: trashId,
        projectId,
        parentId: null,
        sortOrder: "z0",
        type: "trash",
        title: "ゴミ箱",
        synopsis: "",
        content: null,
        notes: "",
        wordCount: 0,
        labelId: null,
        statusId: null,
        includeInCompile: false,
        sceneMeta: defaultSceneMeta,
        createdAt: now,
        updatedAt: now,
      },
    ]);

    return [p];
  });

  return NextResponse.json(project, { status: 201 });
}
