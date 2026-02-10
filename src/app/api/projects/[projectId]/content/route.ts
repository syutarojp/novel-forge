import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { projects } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getSession, unauthorized, notFound } from "@/lib/api-helpers";

type Params = { params: Promise<{ projectId: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return unauthorized();

  const { projectId } = await params;
  const [project] = await db
    .select({ content: projects.content, wordCount: projects.wordCount })
    .from(projects)
    .where(
      and(eq(projects.id, projectId), eq(projects.userId, session.user!.id))
    );

  if (!project) return notFound();
  return NextResponse.json(project);
}

export async function PUT(request: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return unauthorized();

  const { projectId } = await params;
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const [updated] = await db
    .update(projects)
    .set({
      content: body.content,
      wordCount: body.wordCount ?? 0,
      updatedAt: new Date(),
    })
    .where(
      and(eq(projects.id, projectId), eq(projects.userId, session.user!.id))
    )
    .returning({
      content: projects.content,
      wordCount: projects.wordCount,
    });

  if (!updated) return notFound();
  return NextResponse.json(updated);
}
