import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { codexEntries, codexRelations } from "@/db/schema";
import { eq, and, or } from "drizzle-orm";
import { getSession, unauthorized, notFound } from "@/lib/api-helpers";
import { verifyProjectOwnership } from "@/lib/api-helpers";

type Params = { params: Promise<{ projectId: string; entryId: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return unauthorized();

  const { projectId, entryId } = await params;
  if (!(await verifyProjectOwnership(projectId, session.user!.id)))
    return unauthorized();

  const [entry] = await db
    .select()
    .from(codexEntries)
    .where(
      and(eq(codexEntries.id, entryId), eq(codexEntries.projectId, projectId))
    );

  if (!entry) return notFound();
  return NextResponse.json(entry);
}

export async function PUT(request: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return unauthorized();

  const { projectId, entryId } = await params;
  if (!(await verifyProjectOwnership(projectId, session.user!.id)))
    return unauthorized();

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const [updated] = await db
    .update(codexEntries)
    .set({ ...body, updatedAt: new Date() })
    .where(
      and(eq(codexEntries.id, entryId), eq(codexEntries.projectId, projectId))
    )
    .returning();

  if (!updated) return notFound();
  return NextResponse.json(updated);
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return unauthorized();

  const { projectId, entryId } = await params;
  if (!(await verifyProjectOwnership(projectId, session.user!.id)))
    return unauthorized();

  // Delete related relations first (CASCADE should handle this, but be explicit)
  await db
    .delete(codexRelations)
    .where(
      and(
        eq(codexRelations.projectId, projectId),
        or(
          eq(codexRelations.sourceId, entryId),
          eq(codexRelations.targetId, entryId)
        )
      )
    );

  const [deleted] = await db
    .delete(codexEntries)
    .where(
      and(eq(codexEntries.id, entryId), eq(codexEntries.projectId, projectId))
    )
    .returning({ id: codexEntries.id });

  if (!deleted) return notFound();
  return new NextResponse(null, { status: 204 });
}
