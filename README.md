# KCS Coding Competition Platform

A web app for running a school coding competition. Students write and run Python (or JavaScript) in a browser-based IDE and submit their solution. Teachers manage the competition, review submissions, shortlist entries, and declare a winner.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16.2.9 (App Router) |
| Database | Drizzle ORM + libsql (SQLite locally, Turso in production) |
| Auth | JWT via `jose` (cookie-based, no NextAuth) |
| Code execution | Pyodide (Python in WebAssembly, runs in browser) |
| Editor | CodeMirror 6 with one-dark theme |
| Hosting | Vercel |

---

## Getting Started (local)

```bash
npm install
cp .env.example .env
npm run db:setup   # creates tables + seeds test data
npm run dev
```

Visit `http://localhost:3000`.

**Default credentials:**
- Teacher: `teacher` / `password123`
- Student codes: `CODE01`, `CODE02`, `CODE03`

---

## Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | `file:./dev.db` locally, or `libsql://...` for Turso |
| `DATABASE_AUTH_TOKEN` | Turso auth token (leave blank for local SQLite) |
| `AUTH_SECRET` | Any long random string for JWT signing |

---

## Deployment (Vercel + Turso)

1. Push to `main` — Vercel auto-deploys
2. Add the three env vars above in Vercel project settings
3. Seed the Turso database via the Turso web shell (app.turso.tech → your DB → Edit Data):
   - Run the `CREATE TABLE` statements from `db/migrate.ts`
   - Insert a teacher row with a bcrypt-hashed password
   - Insert a competition and access codes

---

## Database Schema

```
teachers        id, username, password_hash, created_at
competitions    id, name, deadline, problem_html, test_cases(JSON), active, teacher_id
access_codes    id, code, student_name, competition_id, used_at
submissions     id, code, language, confirmation_code, shortlisted, winner, comment, submitted_at, access_code_id, competition_id, student_name
```

---

## How It Works

### Student flow
1. `/` → redirects to `/landing` — shows competition name and countdown
2. Click "Enter competition code" → `/student/login` — enter access code
3. `/student/workspace` — IDLE-style IDE:
   - **Top half**: CodeMirror editor (Python 3 or JavaScript)
   - **Bottom half**: interactive console — code runs in a Web Worker (Pyodide), `input()` pauses and prompts the student to type in the console, output appears inline
4. Click **Submit** → confirmation modal with a unique 8-character code

### Teacher flow
1. `/teacher/login` — username/password
2. `/teacher/dashboard` — see all submissions, access codes (with used/unused status), shortlisted entries, winner
3. Click a submission → `/teacher/submissions/[id]` — read-only code view, run the student's code, leave a comment, shortlist, mark as winner

---

## Code Execution

Python runs entirely in the browser via **Pyodide** (Python 3.12 compiled to WebAssembly) in a Web Worker. This means:

- No server-side code execution
- No rate limits or external API dependencies
- `input()` works interactively — execution pauses in the worker and the console prompts the student to type (via `SharedArrayBuffer` + `Atomics`)
- First run on a fresh page load takes ~5–10 seconds (Pyodide downloads ~10 MB from CDN and caches it); subsequent runs are instant

JavaScript runs in a sandboxed `new Function()` with a mocked `console` object.

**Required browser headers** (set in `next.config.ts`) for `SharedArrayBuffer`:
```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

---

## Project Structure

```
app/
  landing/              Public landing page
  student/
    login/              Access code entry
    workspace/          Student IDE (WorkspaceClient.tsx)
  teacher/
    login/              Teacher auth
    dashboard/          Submission list + access codes
    submissions/[id]/   Submission detail
    competitions/new/   Create competition form
  api/
    auth/student/       POST — validate access code, set JWT cookie
    auth/teacher/       POST — validate password, set JWT cookie
    competition/active/ GET  — fetch active competition for student session
    run/                POST — (legacy, kept but unused — execution is now client-side)
    submit/             POST — save submission, return confirmation code
    teacher/
      submissions/[id]/ PATCH — update shortlisted/winner/comment
      competitions/     POST  — create competition + generate access codes
      logout/           POST  — clear teacher cookie

db/
  schema.ts             Drizzle schema
  migrate.ts            Raw SQL migration runner
  seed.ts               Seed script (teacher + one competition + 3 codes)

lib/
  db.ts                 Drizzle client
  auth.ts               JWT sign/verify, session helpers
  runner.ts             (Legacy client-side runner — main execution now in Web Worker)

public/
  pyodide-worker.js     Web Worker: loads Pyodide, runs code, handles blocking stdin

components/
  CodeEditor.tsx        CodeMirror 6 wrapper
  Logo.tsx              </> logo mark
  CountdownTimer.tsx    Countdown display
```

---

## npm Scripts

```bash
npm run dev          # local dev server
npm run build        # production build
npm run db:migrate   # create/update tables
npm run db:seed      # insert test data
npm run db:setup     # migrate + seed
```

---

## Design Tokens

| Token | Value | Usage |
|---|---|---|
| `navy-900` | `#162233` | Top bars, headings |
| `accent-blue` | `#2558d4` | CTAs, active states |
| `slate-600` | `#475569` | Secondary text |
| `slate-200` | `#e2e6ed` | Borders |
| `green-600` | `#16a34a` | Success |
| `red-600` | `#dc2626` | Errors |

Monospace font: JetBrains Mono (loaded via Google Fonts `<link>` tag).
UI font: `system-ui, -apple-system, sans-serif`.
