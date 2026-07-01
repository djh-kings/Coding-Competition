import { redirect } from "next/navigation";
import Link from "next/link";
import { getTeacherSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { competitions, submissions, accessCodes } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { Logo } from "@/components/Logo";
import { DeleteCompetitionButton } from "./DeleteCompetitionButton";
import { ListedToggleButton } from "./ListedToggleButton";
import { MigrateButton } from "./MigrateButton";

export const dynamic = "force-dynamic";

type Phase = "urgent" | "judging" | "shortlisting" | "live" | "awaiting" | "complete" | "empty";

interface PhaseInfo {
  label: string;
  stripe: string;       // left border colour
  pillBg: string;
  pillText: string;
  pillBorder: string;
  nextAction: string;   // one-liner shown in summary
}

const PHASE_INFO: Record<Phase, PhaseInfo> = {
  urgent:       { label: "Closing soon",            stripe: "#dc2626", pillBg: "#fef2f2", pillText: "#b91c1c", pillBorder: "#fecaca", nextAction: "Chase late submitters" },
  judging:      { label: "Awaiting review",         stripe: "#b45309", pillBg: "#fffbeb", pillText: "#b45309", pillBorder: "#fde68a", nextAction: "Read & shortlist submissions" },
  shortlisting: { label: "Pick a winner",           stripe: "#ea580c", pillBg: "#fff7ed", pillText: "#9a3412", pillBorder: "#fed7aa", nextAction: "Choose the winner" },
  live:         { label: "Live",                    stripe: "#16a34a", pillBg: "#f0fdf4", pillText: "#15803d", pillBorder: "#bbf7d0", nextAction: "Monitor progress" },
  awaiting:     { label: "Awaiting first submission", stripe: "#2558d4", pillBg: "#eff6ff", pillText: "#1d4ed8", pillBorder: "#bfdbfe", nextAction: "Hand out access codes" },
  complete:     { label: "Winner declared",         stripe: "#15803d", pillBg: "#f0fdf4", pillText: "#15803d", pillBorder: "#bbf7d0", nextAction: "Share /results with students" },
  empty:        { label: "No submissions",          stripe: "#94a3b8", pillBg: "#f7f8fa", pillText: "#64748b", pillBorder: "#e2e6ed", nextAction: "—" },
};

const GROUP_ORDER: { title: string; phases: Phase[] }[] = [
  { title: "Needs attention", phases: ["urgent", "judging", "shortlisting"] },
  { title: "Live", phases: ["live", "awaiting"] },
  { title: "Completed", phases: ["complete"] },
  { title: "Closed without entries", phases: ["empty"] },
];

function phaseOf(c: { active: boolean | null; deadline: string }, subCount: number, shortlistedCount: number, hasWinner: boolean): Phase {
  const deadlineMs = new Date(c.deadline).getTime();
  const past = deadlineMs <= Date.now();
  const closed = past || !c.active;
  const urgent = !past && deadlineMs - Date.now() < 24 * 3600 * 1000;
  if (hasWinner) return "complete";
  if (closed && subCount === 0) return "empty";
  if (closed && shortlistedCount > 0) return "shortlisting";
  if (closed) return "judging";
  if (urgent) return "urgent";
  if (subCount === 0) return "awaiting";
  return "live";
}

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
      const phase = phaseOf(c, subs.length, shortlisted.length, !!winner);
      return { ...c, subCount: subs.length, winner, shortlisted, submitted, notSubmitted, totalCodes: codes.length, phase };
    })
  );

  // Sort by deadline ascending within each phase (most pressing first)
  const groups = GROUP_ORDER.map(g => {
    const items = compStats
      .filter(c => g.phases.includes(c.phase))
      .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
    return { ...g, items };
  }).filter(g => g.items.length > 0);

  return (
    <div style={{ minHeight: "100vh", background: "#f7f8fa" }}>
      <nav style={{ background: "#fff", padding: "0 24px", borderBottom: "1px solid #e2e6ed", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Logo />
          <span style={{ fontSize: 15, fontWeight: 600, color: "#162233" }}>All competitions</span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <MigrateButton />
          <form action="/api/teacher/logout" method="POST">
            <button style={{ background: "#fff", border: "1px solid #d1d5db", color: "#475569", fontSize: 13, padding: "8px 16px", borderRadius: 4, cursor: "pointer" }}>Sign out</button>
          </form>
        </div>
      </nav>

      <div style={{ maxWidth: 980, margin: "32px auto", padding: "0 24px" }}>
        <div style={{ background: "#fff", borderRadius: 4, border: "1px solid #e2e6ed", boxShadow: "0 1px 4px rgba(0,0,0,.08)", padding: "24px", marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#162233", marginBottom: 4 }}>Create new competition</div>
            <div style={{ fontSize: 13, color: "#64748b" }}>Set a name, deadline, problem statement and generate access codes.</div>
          </div>
          <Link href="/teacher/competitions/new" style={{ background: "#2558d4", color: "#fff", fontSize: 13, fontWeight: 500, padding: "10px 20px", borderRadius: 4, textDecoration: "none", whiteSpace: "nowrap" }}>
            + New competition
          </Link>
        </div>

        <div style={{ display: "flex", gap: 24, borderBottom: "1px solid #e2e6ed", marginBottom: 20 }}>
          {([
            { key: "all", label: "All" },
            { key: "active", label: "Active" },
            { key: "closed", label: "Closed" },
          ] as const).map(t => {
            const isActive = filter === t.key;
            return (
              <Link key={t.key} href={t.key === "all" ? "/teacher/admin" : `/teacher/admin?filter=${t.key}`} style={{
                fontSize: 13,
                fontWeight: isActive ? 500 : 400,
                color: isActive ? "#2558d4" : "#64748b",
                padding: "10px 0",
                borderBottom: `2px solid ${isActive ? "#2558d4" : "transparent"}`,
                marginBottom: -1,
                textDecoration: "none",
              }}>
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
          groups.map(group => (
            <section key={group.title} style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", color: "#475569", letterSpacing: "0.08em", margin: "0 0 10px 4px" }}>
                {group.title} <span style={{ color: "#94a3b8", fontWeight: 400 }}>({group.items.length})</span>
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {group.items.map(c => {
                  const info = PHASE_INFO[c.phase];
                  const needsAttention = group.title === "Needs attention";
                  return (
                    <details key={c.id} open={needsAttention} style={{
                      background: "#fff",
                      borderRadius: 4,
                      border: "1px solid #e2e6ed",
                      borderLeft: `4px solid ${info.stripe}`,
                      boxShadow: "0 1px 4px rgba(0,0,0,.06)",
                      overflow: "hidden",
                    }}>
                      <summary style={{
                        cursor: "pointer",
                        listStyle: "none",
                        padding: "14px 18px",
                        display: "grid",
                        gridTemplateColumns: "1fr auto",
                        gap: 16,
                        alignItems: "center",
                      }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 15, fontWeight: 600, color: "#162233" }}>{c.name}</span>
                            <span style={{
                              fontSize: 10, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em",
                              borderRadius: 10, padding: "2px 8px",
                              background: info.pillBg, color: info.pillText, border: `1px solid ${info.pillBorder}`,
                            }}>
                              {info.label}
                            </span>
                            {c.listed === false && (
                              <span style={{ fontSize: 10, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em", borderRadius: 10, padding: "2px 8px", background: "#f1f5f9", color: "#64748b", border: "1px dashed #cbd5e1" }}>
                                Hidden
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 12, color: "#64748b", display: "flex", gap: 14, flexWrap: "wrap" }}>
                            <span>{c.subCount}/{c.totalCodes} submitted</span>
                            <span>· {c.shortlisted.length} shortlisted</span>
                            <span>· Deadline {new Date(c.deadline).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                            {info.nextAction !== "—" && <span style={{ color: info.stripe }}>· {info.nextAction}</span>}
                          </div>
                        </div>
                        <span style={{ fontSize: 11, color: "#94a3b8" }}>▼ details</span>
                      </summary>

                      <div style={{ padding: "0 18px 18px 18px", borderTop: "1px solid #f0f2f5" }}>
                        <div style={{ display: "flex", gap: 8, paddingTop: 14, marginBottom: 14, flexWrap: "wrap" }}>
                          <Link href={`/teacher/dashboard?comp=${c.id}`} style={actionBtn}>Open dashboard</Link>
                          <Link href={`/teacher/competitions/${c.id}/edit`} style={actionBtn}>Edit</Link>
                          <Link href={`/teacher/competitions/new?from=${c.id}`} style={actionBtn}>Duplicate</Link>
                          {c.active ? (
                            <form action={`/api/teacher/competitions/${c.id}/close`} method="POST">
                              <button type="submit" style={{ ...actionBtn, border: "1px solid #fca5a5", color: "#dc2626" }}>Close competition</button>
                            </form>
                          ) : (
                            <form action={`/api/teacher/competitions/${c.id}/activate`} method="POST">
                              <button type="submit" style={{ ...actionBtn, border: "1px solid #bbf7d0", color: "#16a34a" }}>Reopen</button>
                            </form>
                          )}
                          <ListedToggleButton id={c.id} listed={c.listed ?? true} />
                          <DeleteCompetitionButton id={c.id} name={c.name} subCount={c.subCount} />
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: c.winner || c.shortlisted.length > 0 ? 14 : 0 }}>
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

                        {c.winner && (
                          <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 4, padding: "10px 14px", marginBottom: c.shortlisted.length > 0 ? 10 : 0 }}>
                            <span style={{ fontSize: 12, fontWeight: 500, color: "#15803d" }}>
                              🏆 Winner: <strong>{c.winner.pseudonym ?? c.winner.studentName ?? "Unknown"}</strong> — code {c.winner.confirmationCode}
                            </span>
                          </div>
                        )}

                        {c.shortlisted.length > 0 && (
                          <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 4, padding: "10px 14px" }}>
                            <div style={{ fontSize: 11, fontWeight: 500, textTransform: "uppercase", color: "#b45309", letterSpacing: "0.07em", marginBottom: 6 }}>Shortlisted</div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                              {c.shortlisted.map(s => (
                                <Link key={s.id} href={`/teacher/submissions/${s.id}`} style={{ fontSize: 12, color: "#92400e", background: "#fef3c7", border: "1px solid #fde68a", borderRadius: 3, padding: "3px 8px", textDecoration: "none" }}>
                                  ★ {s.pseudonym ?? s.studentName ?? s.confirmationCode}
                                </Link>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </details>
                  );
                })}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
}

const actionBtn: React.CSSProperties = {
  background: "#f7f8fa", border: "1px solid #d1d5db", color: "#475569",
  fontSize: 12, padding: "6px 12px", borderRadius: 4, textDecoration: "none", cursor: "pointer",
};
