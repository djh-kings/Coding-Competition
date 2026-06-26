import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { competitions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getStudentSession } from "@/lib/auth";

export async function GET() {
  const session = await getStudentSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const rows = await db
    .select()
    .from(competitions)
    .where(eq(competitions.id, session.competitionId))
    .limit(1);

  if (!rows.length) {
    return NextResponse.json({ error: "Competition not found" }, { status: 404 });
  }

  const comp = rows[0];
  return NextResponse.json({
    id: comp.id,
    name: comp.name,
    deadline: comp.deadline,
    problemHtml: comp.problemHtml,
    testCases: JSON.parse(comp.testCases),
  });
}
