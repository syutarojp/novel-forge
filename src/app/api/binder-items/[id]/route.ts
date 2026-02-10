import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { binderItems, projects } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getSession, unauthorized, notFound } from "@/lib/api-helpers";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return unauthorized();

  const { id } = await params;

  // Find the item and verify ownership through the project
  const [item] = await db
    .select()
    .from(binderItems)
    .where(eq(binderItems.id, id));

  if (!item) return notFound();

  // Verify the user owns the project
  const [project] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, item.projectId), eq(projects.userId, session.user!.id)));

  if (!project) return notFound();

  return NextResponse.json(item);
}
