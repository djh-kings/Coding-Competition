"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";

export default function StudentLoginPage() {
  const [code, setCode] = useState("");
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
        body: JSON.stringify({ code }),
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
          Enter your access code
        </h1>
        <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.55, marginBottom: 28 }}>
          Your teacher will have given you a unique access code. Enter it below to begin.
        </p>

        <form onSubmit={handleSubmit}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#475569", marginBottom: 8 }}>
            Access code
          </label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="e.g. CODE01"
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
            }}
          />
          {error && (
            <p style={{ fontSize: 12, color: "#dc2626", marginTop: 8 }}>{error}</p>
          )}
          <button
            type="submit"
            disabled={loading || !code}
            style={{
              width: "100%",
              background: "#2558d4",
              color: "#fff",
              fontSize: 14,
              fontWeight: 500,
              padding: 12,
              borderRadius: 4,
              border: "none",
              cursor: loading || !code ? "not-allowed" : "pointer",
              marginTop: 14,
              opacity: loading || !code ? 0.7 : 1,
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
