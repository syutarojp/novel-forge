import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db/drizzle";
import { projects } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function getSession() {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }
  return session;
}

export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function notFound() {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function verifyProjectOwnership(
  projectId: string,
  userId: string
): Promise<boolean> {
  const [project] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)));
  return !!project;
}
