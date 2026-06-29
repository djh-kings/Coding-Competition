import { redirect } from "next/navigation";
import Link from "next/link";
import { getTeacherSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { submissions, competitions, accessCodes } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { Logo } from "@/components/Logo";
import { GenerateCodesForm } from "./GenerateCodesForm";

export const dynamic = "force-dynamic";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ comp?: string }> }) {
  const session = await getTeacherSession();
  if (!session) redirect("/teacher/login");

  const { comp: selectedCompId } = await searchParams;

  const allComps = await db.select().from(competitions).orderBy(desc(competitions.createdAt));
  const activeComp = allComps.find(c => c.active) ?? null;
  const selectedComp = selectedCompId
    ? allComps.find(c => c.id === selectedCompId) ?? activeComp
    : activeComp;

  const rows = selectedComp
    ? await db.select().from(submissions).where(eq(submissions.competitionId, selectedComp.id)).orderBy(desc(submissions.submittedAt))
    : [];

  const codes = selectedComp
    ? await db.select().from(accessCodes).where(eq(accessCodes.competitionId, selectedComp.id))
    : [];

  const shortlisted = rows.filter(r => r.shortlisted);
  const winner = rows.find(r => r.winner);

  return (
    <div style={{ minHeight: "100vh", background: "#f7f8fa" }}>
      {/* Nav with breadcrumb */}
      <nav style={{ background: "#fff", padding: "14px 24px", borderBottom: "1px solid #e2e6ed", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Logo />
          <Link href="/teacher/admin" style={{ fontSize: 13, color: "#64748b", textDecoration: "none" }}>Competitions</Link>
          <span style={{ color: "#cbd5e1", fontSize: 12 }}>/</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: "#162233" }}>{selectedComp?.name ?? "Select a competition"}</span>
          {selectedComp && (
            <span style={{ fontSize: 10, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em", color: selectedComp.active ? "#16a34a" : "#dc2626", background: selectedComp.active ? "#f0fdf4" : "#fef2f2", border: `1px solid ${selectedComp.active ? "#bbf7d0" : "#fecaca"}`, borderRadius: 10, padding: "2px 8px" }}>
              {selectedComp.active ? "Active" : "Closed"}
            </span>
          )}
          {winner && (
            <span style={{ fontSize: 10, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em", color: "#b45309", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, padding: "2px 8px" }}>
              ★ Winner
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {/* Competition switcher (kept for quick-switching) */}
          {allComps.length > 1 && (
            <form method="GET" action="/teacher/dashboard" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <select name="comp" defaultValue={selectedComp?.id ?? ""} style={{ fontSize: 12, color: "#475569", border: "1px solid #d1d5db", borderRadius: 4, padding: "5px 8px", background: "#fff" }}>
                {allComps.map(c => (
                  <option key={c.id} value={c.id}>{c.name}{c.active ? "" : " (closed)"}</option>
                ))}
              </select>
              <button type="submit" style={{ background: "#fff", border: "1px solid #d1d5db", color: "#475569", fontSize: 12, padding: "5px 10px", borderRadius: 4, cursor: "pointer" }}>Switch</button>
            </form>
          )}
          <form action="/api/teacher/logout" method="POST">
            <button style={{ background: "#fff", border: "1px solid #d1d5db", color: "#475569", fontSize: 13, padding: "7px 14px", borderRadius: 4, cursor: "pointer" }}>Sign out</button>
          </form>
        </div>
      </nav>

      {/* Section tabs */}
      <div style={{ background: "#fff", padding: "0 24px", borderBottom: "1px solid #e2e6ed", display: "flex", gap: 24 }}>
        {[
          { key: "submissions", label: "Submissions", active: true },
          { key: "codes", label: "Access codes", active: false },
        ].map(t => (
          <span key={t.key} style={{
            fontSize: 13,
            fontWeight: t.active ? 500 : 400,
            color: t.active ? "#2558d4" : "#64748b",
            padding: "12px 0",
            borderBottom: `2px solid ${t.active ? "#2558d4" : "transparent"}`,
            marginBottom: -1,
          }}>
            {t.label}
          </span>
        ))}
      </div>

      {/* Stats strip */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e2e6ed", display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr" }}>
        {[
          { label: "Submissions", value: `${rows.length}`, suffix: ` / ${codes.length}` },
          { label: "Shortlisted", value: `${shortlisted.length}` },
          { label: "Winner", value: winner ? (winner.pseudonym ?? winner.studentName ?? "—") : "Not yet declared", small: true },
          { label: selectedComp?.active ? "Closes" : "Closed", value: selectedComp ? new Date(selectedComp.deadline).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—", small: true },
        ].map((s, i) => (
          <div key={s.label} style={{ padding: "18px 24px", borderRight: i < 3 ? "1px solid #e2e6ed" : undefined }}>
            <div style={{ fontSize: 10, textTransform: "uppercase", color: "#94a3b8", letterSpacing: "0.08em", marginBottom: 7 }}>{s.label}</div>
            <div style={{ fontSize: s.small ? 14 : 20, fontWeight: 600, color: "#162233" }}>
              {s.value}
              {s.suffix && <span style={{ fontSize: 12, fontWeight: 400, color: "#94a3b8" }}>{s.suffix}</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Submissions table */}
      <div style={{ background: "#fff", margin: "24px", borderRadius: 4, border: "1px solid #e2e6ed", boxShadow: "0 1px 4px rgba(0,0,0,.08)" }}>
        <div style={{ background: "#f7f8fa", padding: "10px 24px", borderBottom: "1px solid #e2e6ed", display: "grid", gridTemplateColumns: "2fr 1.4fr 1.6fr 110px 90px" }}>
          {["Student", "Submitted", "Confirmation code", "Shortlisted", "Winner"].map(h => (
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
              background: row.winner ? "#f0fdf4" : row.shortlisted ? "#fffbeb" : "#fff",
            }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: "#162233" }}>
                {row.pseudonym ? `${row.pseudonym} (${row.studentName ?? "—"})` : (row.studentName ?? "—")}
              </span>
              <span style={{ fontSize: 13, color: "#64748b" }}>{new Date(row.submittedAt ?? "").toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" })}</span>
              <span style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "#64748b" }}>{row.confirmationCode}</span>
              <span style={{ fontSize: 13, fontWeight: row.shortlisted ? 500 : 400, color: row.shortlisted ? "#b45309" : "#94a3b8" }}>
                {row.shortlisted ? "★ Yes" : "No"}
              </span>
              <span style={{ fontSize: 13, color: row.winner ? "#16a34a" : "#94a3b8", fontWeight: row.winner ? 600 : 400 }}>{row.winner ? "🏆 Yes" : "—"}</span>
            </Link>
          ))
        )}
      </div>

      {/* Access codes */}
      {selectedComp && (
        <div style={{ margin: "0 24px 24px", background: "#fff", borderRadius: 4, border: "1px solid #e2e6ed", boxShadow: "0 1px 4px rgba(0,0,0,.08)", padding: "20px 24px" }}>
          <div style={{ marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, fontWeight: 500, textTransform: "uppercase", color: "#94a3b8", letterSpacing: "0.07em" }}>
              Access Codes — {codes.filter(c => !c.usedAt).length} unused / {codes.length} total
            </span>
            <GenerateCodesForm competitionId={selectedComp.id} prefix={(() => {
              // Infer prefix from existing codes: take chars before the first "-" if all codes agree
              const prefixes = new Set(codes.map(c => c.code.includes("-") ? c.code.split("-")[0] : ""));
              return prefixes.size === 1 ? [...prefixes][0] || undefined : undefined;
            })()} />
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
                {c.usedAt && <div style={{ fontSize: 10, color: "#16a34a", marginTop: 2 }}>{c.studentName ?? "used"}</div>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
