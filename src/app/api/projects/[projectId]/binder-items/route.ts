import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { binderItems } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession, unauthorized, badRequest } from "@/lib/api-helpers";
import { verifyProjectOwnership } from "@/lib/api-helpers";

type Params = { params: Promise<{ projectId: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return unauthorized();

  const { projectId } = await params;
  if (!(await verifyProjectOwnership(projectId, session.user!.id)))
    return unauthorized();

  const rows = await db
    .select()
    .from(binderItems)
    .where(eq(binderItems.projectId, projectId));

  return NextResponse.json(rows);
}

export async function POST(request: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return unauthorized();

  const { projectId } = await params;
  if (!(await verifyProjectOwnership(projectId, session.user!.id)))
    return unauthorized();

  const body = await request.json().catch(() => null);
  if (!body) return badRequest("Invalid body");

  const now = new Date();
  const [item] = await db
    .insert(binderItems)
    .values({
      id: crypto.randomUUID(),
      projectId,
      parentId: body.parentId ?? null,
      sortOrder: body.sortOrder ?? "a0",
      type: body.type ?? "scene",
      title: body.title ?? "",
      synopsis: body.synopsis ?? "",
      content: body.content ?? null,
      notes: body.notes ?? "",
      wordCount: body.wordCount ?? 0,
      labelId: body.labelId ?? null,
      statusId: body.statusId ?? null,
      includeInCompile: body.includeInCompile ?? true,
      sceneMeta: body.sceneMeta ?? { characterIds: [], subplotIds: [] },
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return NextResponse.json(item, { status: 201 });
}
