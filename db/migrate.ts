import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

async function migrate() {
  await client.executeMultiple(`
    CREATE TABLE IF NOT EXISTS teachers (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS competitions (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      deadline TEXT NOT NULL,
      problem_html TEXT NOT NULL,
      test_cases TEXT NOT NULL,
      active INTEGER DEFAULT 1,
      teacher_id TEXT NOT NULL REFERENCES teachers(id),
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS access_codes (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      student_name TEXT,
      competition_id TEXT NOT NULL REFERENCES competitions(id),
      used_at TEXT
    );

    CREATE TABLE IF NOT EXISTS submissions (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL,
      language TEXT NOT NULL DEFAULT 'python',
      confirmation_code TEXT NOT NULL UNIQUE,
      shortlisted INTEGER DEFAULT 0,
      winner INTEGER DEFAULT 0,
      comment TEXT,
      submitted_at TEXT DEFAULT (datetime('now')),
      access_code_id TEXT NOT NULL UNIQUE REFERENCES access_codes(id),
      competition_id TEXT NOT NULL REFERENCES competitions(id),
      student_name TEXT,
      pseudonym TEXT
    );
  `);

  // Idempotent column-add for existing databases
  try {
    await client.execute("ALTER TABLE submissions ADD COLUMN pseudonym TEXT");
  } catch {
    // Column already exists — fine
  }
  try {
    await client.execute("ALTER TABLE competitions ADD COLUMN description TEXT");
  } catch {
    // Column already exists — fine
  }
  try {
    await client.execute("ALTER TABLE competitions ADD COLUMN listed INTEGER DEFAULT 1");
  } catch {
    // Column already exists — fine
  }
  try { await client.execute("ALTER TABLE access_codes ADD COLUMN claimed_pseudonym TEXT"); } catch {}
  try { await client.execute("ALTER TABLE access_codes ADD COLUMN draft_code TEXT"); } catch {}
  try { await client.execute("ALTER TABLE access_codes ADD COLUMN draft_language TEXT"); } catch {}

  console.log("✓ Tables created");
}

migrate().catch(console.error);
