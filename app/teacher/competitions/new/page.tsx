import { redirect } from "next/navigation";
import { getTeacherSession } from "@/lib/auth";
import { NewCompetitionClient } from "./NewCompetitionClient";

export default async function NewCompetitionPage() {
  const session = await getTeacherSession();
  if (!session) redirect("/teacher/login");
  return <NewCompetitionClient />;
}
