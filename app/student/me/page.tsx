import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { accessCodes, submissions, competitions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getStudentSession } from "@/lib/auth";
import { Logo } from "@/components/Logo";

export const dynamic = "force-dynamic";

export default async function StudentDashboard() {
  const session = await getStudentSession();
  if (!session) redirect("/student/login");

  const rows = await db
    .select({ ac: accessCodes, comp: competitions })
    .from(accessCodes)
    .innerJoin(competitions, eq(accessCodes.competitionId, competitions.id))
    .where(eq(accessCodes.id, session.sub))
    .limit(1);

  if (!rows.length) redirect("/student/login");
  const { ac, comp } = rows[0];

  const subRows = await db.select().from(submissions).where(eq(submissions.accessCodeId, ac.id)).limit(1);
  const sub = subRows[0] ?? null;

  const deadlinePast = new Date(comp.deadline).getTime() <= Date.now();
  const canWorkOn = !sub && comp.active && !deadlinePast;

  let status: { label: string; bg: string; border: string; text: string; icon: string; body: string };
  if (sub?.winner) {
    status = { label: "You won!", bg: "#f0fdf4", border: "#bbf7d0", text: "#15803d", icon: "🏆", body: "Congratulations — your submission was selected as the winner. See your teacher to claim your prize." };
  } else if (sub?.shortlisted) {
    status = { label: "Shortlisted", bg: "#fffbeb", border: "#fde68a", text: "#b45309", icon: "★", body: deadlinePast ? "Your entry made the shortlist. Waiting on the winner announcement." : "Your entry has been shortlisted! Judging still in progress." };
  } else if (sub) {
    status = { label: "Submitted", bg: "#eff6ff", border: "#bfdbfe", text: "#1d4ed8", icon: "✓", body: deadlinePast ? "Your entry is in — thanks for participating." : "Your entry has been received. Sit tight." };
  } else if (deadlinePast) {
    status = { label: "Missed the deadline", bg: "#fef2f2", border: "#fecaca", text: "#b91c1c", icon: "⏰", body: "The competition closed before you submitted. Nothing more you can do here." };
  } else if (!comp.active) {
    status = { label: "Not open", bg: "#f7f8fa", border: "#e2e6ed", text: "#64748b", icon: "🔒", body: "This competition isn't currently accepting entries." };
  } else {
    status = { label: "In progress", bg: "#eff6ff", border: "#bfdbfe", text: "#1d4ed8", icon: "✏️", body: "You've started — head back to the editor to keep working on your code." };
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f7f8fa" }}>
      <nav style={{ background: "#fff", padding: "0 24px", borderBottom: "1px solid #e2e6ed", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Logo />
          <span style={{ fontSize: 15, fontWeight: 600, color: "#162233" }}>KCS Code Challenge</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 13, color: "#64748b" }}>Signed in as <strong style={{ color: "#162233" }}>{ac.claimedPseudonym ?? "Student"}</strong></span>
          <form action="/api/student/logout" method="POST">
            <button style={{ background: "#fff", border: "1px solid #d1d5db", color: "#475569", fontSize: 13, padding: "7px 14px", borderRadius: 4, cursor: "pointer" }}>Sign out</button>
          </form>
        </div>
      </nav>

      <div style={{ maxWidth: 640, margin: "40px auto", padding: "0 24px" }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#162233", marginBottom: 6 }}>Your competitions</h1>
        <p style={{ fontSize: 14, color: "#64748b", marginBottom: 28 }}>Access code <span style={{ fontFamily: "var(--font-mono)" }}>{ac.code}</span></p>

        <div style={{ background: "#fff", border: "1px solid #e2e6ed", borderRadius: 6, boxShadow: "0 1px 4px rgba(0,0,0,.05)", overflow: "hidden" }}>
          <div style={{ padding: "20px 24px 14px" }}>
            <div style={{ fontSize: 11, fontWeight: 500, textTransform: "uppercase", color: "#94a3b8", letterSpacing: "0.08em", marginBottom: 4 }}>Competition</div>
            <div style={{ fontSize: 18, fontWeight: 600, color: "#162233", marginBottom: 2 }}>{comp.name}</div>
            {comp.description && <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.55, marginBottom: 10 }}>{comp.description}</div>}
            <div style={{ fontSize: 12, color: "#64748b" }}>
              {deadlinePast ? "Closed" : "Closes"} {new Date(comp.deadline).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>

          <div style={{ margin: "0 24px 20px", background: status.bg, border: `1px solid ${status.border}`, borderRadius: 6, padding: "16px 18px", display: "flex", gap: 12, alignItems: "flex-start" }}>
            <span style={{ fontSize: 22 }} aria-hidden>{status.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: status.text, marginBottom: 4 }}>{status.label}</div>
              <div style={{ fontSize: 13, color: status.text, lineHeight: 1.5 }}>{status.body}</div>
              {sub?.confirmationCode && (
                <div style={{ fontSize: 12, color: status.text, marginTop: 8 }}>
                  Confirmation code: <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>{sub.confirmationCode}</span>
                </div>
              )}
            </div>
          </div>

          {sub?.comment && (
            <div style={{ margin: "0 24px 20px", padding: "14px 18px", background: "#f7f8fa", border: "1px solid #e2e6ed", borderRadius: 6 }}>
              <div style={{ fontSize: 11, fontWeight: 500, textTransform: "uppercase", color: "#94a3b8", letterSpacing: "0.08em", marginBottom: 6 }}>Teacher comment</div>
              <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{sub.comment}</div>
            </div>
          )}

          <div style={{ borderTop: "1px solid #e2e6ed", padding: "14px 24px", display: "flex", gap: 8 }}>
            {canWorkOn && (
              <Link href="/student/workspace" style={{ background: "#2558d4", color: "#fff", fontSize: 13, fontWeight: 500, padding: "9px 18px", borderRadius: 4, textDecoration: "none" }}>
                Open the editor →
              </Link>
            )}
            {sub && (
              <Link href="/student/workspace" style={{ background: "#f7f8fa", border: "1px solid #d1d5db", color: "#475569", fontSize: 13, padding: "8px 16px", borderRadius: 4, textDecoration: "none" }}>
                View my submitted code
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
