import { NextResponse } from "next/server";
import { getTeacherSession } from "@/lib/auth";
import { createClient } from "@libsql/client";

export async function POST() {
  const session = await getTeacherSession();
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const client = createClient({
    url: process.env.DATABASE_URL ?? "file:./dev.db",
    authToken: process.env.DATABASE_AUTH_TOKEN,
  });

  const statements = [
    "ALTER TABLE submissions ADD COLUMN pseudonym TEXT",
    "ALTER TABLE competitions ADD COLUMN description TEXT",
    "ALTER TABLE competitions ADD COLUMN listed INTEGER DEFAULT 1",
    "ALTER TABLE access_codes ADD COLUMN claimed_pseudonym TEXT",
    "ALTER TABLE access_codes ADD COLUMN draft_code TEXT",
    "ALTER TABLE access_codes ADD COLUMN draft_language TEXT",
  ];

  const applied: string[] = [];
  const skipped: string[] = [];
  for (const sql of statements) {
    try {
      await client.execute(sql);
      applied.push(sql);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      // duplicate column errors are expected on already-migrated DBs
      skipped.push(`${sql}  — ${msg}`);
    }
  }

  return NextResponse.json({ applied, skipped });
}
