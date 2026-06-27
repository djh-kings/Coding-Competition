import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { submissions, accessCodes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getStudentSession } from "@/lib/auth";
import { randomUUID } from "crypto";

function randomCode() {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

export async function POST(req: NextRequest) {
  const session = await getStudentSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const existing = await db
    .select()
    .from(submissions)
    .where(eq(submissions.accessCodeId, session.sub))
    .limit(1);

  if (existing.length) {
    return NextResponse.json({ error: "Already submitted" }, { status: 409 });
  }

  const { code, language, pseudonym } = await req.json() as { code: string; language: string; pseudonym?: string };
  const cleanPseudonym = pseudonym?.trim().slice(0, 40) || null;

  const ac = await db
    .select()
    .from(accessCodes)
    .where(eq(accessCodes.id, session.sub))
    .limit(1);

  const confirmationCode = randomCode();
  const submittedAt = new Date().toISOString();

  await db.insert(submissions).values({
    id: randomUUID(),
    code,
    language,
    confirmationCode,
    accessCodeId: session.sub,
    competitionId: session.competitionId,
    studentName: ac[0]?.studentName ?? "Student",
    pseudonym: cleanPseudonym,
    submittedAt,
  });

  return NextResponse.json({ confirmationCode, submittedAt });
}
