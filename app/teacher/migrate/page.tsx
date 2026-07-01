import { redirect } from "next/navigation";
import { getTeacherSession } from "@/lib/auth";
import { MigrateButton } from "../admin/MigrateButton";
import { Logo } from "@/components/Logo";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function MigratePage() {
  const session = await getTeacherSession();
  if (!session) redirect("/teacher/login");

  return (
    <div style={{ minHeight: "100vh", background: "#f7f8fa" }}>
      <nav style={{ background: "#fff", padding: "0 24px", borderBottom: "1px solid #e2e6ed", display: "flex", alignItems: "center", gap: 10, height: 60 }}>
        <Logo />
        <span style={{ fontSize: 15, fontWeight: 600, color: "#162233" }}>Database migrations</span>
      </nav>
      <div style={{ maxWidth: 560, margin: "48px auto", padding: 24, background: "#fff", border: "1px solid #e2e6ed", borderRadius: 6 }}>
        <h1 style={{ fontSize: 18, fontWeight: 600, color: "#162233", marginBottom: 10 }}>Apply pending migrations</h1>
        <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6, marginBottom: 20 }}>
          Adds any missing columns to your Turso database. Safe to run multiple times — already-applied columns are skipped.
        </p>
        <MigrateButton />
        <div style={{ marginTop: 24, borderTop: "1px solid #e2e6ed", paddingTop: 16 }}>
          <Link href="/teacher/admin" style={{ fontSize: 13, color: "#2558d4", textDecoration: "none" }}>← Back to admin</Link>
        </div>
      </div>
    </div>
  );
}
