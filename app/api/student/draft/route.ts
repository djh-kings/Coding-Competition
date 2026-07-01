import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { accessCodes, submissions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getStudentSession } from "@/lib/auth";

export async function GET() {
  const session = await getStudentSession();
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const ac = await db.select().from(accessCodes).where(eq(accessCodes.id, session.sub)).limit(1);
  if (!ac.length) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // If already submitted, return the submitted code (read-only marker via submitted flag)
  const sub = await db.select().from(submissions).where(eq(submissions.accessCodeId, session.sub)).limit(1);
  if (sub.length) {
    return NextResponse.json({
      code: sub[0].code,
      language: sub[0].language,
      submitted: true,
      confirmationCode: sub[0].confirmationCode,
    });
  }

  return NextResponse.json({
    code: ac[0].draftCode ?? "",
    language: ac[0].draftLanguage ?? "python",
    submitted: false,
  });
}

export async function POST(req: NextRequest) {
  const session = await getStudentSession();
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  // Don't allow overwriting a submitted entry
  const sub = await db.select().from(submissions).where(eq(submissions.accessCodeId, session.sub)).limit(1);
  if (sub.length) return NextResponse.json({ error: "Already submitted" }, { status: 409 });

  const { code, language } = await req.json() as { code: string; language: string };
  await db.update(accessCodes).set({ draftCode: code ?? "", draftLanguage: language ?? "python" }).where(eq(accessCodes.id, session.sub));
  return NextResponse.json({ ok: true });
}
