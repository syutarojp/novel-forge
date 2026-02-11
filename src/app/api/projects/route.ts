import { NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { projects } from "@/db/schema";
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

  // Initial content: H1 = project title, H2 = first scene
  const initialContent = {
    type: "doc",
    content: [
      {
        type: "heading",
        attrs: { level: 1 },
        content: [{ type: "text", text: body.title.trim() }],
      },
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: "第一章" }],
      },
      {
        type: "paragraph",
        content: [],
      },
    ],
  };

  const [project] = await db
    .insert(projects)
    .values({
      id: projectId,
      userId,
      title: body.title.trim(),
      author: body.author?.trim() ?? "",
      genre: body.genre?.trim() ?? "",
      targetWordCount: body.targetWordCount ?? 80000,
      content: initialContent,
      wordCount: 0,
      settings,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return NextResponse.json(project, { status: 201 });
}
