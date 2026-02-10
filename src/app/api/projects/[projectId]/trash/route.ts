import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { sectionTrash } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getSession, unauthorized, badRequest } from "@/lib/api-helpers";
import { verifyProjectOwnership } from "@/lib/api-helpers";

type Params = { params: Promise<{ projectId: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return unauthorized();

  const { projectId } = await params;
  const isOwner = await verifyProjectOwnership(projectId, session.user!.id);
  if (!isOwner) return unauthorized();

  const items = await db
    .select()
    .from(sectionTrash)
    .where(eq(sectionTrash.projectId, projectId))
    .orderBy(desc(sectionTrash.deletedAt));

  return NextResponse.json(items);
}

export async function POST(request: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return unauthorized();

  const { projectId } = await params;
  const isOwner = await verifyProjectOwnership(projectId, session.user!.id);
  if (!isOwner) return unauthorized();

  const body = await request.json().catch(() => null);
  if (!body?.title || !body?.level || !body?.content) {
    return badRequest("title, level, and content are required");
  }

  const [item] = await db
    .insert(sectionTrash)
    .values({
      projectId,
      title: body.title,
      level: body.level,
      content: body.content,
    })
    .returning();

  return NextResponse.json(item, { status: 201 });
}
