"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export interface SubRow {
  id: string;
  studentName: string | null;
  pseudonym: string | null;
  accessCode: string;
  submittedAt: string | null;
  confirmationCode: string;
  shortlisted: boolean | null;
  winner: boolean | null;
  lines: number;
  language: string;
}

type SortKey = "name" | "submitted" | "lines" | "code";
type SortDir = "asc" | "desc";

export function SubmissionList({ rows }: { rows: SubRow[] }) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("submitted");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toUpperCase();
    let r = rows;
    if (q) {
      r = r.filter(row => {
        const hay = [row.studentName ?? "", row.pseudonym ?? "", row.accessCode, row.confirmationCode].join(" ").toUpperCase();
        return hay.includes(q);
      });
    }
    const dir = sortDir === "asc" ? 1 : -1;
    r = r.slice().sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name") {
        cmp = (a.pseudonym ?? a.studentName ?? "").localeCompare(b.pseudonym ?? b.studentName ?? "");
      } else if (sortKey === "submitted") {
        cmp = (a.submittedAt ?? "").localeCompare(b.submittedAt ?? "");
      } else if (sortKey === "lines") {
        cmp = a.lines - b.lines;
      } else if (sortKey === "code") {
        cmp = a.accessCode.localeCompare(b.accessCode);
      }
      return cmp * dir;
    });
    return r;
  }, [rows, search, sortKey, sortDir]);

  function toggleSort(k: SortKey) {
    if (sortKey === k) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(k); setSortDir(k === "submitted" || k === "lines" ? "desc" : "asc"); }
  }

  function toggleOne(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map(r => r.id)));
  }

  async function bulkShortlist(value: boolean) {
    if (selected.size === 0) return;
    setBusy(true);
    await Promise.all([...selected].map(id =>
      fetch(`/api/teacher/submissions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shortlisted: value }),
      })
    ));
    window.location.reload();
  }

  const allSelected = filtered.length > 0 && selected.size === filtered.length;
  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey === k ? <span style={{ marginLeft: 4, color: "#2558d4" }}>{sortDir === "asc" ? "▲" : "▼"}</span> : <span style={{ marginLeft: 4, color: "#cbd5e1" }}>↕</span>;

  return (
    <div style={{ background: "#fff", margin: "24px", borderRadius: 4, border: "1px solid #e2e6ed", boxShadow: "0 1px 4px rgba(0,0,0,.08)" }}>
      {/* Toolbar */}
      <div style={{ padding: "12px 24px", borderBottom: "1px solid #e2e6ed", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 240 }}>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, pseudonym, code prefix (e.g. L4CS1) or confirmation code"
            style={{ flex: 1, maxWidth: 460, padding: "7px 11px", fontSize: 13, border: "1px solid #d1d5db", borderRadius: 4, color: "#162233", outline: "none" }}
          />
          <span style={{ fontSize: 12, color: "#94a3b8" }}>{filtered.length} of {rows.length}</span>
        </div>
        {selected.size > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, color: "#475569", fontWeight: 500 }}>{selected.size} selected</span>
            <button onClick={() => bulkShortlist(true)} disabled={busy} style={{ background: "#fffbeb", border: "1px solid #fde68a", color: "#b45309", fontSize: 12, fontWeight: 500, padding: "6px 12px", borderRadius: 4, cursor: busy ? "wait" : "pointer" }}>
              ★ Shortlist
            </button>
            <button onClick={() => bulkShortlist(false)} disabled={busy} style={{ background: "#fff", border: "1px solid #d1d5db", color: "#475569", fontSize: 12, padding: "6px 12px", borderRadius: 4, cursor: busy ? "wait" : "pointer" }}>
              Unshortlist
            </button>
            <button onClick={() => setSelected(new Set())} style={{ background: "transparent", border: "none", color: "#94a3b8", fontSize: 12, cursor: "pointer" }}>
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Header */}
      <div style={{ background: "#f7f8fa", padding: "10px 24px", borderBottom: "1px solid #e2e6ed", display: "grid", gridTemplateColumns: "30px 1.7fr 1.3fr 1.3fr 70px 110px 90px", alignItems: "center", gap: 8 }}>
        <input type="checkbox" checked={allSelected} onChange={toggleAll} style={{ cursor: "pointer" }} />
        <button onClick={() => toggleSort("name")} style={headerBtnStyle}>Student <SortIcon k="name" /></button>
        <button onClick={() => toggleSort("submitted")} style={headerBtnStyle}>Submitted <SortIcon k="submitted" /></button>
        <button onClick={() => toggleSort("code")} style={headerBtnStyle}>Access code <SortIcon k="code" /></button>
        <button onClick={() => toggleSort("lines")} style={headerBtnStyle}>Lines <SortIcon k="lines" /></button>
        <span style={headerStyle}>Shortlisted</span>
        <span style={headerStyle}>Winner</span>
      </div>

      {/* Rows */}
      {filtered.length === 0 ? (
        <div style={{ padding: "32px 24px", textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
          {rows.length === 0 ? "No submissions yet." : "No submissions match this search."}
        </div>
      ) : (
        filtered.map(row => (
          <div key={row.id} style={{
            display: "grid",
            gridTemplateColumns: "30px 1.7fr 1.3fr 1.3fr 70px 110px 90px",
            padding: "11px 24px",
            borderBottom: "1px solid #f0f2f5",
            background: row.winner ? "#f0fdf4" : row.shortlisted ? "#fffbeb" : "#fff",
            alignItems: "center",
            gap: 8,
          }}>
            <input
              type="checkbox"
              checked={selected.has(row.id)}
              onChange={() => toggleOne(row.id)}
              style={{ cursor: "pointer" }}
            />
            <Link href={`/teacher/submissions/${row.id}`} style={{ fontSize: 13, fontWeight: 500, color: "#162233", textDecoration: "none" }}>
              {row.pseudonym ? `${row.pseudonym} (${row.studentName ?? "—"})` : (row.studentName ?? "—")}
            </Link>
            <span style={{ fontSize: 13, color: "#64748b" }}>
              {row.submittedAt ? new Date(row.submittedAt).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" }) : "—"}
            </span>
            <span style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "#475569" }}>{row.accessCode}</span>
            <span style={{ fontSize: 13, color: "#475569", fontFamily: "var(--font-mono)" }}>{row.lines}</span>
            <span style={{ fontSize: 13, fontWeight: row.shortlisted ? 500 : 400, color: row.shortlisted ? "#b45309" : "#94a3b8" }}>
              {row.shortlisted ? "★ Yes" : "No"}
            </span>
            <span style={{ fontSize: 13, color: row.winner ? "#16a34a" : "#94a3b8", fontWeight: row.winner ? 600 : 400 }}>
              {row.winner ? "🏆 Yes" : "—"}
            </span>
          </div>
        ))
      )}
    </div>
  );
}

const headerStyle: React.CSSProperties = {
  fontSize: 10, fontWeight: 500, textTransform: "uppercase", color: "#94a3b8", letterSpacing: "0.07em",
};
const headerBtnStyle: React.CSSProperties = {
  ...headerStyle, background: "transparent", border: "none", padding: 0, textAlign: "left", cursor: "pointer", fontFamily: "inherit",
};
