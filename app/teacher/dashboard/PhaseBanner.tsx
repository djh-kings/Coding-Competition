import Link from "next/link";

interface Comp { id: string; name: string; deadline: string; active: boolean | null; }
interface Counts { submissionCount: number; codeCount: number; shortlistedCount: number; hasWinner: boolean; }

function fmtCountdown(deadlineIso: string) {
  const diff = new Date(deadlineIso).getTime() - Date.now();
  if (diff <= 0) return "closed";
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  if (d >= 1) return `${d} day${d === 1 ? "" : "s"}, ${h}h`;
  const m = Math.floor((diff % 3600000) / 60000);
  return `${h}h ${m}m`;
}

export function PhaseBanner({ comp, counts }: { comp: Comp; counts: Counts }) {
  const now = Date.now();
  const deadlineMs = new Date(comp.deadline).getTime();
  const past = deadlineMs <= now;
  const closed = past || !comp.active;
  const urgent = !past && deadlineMs - now < 24 * 3600 * 1000;
  const { submissionCount, codeCount, shortlistedCount, hasWinner } = counts;

  let bg = "#eff6ff", border = "#bfdbfe", title = "#1d4ed8", text = "#1e40af", icon = "📍";
  let heading = "";
  let body = "";
  let cta: { href: string; label: string } | null = null;

  if (hasWinner) {
    bg = "#f0fdf4"; border = "#bbf7d0"; title = "#15803d"; text = "#166534"; icon = "🏆";
    heading = "Winner declared";
    body = "Results are visible to students via /results — share the link if you haven't already.";
    cta = { href: "/results", label: "Open results page" };
  } else if (closed && submissionCount === 0) {
    bg = "#f7f8fa"; border = "#e2e6ed"; title = "#475569"; text = "#64748b"; icon = "🪦";
    heading = "Closed with no submissions";
    body = "No students submitted before the deadline.";
  } else if (closed && shortlistedCount > 0) {
    bg = "#fff7ed"; border = "#fed7aa"; title = "#9a3412"; text = "#7c2d12"; icon = "🥇";
    heading = `Pick a winner from ${shortlistedCount} shortlisted entr${shortlistedCount === 1 ? "y" : "ies"}`;
    body = "Compare your shortlisted submissions and use the Mark as winner button on the best one.";
  } else if (closed && submissionCount > 0) {
    bg = "#fffbeb"; border = "#fde68a"; title = "#b45309"; text = "#92400e"; icon = "📚";
    heading = `Time to review ${submissionCount} submission${submissionCount === 1 ? "" : "s"}`;
    body = "Competition is closed. Open each one, run their code, and shortlist your favourites.";
  } else if (!closed && submissionCount === 0) {
    bg = "#eff6ff"; border = "#bfdbfe"; title = "#1d4ed8"; text = "#1e40af"; icon = "📨";
    heading = "Live — but nobody has submitted yet";
    body = `Have you handed out the ${codeCount} access codes? Closes in ${fmtCountdown(comp.deadline)}.`;
  } else if (urgent) {
    bg = "#fef2f2"; border = "#fecaca"; title = "#b91c1c"; text = "#991b1b"; icon = "⏰";
    heading = `Closes in ${fmtCountdown(comp.deadline)}`;
    body = `${submissionCount} of ${codeCount} students have submitted. Last chance to chase stragglers.`;
  } else {
    bg = "#f0fdf4"; border = "#bbf7d0"; title = "#15803d"; text = "#166534"; icon = "🟢";
    heading = `Live — closes in ${fmtCountdown(comp.deadline)}`;
    body = `${submissionCount} of ${codeCount} students have submitted so far.`;
  }

  return (
    <div style={{
      margin: "16px 24px 0",
      background: bg,
      border: `1px solid ${border}`,
      borderRadius: 6,
      padding: "14px 18px",
      display: "flex",
      alignItems: "center",
      gap: 14,
    }}>
      <span style={{ fontSize: 22 }} aria-hidden>{icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: title, marginBottom: 2 }}>{heading}</div>
        <div style={{ fontSize: 13, color: text, lineHeight: 1.5 }}>{body}</div>
      </div>
      {cta && (
        <Link href={cta.href} style={{
          background: title, color: "#fff", border: "none",
          fontSize: 13, fontWeight: 500, padding: "8px 16px", borderRadius: 4, textDecoration: "none",
          whiteSpace: "nowrap",
        }}>
          {cta.label} →
        </Link>
      )}
    </div>
  );
}
