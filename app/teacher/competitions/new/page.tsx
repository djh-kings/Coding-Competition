import { redirect } from "next/navigation";
import { getTeacherSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { competitions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NewCompetitionClient } from "./NewCompetitionClient";

export const dynamic = "force-dynamic";

export default async function NewCompetitionPage({ searchParams }: { searchParams: Promise<{ from?: string }> }) {
  const session = await getTeacherSession();
  if (!session) redirect("/teacher/login");

  const { from } = await searchParams;
  let preset = null;
  if (from) {
    const rows = await db.select().from(competitions).where(eq(competitions.id, from)).limit(1);
    if (rows.length) {
      const c = rows[0];
      preset = {
        name: `${c.name} (copy)`,
        description: c.description ?? "",
        problemHtml: c.problemHtml,
      };
    }
  }

  return <NewCompetitionClient preset={preset} />;
}
