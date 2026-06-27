import { NextRequest, NextResponse } from "next/server";
import { getTeacherSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { competitions, submissions, accessCodes } from "@/db/schema";
import { eq } from "drizzle-orm";

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
