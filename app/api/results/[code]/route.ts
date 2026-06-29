import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { submissions, competitions } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const cleaned = code.trim().toUpperCase();
  if (!cleaned) return NextResponse.json({ error: "Code required" }, { status: 400 });

  const rows = await db
    .select({ s: submissions, c: competitions })
    .from(submissions)
    .innerJoin(competitions, eq(submissions.competitionId, competitions.id))
    .where(eq(submissions.confirmationCode, cleaned))
    .limit(1);

  if (!rows.length) {
    return NextResponse.json({ error: "Code not recognised. Check the confirmation code you noted after submitting." }, { status: 404 });
  }

  const { s, c } = rows[0];
  const closed = !c.active || new Date(c.deadline).getTime() <= Date.now();

  return NextResponse.json({
    competitionName: c.name,
    displayName: s.pseudonym ?? s.studentName ?? "Student",
    submittedAt: s.submittedAt,
    closed,
    winner: !!s.winner,
    shortlisted: !!s.shortlisted,
    comment: s.comment ?? null,
  });
}
