import { NextRequest, NextResponse } from "next/server";
import { getTeacherSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { accessCodes } from "@/db/schema";
import { randomUUID } from "crypto";

function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getTeacherSession();
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { id: competitionId } = await params;
  const { count } = await req.json() as { count: number };
  const n = Math.min(Math.max(Math.floor(count ?? 0), 1), 200);

  const created: string[] = [];
  const seen = new Set<string>();
  let attempts = 0;
  while (created.length < n && attempts < n * 10) {
    attempts++;
    const code = generateCode();
    if (seen.has(code)) continue;
    seen.add(code);
    try {
      await db.insert(accessCodes).values({ id: randomUUID(), code, competitionId });
      created.push(code);
    } catch {
      // collision — retry
    }
  }

  return NextResponse.json({ codes: created });
}
