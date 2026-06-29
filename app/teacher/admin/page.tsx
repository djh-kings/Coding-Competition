import { redirect } from "next/navigation";
import Link from "next/link";
import { getTeacherSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { competitions, submissions, accessCodes } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { Logo } from "@/components/Logo";
import { DeleteCompetitionButton } from "./DeleteCompetitionButton";
import { ListedToggleButton } from "./ListedToggleButton";

export const dynamic = "force-dynamic";

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const session = await getTeacherSession();
  if (!session) redirect("/teacher/login");

  const { filter = "all" } = await searchParams;
  const allComps = await db.select().from(competitions).orderBy(desc(competitions.createdAt));
  const filteredComps =
    filter === "active" ? allComps.filter(c => c.active) :
    filter === "closed" ? allComps.filter(c => !c.active) :
    allComps;
  const counts = {
    all: allComps.length,
    active: allComps.filter(c => c.active).length,
    closed: allComps.filter(c => !c.active).length,
  };

  const compStats = await Promise.all(
    filteredComps.map(async (c) => {
      const [subs, codes] = await Promise.all([
        db.select().from(submissions).where(eq(submissions.competitionId, c.id)),
        db.select().from(accessCodes).where(eq(accessCodes.competitionId, c.id)),
      ]);
      const submittedIds = new Set(subs.map(s => s.accessCodeId));
      const winner = subs.find(s => s.winner);
      const shortlisted = subs.filter(s => s.shortlisted);
      const submitted = codes.filter(c => submittedIds.has(c.id));
      const notSubmitted = codes.filter(c => !submittedIds.has(c.id));
      return { ...c, subCount: subs.length, winner, shortlisted, submitted, notSubmitted, totalCodes: codes.length };
    })
  );

  return (
    <div style={{ minHeight: "100vh", background: "#f7f8fa" }}>
      {/* Nav */}
      <nav style={{ background: "#fff", padding: "0 24px", borderBottom: "1px solid #e2e6ed", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Logo />
          <span style={{ fontSize: 15, fontWeight: 600, color: "#162233" }}>Admin</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Link href="/teacher/dashboard" style={{ background: "#fff", border: "1px solid #d1d5db", color: "#475569", fontSize: 13, padding: "8px 16px", borderRadius: 4, textDecoration: "none" }}>
            ← Dashboard
          </Link>
          <form action="/api/teacher/logout" method="POST">
            <button style={{ background: "#fff", border: "1px solid #d1d5db", color: "#475569", fontSize: 13, padding: "8px 16px", borderRadius: 4, cursor: "pointer" }}>
              Sign out
            </button>
          </form>
        </div>
      </nav>

      <div style={{ maxWidth: 900, margin: "32px auto", padding: "0 24px" }}>

        {/* Create new competition */}
        <div style={{ background: "#fff", borderRadius: 4, border: "1px solid #e2e6ed", boxShadow: "0 1px 4px rgba(0,0,0,.08)", padding: "24px", marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#162233", marginBottom: 4 }}>Create new competition</div>
            <div style={{ fontSize: 13, color: "#64748b" }}>Set a name, deadline, problem statement and generate access codes.</div>
          </div>
          <Link href="/teacher/competitions/new" style={{ background: "#2558d4", color: "#fff", fontSize: 13, fontWeight: 500, padding: "10px 20px", borderRadius: 4, textDecoration: "none", whiteSpace: "nowrap" }}>
            + New competition
          </Link>
        </div>

        {/* Filter tabs */}
        <div style={{ display: "flex", gap: 24, borderBottom: "1px solid #e2e6ed", marginBottom: 16 }}>
          {([
            { key: "all", label: "All" },
            { key: "active", label: "Active" },
            { key: "closed", label: "Closed" },
          ] as const).map(t => {
            const isActive = filter === t.key;
            return (
              <Link
                key={t.key}
                href={t.key === "all" ? "/teacher/admin" : `/teacher/admin?filter=${t.key}`}
                style={{
                  fontSize: 13,
                  fontWeight: isActive ? 500 : 400,
                  color: isActive ? "#2558d4" : "#64748b",
                  padding: "10px 0",
                  borderBottom: `2px solid ${isActive ? "#2558d4" : "transparent"}`,
                  marginBottom: -1,
                  textDecoration: "none",
                }}
              >
                {t.label} <span style={{ color: "#94a3b8" }}>({counts[t.key]})</span>
              </Link>
            );
          })}
        </div>

        {compStats.length === 0 ? (
          <div style={{ background: "#fff", borderRadius: 4, border: "1px solid #e2e6ed", padding: "32px", textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
            {filter === "all" ? "No competitions yet." : `No ${filter} competitions.`}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {compStats.map(c => (
              <div key={c.id} style={{ background: "#fff", borderRadius: 4, border: `1px solid ${c.active ? "#bbf7d0" : "#e2e6ed"}`, boxShadow: "0 1px 4px rgba(0,0,0,.08)", padding: "20px 24px" }}>
                {/* Header row */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                      <span style={{ fontSize: 16, fontWeight: 600, color: "#162233" }}>{c.name}</span>
                      <span style={{
                        fontSize: 11, fontWeight: 500, borderRadius: 10, padding: "2px 8px",
                        background: c.active ? "#f0fdf4" : "#f1f5f9",
                        color: c.active ? "#16a34a" : "#94a3b8",
                        border: `1px solid ${c.active ? "#bbf7d0" : "#e2e6ed"}`,
                      }}>
                        {c.active ? "Active" : "Closed"}
                      </span>
                      {c.listed === false && (
                        <span style={{ fontSize: 11, fontWeight: 500, borderRadius: 10, padding: "2px 8px", background: "#f1f5f9", color: "#64748b", border: "1px solid #e2e6ed" }}>
                          Hidden from landing
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>
                      Deadline: {new Date(c.deadline).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <Link
                      href={`/teacher/dashboard?comp=${c.id}`}
                      style={{ background: "#f7f8fa", border: "1px solid #d1d5db", color: "#475569", fontSize: 12, padding: "6px 12px", borderRadius: 4, textDecoration: "none" }}
                    >
                      View submissions
                    </Link>
                    <Link
                      href={`/teacher/competitions/${c.id}/edit`}
                      style={{ background: "#f7f8fa", border: "1px solid #d1d5db", color: "#475569", fontSize: 12, padding: "6px 12px", borderRadius: 4, textDecoration: "none" }}
                    >
                      Edit
                    </Link>
                    {c.active ? (
                      <form action={`/api/teacher/competitions/${c.id}/close`} method="POST">
                        <button type="submit" style={{ background: "#fff", border: "1px solid #fca5a5", color: "#dc2626", fontSize: 12, padding: "6px 12px", borderRadius: 4, cursor: "pointer" }}>
                          Close competition
                        </button>
                      </form>
                    ) : (
                      <form action={`/api/teacher/competitions/${c.id}/activate`} method="POST">
                        <button type="submit" style={{ background: "#fff", border: "1px solid #bbf7d0", color: "#16a34a", fontSize: 12, padding: "6px 12px", borderRadius: 4, cursor: "pointer" }}>
                          Reopen
                        </button>
                      </form>
                    )}
                    <ListedToggleButton id={c.id} listed={c.listed ?? true} />
                    <DeleteCompetitionButton id={c.id} name={c.name} subCount={c.subCount} />
                  </div>
                </div>

                {/* Stats */}
                <div style={{ display: "flex", gap: 24, marginBottom: 16 }}>
                  <div style={{ fontSize: 13, color: "#475569" }}>
                    <span style={{ fontWeight: 600, color: "#162233" }}>{c.subCount}</span> / {c.totalCodes} submitted
                  </div>
                  <div style={{ fontSize: 13, color: "#475569" }}>
                    <span style={{ fontWeight: 600, color: "#b45309" }}>{c.shortlisted.length}</span> shortlisted
                  </div>
                </div>

                {/* Submitted / not submitted */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: c.winner || c.shortlisted.length > 0 ? 16 : 0 }}>
                  <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 4, padding: "10px 14px" }}>
                    <div style={{ fontSize: 11, fontWeight: 500, textTransform: "uppercase", color: "#15803d", letterSpacing: "0.07em", marginBottom: 6 }}>
                      Submitted ({c.submitted.length})
                    </div>
                    {c.submitted.length === 0 ? (
                      <span style={{ fontSize: 12, color: "#94a3b8" }}>None yet</span>
                    ) : (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {c.submitted.map(ac => (
                          <span key={ac.id} style={{ fontSize: 12, color: "#15803d", background: "#dcfce7", border: "1px solid #bbf7d0", borderRadius: 3, padding: "2px 7px" }}>
                            ✓ {ac.studentName ?? ac.code}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div style={{ background: "#fafafa", border: "1px solid #e2e6ed", borderRadius: 4, padding: "10px 14px" }}>
                    <div style={{ fontSize: 11, fontWeight: 500, textTransform: "uppercase", color: "#94a3b8", letterSpacing: "0.07em", marginBottom: 6 }}>
                      Not submitted ({c.notSubmitted.length})
                    </div>
                    {c.notSubmitted.length === 0 ? (
                      <span style={{ fontSize: 12, color: "#16a34a" }}>Everyone submitted!</span>
                    ) : (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {c.notSubmitted.map(ac => (
                          <span key={ac.id} style={{ fontSize: 12, color: "#64748b", background: "#f1f5f9", border: "1px solid #e2e6ed", borderRadius: 3, padding: "2px 7px" }}>
                            {ac.studentName ?? ac.code}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Winner */}
                {c.winner && (
                  <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 4, padding: "10px 14px", marginBottom: c.shortlisted.length > 0 ? 10 : 0 }}>
                    <span style={{ fontSize: 12, fontWeight: 500, color: "#15803d" }}>
                      🏆 Winner: <strong>{c.winner.studentName ?? "Unknown"}</strong> — code {c.winner.confirmationCode}
                    </span>
                  </div>
                )}

                {/* Shortlisted */}
                {c.shortlisted.length > 0 && (
                  <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 4, padding: "10px 14px" }}>
                    <div style={{ fontSize: 11, fontWeight: 500, textTransform: "uppercase", color: "#b45309", letterSpacing: "0.07em", marginBottom: 6 }}>Shortlisted</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {c.shortlisted.map(s => (
                        <Link key={s.id} href={`/teacher/submissions/${s.id}`} style={{ fontSize: 12, color: "#92400e", background: "#fef3c7", border: "1px solid #fde68a", borderRadius: 3, padding: "3px 8px", textDecoration: "none" }}>
                          ★ {s.studentName ?? s.confirmationCode}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
