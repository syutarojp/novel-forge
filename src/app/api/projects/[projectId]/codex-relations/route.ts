import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { codexRelations } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getSession, unauthorized, badRequest, notFound } from "@/lib/api-helpers";
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
    .from(codexRelations)
    .where(eq(codexRelations.projectId, projectId));

  return NextResponse.json(rows);
}

export async function POST(request: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return unauthorized();

  const { projectId } = await params;
  if (!(await verifyProjectOwnership(projectId, session.user!.id)))
    return unauthorized();

  const body = await request.json().catch(() => null);
  if (!body?.sourceId || !body?.targetId)
    return badRequest("sourceId and targetId are required");

  const [relation] = await db
    .insert(codexRelations)
    .values({
      id: crypto.randomUUID(),
      projectId,
      sourceId: body.sourceId,
      targetId: body.targetId,
      label: body.label ?? "",
    })
    .returning();

  return NextResponse.json(relation, { status: 201 });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return unauthorized();

  const { projectId } = await params;
  if (!(await verifyProjectOwnership(projectId, session.user!.id)))
    return unauthorized();

  const url = new URL(request.url);
  const relationId = url.searchParams.get("id");
  if (!relationId) return badRequest("id query parameter is required");

  const [deleted] = await db
    .delete(codexRelations)
    .where(
      and(
        eq(codexRelations.id, relationId),
        eq(codexRelations.projectId, projectId)
      )
    )
    .returning({ id: codexRelations.id });

  if (!deleted) return notFound();
  return new NextResponse(null, { status: 204 });
}
