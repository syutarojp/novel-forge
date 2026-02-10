import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { sectionTrash } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getSession, unauthorized, notFound } from "@/lib/api-helpers";
import { verifyProjectOwnership } from "@/lib/api-helpers";

type Params = { params: Promise<{ projectId: string; trashId: string }> };

// POST /api/projects/[projectId]/trash/[trashId] — restore (returns content + deletes record)
export async function POST(_request: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return unauthorized();

  const { projectId, trashId } = await params;
  const isOwner = await verifyProjectOwnership(projectId, session.user!.id);
  if (!isOwner) return unauthorized();

  const [item] = await db
    .select()
    .from(sectionTrash)
    .where(
      and(eq(sectionTrash.id, trashId), eq(sectionTrash.projectId, projectId))
    );

  if (!item) return notFound();

  // Delete the trash record
  await db
    .delete(sectionTrash)
    .where(eq(sectionTrash.id, trashId));

  // Return the content for restoration
  return NextResponse.json({ content: item.content });
}

// DELETE /api/projects/[projectId]/trash/[trashId] — permanent delete
export async function DELETE(_request: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return unauthorized();

  const { projectId, trashId } = await params;
  const isOwner = await verifyProjectOwnership(projectId, session.user!.id);
  if (!isOwner) return unauthorized();

  const [deleted] = await db
    .delete(sectionTrash)
    .where(
      and(eq(sectionTrash.id, trashId), eq(sectionTrash.projectId, projectId))
    )
    .returning({ id: sectionTrash.id });

  if (!deleted) return notFound();

  return new NextResponse(null, { status: 204 });
}
