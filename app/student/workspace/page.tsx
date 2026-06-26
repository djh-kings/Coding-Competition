import { redirect } from "next/navigation";
import { getStudentSession } from "@/lib/auth";
import { WorkspaceClient } from "./WorkspaceClient";

export default async function WorkspacePage() {
  const session = await getStudentSession();
  if (!session) redirect("/student/login");
  return <WorkspaceClient />;
}
