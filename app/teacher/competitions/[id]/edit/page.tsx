import { redirect, notFound } from "next/navigation";
import { getTeacherSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { competitions, submissions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { EditCompetitionClient } from "./EditCompetitionClient";

export const dynamic = "force-dynamic";

export default async function EditCompetitionPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getTeacherSession();
  if (!session) redirect("/teacher/login");

  const { id } = await params;
  const rows = await db.select().from(competitions).where(eq(competitions.id, id)).limit(1);
  if (!rows.length) notFound();
  const comp = rows[0];
  const subs = await db.select().from(submissions).where(eq(submissions.competitionId, id));

  return (
    <EditCompetitionClient
      id={comp.id}
      name={comp.name}
      description={comp.description ?? ""}
      deadline={comp.deadline}
      problemHtml={comp.problemHtml}
      submissionCount={subs.length}
    />
  );
}
