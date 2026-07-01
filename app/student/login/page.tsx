"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";

export default function StudentLoginPage() {
  const [code, setCode] = useState("");
  const [pseudonym, setPseudonym] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, pseudonym }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
      } else {
        router.push("/student/workspace");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(180deg, #f7f8fa 0%, #fff 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}>
      <div style={{
        background: "#fff",
        borderRadius: 4,
        border: "1px solid #e2e6ed",
        boxShadow: "0 1px 6px rgba(0,0,0,.10)",
        padding: "48px 44px",
        width: "100%",
        maxWidth: 440,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 40, justifyContent: "center" }}>
          <Logo />
          <span style={{ fontSize: 15, fontWeight: 600, color: "#162233" }}>KCS Code Challenge</span>
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 600, color: "#162233", marginBottom: 8 }}>
          Sign in
        </h1>
        <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.55, marginBottom: 28 }}>
          Enter the access code your teacher gave you plus a name of your choosing. <strong>First time?</strong> Pick any name — it becomes your login and how your entry is credited.
        </p>

        <form onSubmit={handleSubmit}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#475569", marginBottom: 8 }}>
            Access code
          </label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="e.g. L4CS1-AB23CD"
            style={{
              width: "100%",
              padding: "11px 14px",
              fontFamily: "var(--font-mono)",
              fontSize: 15,
              color: "#162233",
              letterSpacing: "0.05em",
              border: "1.5px solid #2558d4",
              borderRadius: 4,
              outline: "none",
              boxSizing: "border-box",
              marginBottom: 14,
            }}
          />
          <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#475569", marginBottom: 8 }}>
            Your name
          </label>
          <input
            type="text"
            value={pseudonym}
            onChange={(e) => setPseudonym(e.target.value)}
            placeholder="e.g. Alice or CodeMaster42"
            maxLength={40}
            style={{
              width: "100%",
              padding: "11px 14px",
              fontSize: 15,
              color: "#162233",
              border: "1px solid #d1d5db",
              borderRadius: 4,
              outline: "none",
              boxSizing: "border-box",
            }}
          />
          {error && (
            <p style={{ fontSize: 12, color: "#dc2626", marginTop: 8 }}>{error}</p>
          )}
          <button
            type="submit"
            disabled={loading || !code || !pseudonym.trim()}
            style={{
              width: "100%",
              background: "#2558d4",
              color: "#fff",
              fontSize: 14,
              fontWeight: 500,
              padding: 12,
              borderRadius: 4,
              border: "none",
              cursor: loading || !code || !pseudonym.trim() ? "not-allowed" : "pointer",
              marginTop: 14,
              opacity: loading || !code || !pseudonym.trim() ? 0.7 : 1,
            }}
          >
            {loading ? "Checking…" : "Continue"}
          </button>
        </form>

        <p style={{ fontSize: 12, color: "#94a3b8", textAlign: "center", marginTop: 20 }}>
          Need help? Ask your teacher for your access code.
        </p>
      </div>
    </div>
  );
}
