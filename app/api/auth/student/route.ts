import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { accessCodes, competitions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { signToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { code } = await req.json();

  if (!code || typeof code !== "string") {
    return NextResponse.json({ error: "Code required" }, { status: 400 });
  }

  const rows = await db
    .select({ ac: accessCodes, comp: competitions })
    .from(accessCodes)
    .innerJoin(competitions, eq(accessCodes.competitionId, competitions.id))
    .where(eq(accessCodes.code, code.trim().toUpperCase()))
    .limit(1);

  if (!rows.length) {
    return NextResponse.json({ error: "Code not recognised. Check with your teacher." }, { status: 404 });
  }

  const { ac, comp } = rows[0];

  if (!comp.active) {
    return NextResponse.json({ error: "This competition is not currently active." }, { status: 403 });
  }

  if (new Date(comp.deadline) < new Date()) {
    return NextResponse.json({ error: "This competition has ended." }, { status: 403 });
  }

  const token = await signToken({
    sub: ac.id,
    competitionId: comp.id,
    studentName: ac.studentName ?? "Student",
  });

  const res = NextResponse.json({
    studentName: ac.studentName ?? "Student",
    competitionId: comp.id,
  });

  res.cookies.set("student_token", token, {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  return res;
}
