import { NextRequest, NextResponse } from "next/server";
import { getTeacherSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { competitions, submissions, accessCodes } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getTeacherSession();
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { id } = await params;
  const body = await req.json() as {
    name?: string;
    description?: string | null;
    deadline?: string;
    problemHtml?: string;
  };

  const patch: Record<string, unknown> = {};
  if (typeof body.name === "string" && body.name.trim()) patch.name = body.name.trim();
  if ("description" in body) patch.description = body.description?.toString().trim().slice(0, 240) || null;
  if (typeof body.deadline === "string" && body.deadline) patch.deadline = body.deadline;
  if (typeof body.problemHtml === "string") patch.problemHtml = body.problemHtml;

  if (Object.keys(patch).length === 0) return NextResponse.json({ error: "Nothing to update" }, { status: 400 });

  await db.update(competitions).set(patch).where(eq(competitions.id, id));
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getTeacherSession();
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { id } = await params;

  // Remove child rows first (no ON DELETE CASCADE in schema)
  await db.delete(submissions).where(eq(submissions.competitionId, id));
  await db.delete(accessCodes).where(eq(accessCodes.competitionId, id));
  await db.delete(competitions).where(eq(competitions.id, id));

  return NextResponse.json({ ok: true });
}
