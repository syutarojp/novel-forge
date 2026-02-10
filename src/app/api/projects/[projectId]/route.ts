import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import {
  projects,
  binderItems,
  codexEntries,
  codexRelations,
  snapshots,
  collections,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getSession, unauthorized, notFound } from "@/lib/api-helpers";

type Params = { params: Promise<{ projectId: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return unauthorized();

  const { projectId } = await params;
  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, session.user!.id)));

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
    .set({ ...body, updatedAt: new Date() })
    .where(and(eq(projects.id, projectId), eq(projects.userId, session.user!.id)))
    .returning();

  if (!updated) return notFound();
  return NextResponse.json(updated);
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return unauthorized();

  const { projectId } = await params;

  // CASCADE will handle child records, but delete explicitly for safety
  const [deleted] = await db
    .delete(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, session.user!.id)))
    .returning({ id: projects.id });

  if (!deleted) return notFound();
  return new NextResponse(null, { status: 204 });
}
