import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { competitions, accessCodes } from "@/db/schema";
import { getTeacherSession } from "@/lib/auth";
import { randomUUID } from "crypto";

interface TestCase { input: string; expected: string; }

function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function POST(req: NextRequest) {
  const session = await getTeacherSession();
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const body = await req.json() as {
    name: string;
    deadline: string;
    problemHtml: string;
    testCases: TestCase[];
    codeCount: number;
  };

  if (!body.name || !body.deadline || !body.problemHtml) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const competitionId = randomUUID();
  await db.insert(competitions).values({
    id: competitionId,
    name: body.name,
    deadline: body.deadline,
    problemHtml: body.problemHtml,
    testCases: JSON.stringify(body.testCases ?? []),
    active: true,
    teacherId: session.sub,
  });

  const codes: string[] = [];
  const count = Math.min(Math.max(body.codeCount ?? 10, 1), 200);
  const seen = new Set<string>();
  while (codes.length < count) {
    const code = generateCode();
    if (seen.has(code)) continue;
    seen.add(code);
    try {
      await db.insert(accessCodes).values({
        id: randomUUID(),
        code,
        competitionId,
      });
      codes.push(code);
    } catch {
      // collision with existing code in DB — try again
    }
  }

  return NextResponse.json({ id: competitionId, codes });
}
