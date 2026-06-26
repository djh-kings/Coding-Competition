import { NextRequest, NextResponse } from "next/server";
import { getTeacherSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { competitions } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getTeacherSession();
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { id } = await params;
  await db.update(competitions).set({ active: false }).where(eq(competitions.id, id));

  return NextResponse.redirect(new URL("/teacher/admin", _req.url));
}
