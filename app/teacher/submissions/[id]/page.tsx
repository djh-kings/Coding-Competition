import { redirect } from "next/navigation";
import { getTeacherSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { submissions, competitions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { SubmissionDetailClient } from "./SubmissionDetailClient";

export default async function SubmissionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getTeacherSession();
  if (!session) redirect("/teacher/login");

  const { id } = await params;
  const rows = await db.select().from(submissions).where(eq(submissions.id, id)).limit(1);
  if (!rows.length) redirect("/teacher/dashboard");

  const sub = rows[0];
  const comp = await db.select().from(competitions).where(eq(competitions.id, sub.competitionId)).limit(1);

  return (
    <SubmissionDetailClient
      submission={sub}
      testCases={comp[0] ? JSON.parse(comp[0].testCases) : []}
    />
  );
}
