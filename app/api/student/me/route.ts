import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { accessCodes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getStudentSession } from "@/lib/auth";

export async function GET() {
  const session = await getStudentSession();
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const rows = await db.select().from(accessCodes).where(eq(accessCodes.id, session.sub)).limit(1);
  if (!rows.length) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    pseudonym: rows[0].claimedPseudonym ?? session.studentName ?? "Student",
    code: rows[0].code,
  });
}
