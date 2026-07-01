import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { accessCodes, competitions, submissions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { signToken } from "@/lib/auth";

function norm(s: string) {
  return s.trim().toLowerCase();
}

export async function POST(req: NextRequest) {
  const body = await req.json() as { code?: string; pseudonym?: string };
  const rawCode = (body.code ?? "").trim().toUpperCase();
  const pseudonym = (body.pseudonym ?? "").trim().slice(0, 40);

  if (!rawCode) return NextResponse.json({ error: "Access code required." }, { status: 400 });
  if (!pseudonym) return NextResponse.json({ error: "Please enter your name." }, { status: 400 });

  const rows = await db
    .select({ ac: accessCodes, comp: competitions })
    .from(accessCodes)
    .innerJoin(competitions, eq(accessCodes.competitionId, competitions.id))
    .where(eq(accessCodes.code, rawCode))
    .limit(1);

  if (!rows.length) {
    return NextResponse.json({ error: "Code not recognised. Check with your teacher." }, { status: 404 });
  }

  const { ac, comp } = rows[0];

  // Adopt an existing submission's pseudonym if this is a legacy code with no claimed name
  let claimed = ac.claimedPseudonym;
  if (!claimed) {
    const priorSub = await db.select().from(submissions).where(eq(submissions.accessCodeId, ac.id)).limit(1);
    if (priorSub.length && priorSub[0].pseudonym) claimed = priorSub[0].pseudonym;
  }

  if (!claimed) {
    // First login — claim the code with this pseudonym
    await db.update(accessCodes).set({ claimedPseudonym: pseudonym, usedAt: ac.usedAt ?? new Date().toISOString() }).where(eq(accessCodes.id, ac.id));
    claimed = pseudonym;
  } else if (norm(claimed) !== norm(pseudonym)) {
    return NextResponse.json({ error: "That name doesn't match this access code." }, { status: 401 });
  }

  // Allow login even if competition inactive/expired — student can still see their entry via /student/me.
  // The workspace itself will still block submission after deadline.

  const token = await signToken({
    sub: ac.id,
    competitionId: comp.id,
    studentName: claimed,
  });

  const res = NextResponse.json({ studentName: claimed, competitionId: comp.id });
  res.cookies.set("student_token", token, { httpOnly: true, path: "/", maxAge: 60 * 60 * 24 * 30 });
  return res;
}
