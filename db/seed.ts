import { createClient } from "@libsql/client";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

const client = createClient({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

async function seed() {
  const teacherId = randomUUID();
  const competitionId = randomUUID();
  const deadline = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const passwordHash = await bcrypt.hash("password123", 10);

  const testCases = JSON.stringify([
    { input: "3 5", expected: "8" },
    { input: "10 20", expected: "30" },
    { input: "0 0", expected: "0" },
  ]);

  const problemHtml = `
    <h3>Sum Two Numbers</h3>
    <p>Write a program that reads two integers from stdin and prints their sum.</p>
    <div class="info-box">
      <div class="box-label">Input format</div>
      <p>A single line containing two integers separated by a space.</p>
    </div>
    <div class="info-box">
      <div class="box-label">Output format</div>
      <p>A single integer — the sum of the two inputs.</p>
    </div>
    <div class="info-box">
      <div class="box-label">Example</div>
      <pre>Input:  3 5\nOutput: 8</pre>
    </div>
  `;

  await client.execute({
    sql: "INSERT OR IGNORE INTO teachers (id, username, password_hash) VALUES (?, ?, ?)",
    args: [teacherId, "teacher", passwordHash],
  });

  await client.execute({
    sql: "INSERT OR IGNORE INTO competitions (id, name, deadline, problem_html, test_cases, active, teacher_id) VALUES (?, ?, ?, ?, ?, 1, ?)",
    args: [competitionId, "KCS Code Challenge", deadline, problemHtml, testCases, teacherId],
  });

  for (const code of ["CODE01", "CODE02", "CODE03"]) {
    await client.execute({
      sql: "INSERT OR IGNORE INTO access_codes (id, code, competition_id) VALUES (?, ?, ?)",
      args: [randomUUID(), code, competitionId],
    });
  }

  console.log("✓ Seeded: teacher/password123, codes: CODE01 CODE02 CODE03");
}

seed().catch(console.error);
