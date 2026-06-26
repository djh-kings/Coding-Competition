import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { teachers } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { signToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json() as { username: string; password: string };

  const rows = await db.select().from(teachers).where(eq(teachers.username, username)).limit(1);
  if (!rows.length) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, rows[0].passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = await signToken({ sub: rows[0].id, username: rows[0].username, role: "teacher" });
  const res = NextResponse.json({ ok: true });
  res.cookies.set("teacher_token", token, { httpOnly: true, path: "/", maxAge: 60 * 60 * 8 });
  return res;
}
