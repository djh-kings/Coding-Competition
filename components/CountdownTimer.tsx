"use client";

import { useEffect, useState } from "react";

function getTimeLeft(deadline: string) {
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff <= 0) return null;
  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds };
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function CountdownTimer({ deadline }: { deadline: string }) {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft(deadline));

  useEffect(() => {
    const id = setInterval(() => setTimeLeft(getTimeLeft(deadline)), 1000);
    return () => clearInterval(id);
  }, [deadline]);

  if (!timeLeft) {
    return (
      <p style={{ fontSize: 18, color: "#dc2626", fontWeight: 600 }}>
        Competition closed
      </p>
    );
  }

  const units =
    timeLeft.days > 0
      ? [
          { label: "DAYS", value: timeLeft.days },
          { label: "HRS", value: timeLeft.hours },
          { label: "MIN", value: timeLeft.minutes },
          { label: "SEC", value: timeLeft.seconds },
        ]
      : [
          { label: "HRS", value: timeLeft.hours },
          { label: "MIN", value: timeLeft.minutes },
          { label: "SEC", value: timeLeft.seconds },
        ];

  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 28, justifyContent: "center", marginBottom: 48 }}>
      {units.map((u, i) => (
        <div key={u.label} style={{ display: "flex", alignItems: "flex-start", gap: 28 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 40, fontWeight: 600, color: "#162233", letterSpacing: "-0.02em", lineHeight: 1 }}>
              {pad(u.value)}
            </div>
            <div style={{ fontSize: 10, textTransform: "uppercase", color: "#94a3b8", marginTop: 8 }}>
              {u.label}
            </div>
          </div>
          {i < units.length - 1 && (
            <div style={{ fontSize: 32, fontWeight: 300, color: "#cbd5e1", lineHeight: 1, marginTop: 4 }}>:</div>
          )}
        </div>
      ))}
    </div>
  );
}
