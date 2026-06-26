import { redirect } from "next/navigation";
import Link from "next/link";
import { getTeacherSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { submissions, competitions, accessCodes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Logo } from "@/components/Logo";

export default async function DashboardPage() {
  const session = await getTeacherSession();
  if (!session) redirect("/teacher/login");

  const comp = await db.select().from(competitions).where(eq(competitions.active, true)).limit(1);
  const activeComp = comp[0] ?? null;

  const rows = activeComp
    ? await db.select().from(submissions).where(eq(submissions.competitionId, activeComp.id)).orderBy(submissions.submittedAt)
    : [];

  const codes = activeComp
    ? await db.select().from(accessCodes).where(eq(accessCodes.competitionId, activeComp.id))
    : [];

  const shortlisted = rows.filter(r => r.shortlisted);
  const winner = rows.find(r => r.winner);

  return (
    <div style={{ minHeight: "100vh", background: "#f7f8fa" }}>
      {/* Nav */}
      <nav style={{ background: "#fff", padding: "0 24px", borderBottom: "1px solid #e2e6ed", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Logo />
          <span style={{ fontSize: 15, fontWeight: 600, color: "#162233" }}>{activeComp?.name ?? "KCS Code Challenge"}</span>
          {activeComp && (
            <span style={{ fontSize: 11, fontWeight: 500, color: "#16a34a", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "2px 8px" }}>Active</span>
          )}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Link href="/teacher/competitions/new" style={{ background: "#fff", border: "1px solid #d1d5db", color: "#475569", fontSize: 13, padding: "8px 16px", borderRadius: 4, textDecoration: "none" }}>
            + New competition
          </Link>
          <form action="/api/teacher/logout" method="POST">
            <button style={{ background: "#fff", border: "1px solid #d1d5db", color: "#475569", fontSize: 13, padding: "8px 16px", borderRadius: 4, cursor: "pointer" }}>
              Sign out
            </button>
          </form>
        </div>
      </nav>

      {/* Stats strip */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e2e6ed", display: "grid", gridTemplateColumns: "1fr 1fr 1fr" }}>
        {[
          { label: "Submissions", value: rows.length },
          { label: "Shortlisted", value: shortlisted.length },
          { label: "Deadline", value: activeComp ? new Date(activeComp.deadline).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—", small: true },
        ].map((s, i) => (
          <div key={s.label} style={{ padding: "18px 24px", borderRight: i < 2 ? "1px solid #e2e6ed" : undefined }}>
            <div style={{ fontSize: 10, textTransform: "uppercase", color: "#94a3b8", letterSpacing: "0.08em", marginBottom: 7 }}>{s.label}</div>
            <div style={{ fontSize: s.small ? 14 : 22, fontWeight: 600, color: "#162233" }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: "#fff", margin: "24px", borderRadius: 4, border: "1px solid #e2e6ed", boxShadow: "0 1px 4px rgba(0,0,0,.08)" }}>
        {/* Table header */}
        <div style={{ background: "#f7f8fa", padding: "10px 24px", borderBottom: "1px solid #e2e6ed", display: "grid", gridTemplateColumns: "2fr 1.4fr 1.6fr 110px 90px" }}>
          {["Student", "Submitted", "Code", "Shortlisted", "Winner"].map(h => (
            <span key={h} style={{ fontSize: 10, fontWeight: 500, textTransform: "uppercase", color: "#94a3b8", letterSpacing: "0.07em" }}>{h}</span>
          ))}
        </div>

        {rows.length === 0 ? (
          <div style={{ padding: "32px 24px", textAlign: "center", color: "#94a3b8", fontSize: 13 }}>No submissions yet.</div>
        ) : (
          rows.map(row => (
            <Link key={row.id} href={`/teacher/submissions/${row.id}`} style={{
              display: "grid",
              gridTemplateColumns: "2fr 1.4fr 1.6fr 110px 90px",
              padding: "13px 24px",
              borderBottom: "1px solid #f0f2f5",
              textDecoration: "none",
              background: row.shortlisted ? "#fffbeb" : "#fff",
              cursor: "pointer",
            }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: "#162233" }}>{row.studentName ?? "Student"}</span>
              <span style={{ fontSize: 13, color: "#64748b" }}>{new Date(row.submittedAt ?? "").toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" })}</span>
              <span style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "#64748b" }}>{row.confirmationCode}</span>
              <span style={{ fontSize: 13, fontWeight: row.shortlisted ? 500 : 400, color: row.shortlisted ? "#b45309" : "#94a3b8" }}>
                {row.shortlisted ? "★ Yes" : "No"}
              </span>
              <span style={{ fontSize: 13, color: "#94a3b8" }}>{row.winner ? "🏆 Yes" : "—"}</span>
            </Link>
          ))
        )}
      </div>

      {/* Access codes */}
      {codes.length > 0 && (
        <div style={{ margin: "0 24px 24px", background: "#fff", borderRadius: 4, border: "1px solid #e2e6ed", boxShadow: "0 1px 4px rgba(0,0,0,.08)", padding: "20px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <span style={{ fontSize: 12, fontWeight: 500, textTransform: "uppercase", color: "#94a3b8", letterSpacing: "0.07em" }}>
              Access Codes — {codes.filter(c => !c.usedAt).length} unused / {codes.length} total
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: 8 }}>
            {codes.map(c => (
              <div key={c.id} style={{
                padding: "7px 10px", borderRadius: 3, textAlign: "center",
                background: c.usedAt ? "#f0fdf4" : "#f7f8fa",
                border: `1px solid ${c.usedAt ? "#bbf7d0" : "#e2e6ed"}`,
                fontFamily: "var(--font-mono)", fontSize: 13, color: c.usedAt ? "#15803d" : "#162233",
              }}>
                {c.code}
                {c.usedAt && <div style={{ fontSize: 10, color: "#16a34a", marginTop: 2 }}>used</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {winner && (
        <div style={{ margin: "0 24px 24px", padding: "16px 20px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 4, fontSize: 13, color: "#15803d" }}>
          🏆 Winner: <strong>{winner.studentName}</strong> ({winner.confirmationCode})
        </div>
      )}
    </div>
  );
}
