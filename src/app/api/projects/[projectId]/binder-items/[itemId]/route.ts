import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { binderItems } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getSession, unauthorized, notFound } from "@/lib/api-helpers";
import { verifyProjectOwnership } from "@/lib/api-helpers";

type Params = { params: Promise<{ projectId: string; itemId: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return unauthorized();

  const { projectId, itemId } = await params;
  if (!(await verifyProjectOwnership(projectId, session.user!.id)))
    return unauthorized();

  const [item] = await db
    .select()
    .from(binderItems)
    .where(and(eq(binderItems.id, itemId), eq(binderItems.projectId, projectId)));

  if (!item) return notFound();
  return NextResponse.json(item);
}

export async function PUT(request: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return unauthorized();

  const { projectId, itemId } = await params;
  if (!(await verifyProjectOwnership(projectId, session.user!.id)))
    return unauthorized();

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const [updated] = await db
    .update(binderItems)
    .set({ ...body, updatedAt: new Date() })
    .where(and(eq(binderItems.id, itemId), eq(binderItems.projectId, projectId)))
    .returning();

  if (!updated) return notFound();
  return NextResponse.json(updated);
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return unauthorized();

  const { projectId, itemId } = await params;
  if (!(await verifyProjectOwnership(projectId, session.user!.id)))
    return unauthorized();

  // Recursively collect all descendant IDs
  const allItems = await db
    .select({ id: binderItems.id, parentId: binderItems.parentId })
    .from(binderItems)
    .where(eq(binderItems.projectId, projectId));

  const idsToDelete = new Set<string>([itemId]);
  let added = true;
  while (added) {
    added = false;
    for (const item of allItems) {
      if (item.parentId && idsToDelete.has(item.parentId) && !idsToDelete.has(item.id)) {
        idsToDelete.add(item.id);
        added = true;
      }
    }
  }

  // Delete all collected items
  for (const id of idsToDelete) {
    await db.delete(binderItems).where(eq(binderItems.id, id));
  }

  return new NextResponse(null, { status: 204 });
}
