"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";

export default function TeacherLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/teacher/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (res.ok) {
        router.push("/teacher/dashboard");
      } else {
        const data = await res.json();
        setError(data.error ?? "Invalid credentials");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f7f8fa", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#fff", borderRadius: 4, border: "1px solid #e2e6ed", boxShadow: "0 1px 6px rgba(0,0,0,.10)", padding: "48px 44px", width: "100%", maxWidth: 440 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 40, justifyContent: "center" }}>
          <Logo />
          <span style={{ fontSize: 15, fontWeight: 600, color: "#162233" }}>KCS Code Challenge</span>
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: "#162233", marginBottom: 28 }}>Teacher login</h1>
        <form onSubmit={handleSubmit}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#475569", marginBottom: 8 }}>Username</label>
          <input type="text" value={username} onChange={e => setUsername(e.target.value)}
            style={{ width: "100%", padding: "11px 14px", fontSize: 14, color: "#162233", border: "1px solid #d1d5db", borderRadius: 4, outline: "none", boxSizing: "border-box", marginBottom: 16 }} />
          <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#475569", marginBottom: 8 }}>Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            style={{ width: "100%", padding: "11px 14px", fontSize: 14, color: "#162233", border: "1px solid #d1d5db", borderRadius: 4, outline: "none", boxSizing: "border-box" }} />
          {error && <p style={{ fontSize: 12, color: "#dc2626", marginTop: 8 }}>{error}</p>}
          <button type="submit" disabled={loading} style={{
            width: "100%", background: "#2558d4", color: "#fff", fontSize: 14, fontWeight: 500,
            padding: 12, borderRadius: 4, border: "none", cursor: "pointer", marginTop: 20,
            opacity: loading ? 0.7 : 1,
          }}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
