import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { submissions, competitions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getTeacherSession } from "@/lib/auth";

export async function GET() {
  const session = await getTeacherSession();
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const comp = await db.select().from(competitions).where(eq(competitions.active, true)).limit(1);
  if (!comp.length) return NextResponse.json([]);

  const rows = await db
    .select()
    .from(submissions)
    .where(eq(submissions.competitionId, comp[0].id))
    .orderBy(submissions.submittedAt);

  return NextResponse.json(rows);
}
