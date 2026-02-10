import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { codexEntries } from "@/db/schema";
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
    .from(codexEntries)
    .where(eq(codexEntries.projectId, projectId));

  return NextResponse.json(rows);
}

export async function POST(request: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return unauthorized();

  const { projectId } = await params;
  if (!(await verifyProjectOwnership(projectId, session.user!.id)))
    return unauthorized();

  const body = await request.json().catch(() => null);
  if (!body?.type) return badRequest("type is required");

  const now = new Date();
  const [entry] = await db
    .insert(codexEntries)
    .values({
      id: crypto.randomUUID(),
      projectId,
      type: body.type,
      name: body.name ?? "無題のエントリ",
      aliases: body.aliases ?? [],
      description: body.description ?? null,
      notes: body.notes ?? "",
      thumbnail: body.thumbnail ?? null,
      tags: body.tags ?? [],
      fieldValues: body.fieldValues ?? {},
      color: body.color ?? null,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return NextResponse.json(entry, { status: 201 });
}
