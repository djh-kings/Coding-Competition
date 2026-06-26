# Handoff: School Coding Competition Platform

## Overview
A web application for running a school coding competition. Two user types: **students** (aged 14–18) and **teachers**. One competition runs at a time. Students enter an access code, write code in a browser-based editor, run it against test cases, and submit. Teachers manage the competition, review submissions, shortlist entries, and declare a winner.

## About the Design Files
The file `Competition Platform.dc.html` is a **design reference created in HTML** — a high-fidelity prototype showing intended look and behaviour. It is not production code. Your task is to recreate these screens in your chosen framework (React recommended) using appropriate libraries for the code editor (CodeMirror or Monaco), routing, and state management. The HTML is there to reference visual details precisely — do not ship it directly.

## Fidelity
**High-fidelity.** Pixel-level accuracy is expected for colours, typography, spacing, and component structure. All hex values, font sizes, and spacing measurements are specified below.

---

## Design Tokens

### Colours
| Token | Hex | Usage |
|---|---|---|
| `navy-900` | `#162233` | Primary brand, top bars, nav, headings |
| `navy-800` | `#1a1d2e` | Code editor background |
| `navy-700` | `#151827` | Editor action bar background |
| `editor-line` | `#2a2d3e` | Editor border / button bg |
| `editor-gutter` | `#3d4263` (or `#4a5068`) | Line number colour |
| `accent-blue` | `#2558d4` | Primary CTA, active tab underline, links |
| `slate-700` | `#334155` | Body text |
| `slate-600` | `#475569` | Secondary text |
| `slate-500` | `#64748b` | Muted labels |
| `slate-400` | `#94a3b8` | Placeholder / very muted |
| `slate-200` | `#e2e6ed` | Borders |
| `slate-100` | `#f0f2f5` | Alternate row background |
| `slate-50` | `#f7f8fa` | Panel backgrounds |
| `green-600` | `#16a34a` | Pass / success |
| `green-50` | `#f0fdf4` | Success background |
| `amber-600` | `#b45309` | Shortlisted star |
| `amber-50` | `#fffbeb` | Shortlisted row background |
| `red-600` | `#dc2626` | Fail / error |
| `white` | `#ffffff` | Card backgrounds |

### Typography
- **UI font**: `system-ui, -apple-system, sans-serif` — never Inter, Roboto, or Arial
- **Monospace font**: `'JetBrains Mono', monospace` — load from Google Fonts
- **Minimum UI text size**: 12px
- **Minimum code text size**: 13px

### Spacing
Base unit 4px. Common values: 8, 12, 14, 16, 20, 24, 28, 32, 40, 48.

### Borders & Radius
- Standard border: `1px solid #e2e6ed`
- Card radius: `3–4px`
- Button radius: `4px`
- Input radius: `4px`
- Badge/pill radius: `10px`

### Shadows
- Card: `0 1px 4px rgba(0,0,0,.08)` or `0 1px 6px rgba(0,0,0,.10)`
- Modal/dialog: `0 4px 24px rgba(0,0,0,.12–.15)`

---

## Screens

---

### Screen 1 — Landing Page (public, pre-login)

**Purpose:** First page all users see. Shows competition name, countdown timer, entry point for students, less-prominent teacher login.

**Layout:** Single-column, full viewport. Three zones: nav bar, hero, footer.

#### Nav bar
- Height: ~60px, padding 16px 32px
- Flex row, space-between
- Left: logo mark (28×28px, `#162233` bg, `border-radius:4px`, white `</>` in JetBrains Mono 14px bold) + competition name ("KCS Code Challenge", 600 weight, 15px, `#162233`)
- Right: "Teacher login →" link, 400 weight, 13px, `#64748b`, no underline
- Bottom border: `1px solid #e2e6ed`

#### Hero
- Background: `linear-gradient(180deg, #f7f8fa 0%, #fff 100%)`
- Padding: 72px 32px 64px, text-align center
- Term label: 11px, `#2558d4`, uppercase, letter-spacing 0.12em, margin-bottom 18px
- Title (h1): 40px, 700 weight, `#162233`, letter-spacing -0.025em, margin-bottom 18px
- Description: 16px, 400 weight, `#64748b`, line-height 1.65, max-width 540px centred, margin-bottom 44px
- Countdown: flex row centred, gap 28px
  - Each unit: number (40px, 600, `#162233`, letter-spacing -0.02em) + label (10px, uppercase, `#94a3b8`, margin-top 8px)
  - Separator: colon, `#cbd5e1`, 300 weight, 32px
  - Margin-bottom 48px
- Primary CTA: "Enter competition code" — `#2558d4` bg, white text, 500 weight, 14px, padding 13px 28px, radius 4px
- Secondary CTA: "Download rules (PDF)" — white bg, `#475569` text, `1px solid #d1d5db` border, same padding, with small download SVG icon (14×14)

#### Footer
- Padding 16px 32px, border-top `1px solid #e2e6ed`, text-align centre
- 12px, 400 weight, `#94a3b8`

---

### Screen 2 — Student Login

**Purpose:** Student enters a single access code given by their teacher. Must take ~10 seconds.

**Layout:** Centred card, max-width ~440px, padding 48px 44px.

- Logo + brand name (same as nav, margin-bottom 40px)
- Heading: "Enter your access code", 22px, 600 weight, `#162233`, margin-bottom 8px
- Sub-text: 13px, `#94a3b8`, line-height 1.55, margin-bottom 28px
- Label: "Access code", 12px, 500 weight, `#475569`, margin-bottom 8px
- Input: full-width, padding 11px 14px, JetBrains Mono 15px, `#162233`, letter-spacing 0.05em, border `1.5px solid #2558d4` (focused state shown)
- CTA button: full-width, "Continue", `#2558d4`, white text, 14px 500 weight, padding 12px, margin-top 14px
- Footer note: 12px, `#94a3b8`, centred, margin-top 20px

**Validation:** Show inline error below input if code not found ("Code not recognised. Check with your teacher."). No other states needed.

---

### Screen 3 — Student Workspace (core screen)

**Purpose:** Split-pane environment where students read the problem and write/run their solution. No navigation away once in.

**Layout:** Full-viewport, no scroll on outer container. Three horizontal zones stacked: top bar, split pane (fills remaining height), implicit output within right pane.

#### Top bar
- Background: `#162233`, padding 10–11px 20px
- Left: competition name (500 weight, 13px, `#94a3b8`) · timer ("02:14:37 remaining", 12px, `#64748b`)
- Right: green pulse dot (6×6px, `#22c55e`, border-radius 50%, CSS `animation: pulse 2s ease-in-out infinite` opacity 1→0.4→1) + "Connected" (12px, `#64748b`)

#### Left pane — Problem statement
- Width: 380px, fixed. `border-right: 1px solid #e2e6ed`
- Header: tabs "Problem" (active, `#2558d4`, 2px solid underline) and "Test Data" (inactive, `#94a3b8`). Right side: collapse chevron button (24×24px, no bg, chevron SVG pointing left)
- Content area: padding 22px, scrollable
  - h3: 16px, 600, `#162233`
  - Body text: 13px, 400, `#475569`, line-height 1.7
  - Info boxes (Input format, Output format, Example): `#f7f8fa` bg, radius 4px, padding 14px, 12px gap
  - Box label: 10px, 500, uppercase, `#94a3b8`, letter-spacing 0.07em, margin-bottom 10px
  - Inline `<code>`: `#e8ecf1` bg, padding 2px 6px, radius 3px, JetBrains Mono 12px, `#162233`
  - Example block uses JetBrains Mono 12px

**Collapsed state (3c):** Panel collapses to a 40px-wide rail. Shows expand chevron (pointing right) and vertical rotated "PROBLEM" label. Editor takes full remaining width.

#### Right pane — Editor + output
- Flex column, `flex:1`
- **Language bar**: padding 8px 16px, border-bottom `1px solid #e2e6ed`. "Language:" label (12px, `#64748b`) + styled dropdown showing "Python 3"
- **Code editor**: height 280px, `background:#1a1d2e`, padding 16px 0, overflow auto
  - Font: JetBrains Mono 13px, line-height 1.85
  - Gutter: width 48px, text-align right, padding-right 16px, `#4a5068` (or `#3d4263`), `white-space:pre`, user-select none
  - Syntax highlight tokens (Material theme palette):
    - Keywords (`def`, `for`, `in`, `return`, `while`, `yield`): `#c792ea`
    - Function names: `#82aaff`
    - Strings: `#c3e88d`
    - Numbers: `#f78c6c`
    - Operators / punctuation: `#89ddff`
    - Comments: `#546e7a`, italic
    - Default text: `#e2e8f0`
  - Use **CodeMirror 6** or **Monaco Editor** in production
- **Action bar**: padding 10px 16px, `background:#151827`, border-top `1px solid #0d0f1a`
  - Run button: `#232840` bg, `1px solid #313654` border, `#cbd5e1` text, 13px 500, play-triangle SVG icon
  - Submit button: `#2558d4` bg, white text, 13px 500
- **Output panel**: `flex:1`, `min-height:420px`, white bg
  - Header row (background `#f7f8fa`): tabs "OUTPUT" (active, blue underline) and "TEST CASES" with badge showing pass count (`#f0fdf4` bg, `#16a34a` text, monospace, 10px). Right side: "Exit 0 · 0.04s · 6.2 MB" in green + "Clear" + "Wrap" buttons
  - Terminal body: padding 14px 18px, JetBrains Mono 13px, line-height 1.7, `#162233`, scrollable
    - Shell prompts: `#94a3b8`
    - Normal stdout: `#162233`
    - Error lines: `#dc2626`
    - Process summary line: `#94a3b8`
    - Cursor: blinking block or underscore

#### Test Cases tab (alternate view)
- Compact strip of cases: each is a pill/row with coloured dot + "Case N" + "Pass"/"Fail"
- Summary: "2 of 3 passing" right-aligned
- Case detail: 3-column grid — Input / Expected / Your output — each in a rounded box. Matching output gets `#bbf7d0` border; failing gets `#fecaca` border

#### Submit flow
On Submit: show confirmation modal (see Screen 3b).

---

### Screen 3b — Submission Confirmation Modal

**Purpose:** Shown on top of workspace after submitting. Cannot resubmit.

**Layout:** Centred modal, max-width 480px, padding 36px. White bg, radius 4px, shadow `0 4px 24px rgba(0,0,0,.12)`, border `1px solid #e2e6ed`.

- Success icon: 44×44px circle, `#f0fdf4` bg, green checkmark SVG
- Heading: "Submission received", 19px, 600, `#162233`
- Body copy: 14px, 400, `#64748b`, line-height 1.6
- Label: "Confirmation code", 11px, 500, uppercase, `#94a3b8`
- Code box: flex row — code display (`#f7f8fa` bg, border `1px solid #e2e6ed`, JetBrains Mono 16px 500, letter-spacing 0.05em, padding 12px 14px) + Copy button (`#162233` bg, white text, copy SVG)
- Footer note: 12px, `#94a3b8`, "Submitted [date]. You cannot resubmit."
- No close button — modal is permanent for this session

---

### Screen 4 — Teacher: Submission List

**Purpose:** Teacher overview of all submissions. Filter by shortlisted/winner. Click row to review.

**Layout:** Full-page with nav bar, stats strip, filter tabs, sortable table.

#### Nav bar
- Padding 16px 24px, border-bottom `1px solid #e2e6ed`
- Left: logo + competition name + "Active" badge (`#f0fdf4` bg, `#16a34a` text, `1px solid #bbf7d0` border, radius 10px, 11px 500)
- Right: "＋ New competition" and "Sign out" — both ghost buttons (white bg, `#d1d5db` border, `#475569` text, 13px, padding 8px 16px)

#### Stats strip
- 3-column grid, border-bottom `1px solid #e2e6ed`
- Each cell: border-right (except last), padding 18px 24px
- Label: 10px, 400, uppercase, `#94a3b8`, letter-spacing 0.08em, margin-bottom 7px
- Value: 22px, 600, `#162233` (Submissions and Shortlisted); 14px 600 for Deadline

#### Filter tabs
- Padding 12px 24px, border-bottom
- Active tab: 500 weight, `#2558d4`, 2px solid border-bottom
- Inactive tabs: 400 weight, `#64748b`, pointer cursor
- Right: "Sort: newest first ↓" in 12px `#94a3b8`

#### Table
- Header row: `#f7f8fa` bg, padding 10px 24px, border-bottom
  - Columns: Student (2fr) / Submitted (1.4fr) / Code (1.6fr) / Shortlisted (110px) / Winner (90px)
  - Header text: 10px, 500, uppercase, `#94a3b8`, letter-spacing 0.07em
- Data rows: padding 13px 24px, border-bottom `1px solid #f0f2f5`, pointer cursor
  - Student name: 13px, 500, `#162233`
  - Date: 13px, 400, `#64748b`
  - Code: 12px, 400, JetBrains Mono, `#64748b`
  - Shortlisted "★ Yes": 13px, 500, `#b45309`; "No": `#94a3b8`
  - Winner: `#94a3b8` em dash
- Shortlisted rows: `#fffbeb` background
- Hover state: `#f7f8fa` background

---

### Screen 5 — Teacher: Submission Detail

**Purpose:** Teacher reviews a student's code, runs it, leaves a comment, shortlists or marks as winner.

**Layout:** Full-page with header, split body (code left, sidebar right).

#### Header bar
- Padding 14px 24px, border-bottom `1px solid #e2e6ed`
- Left: "← Back to list" (`#64748b`) | separator | Student name (14px, 600, `#162233`) | Confirmation code (12px JetBrains Mono, `#94a3b8`) | Submitted date (12px, `#94a3b8`)
- Right: "Shortlisted" toggle (amber style: `#fffbeb` bg, `1px solid #fde68a` border, star + text) + "Mark as winner" button (`#162233` bg, white, 13px 500)

#### Left — Read-only code view + output
- Same dark editor styling as student workspace (see Screen 3)
- Editor is **read-only** — no cursor, no editing
- Run button only (no Submit)
- Output panel below (same structure as student workspace output)

#### Right sidebar — 300px
- Border-left `1px solid #e2e6ed`, padding 20px
- "Teacher comment" label (10px, uppercase, `#94a3b8`)
- `<textarea>`: full-width, 130px height, resize vertical, 13px system-ui, `#162233`, `1px solid #d1d5db`, radius 4px
- "Save comment" button: `#2558d4`, white, 13px 500

---

### Screen 5b — Winner Confirmation Dialog

**Purpose:** Confirmation step before marking a winner. Prevents accidental trigger.

**Layout:** Small modal, max-width ~420px, padding 32px. White, shadow, border.

- Heading: "Confirm winner", 17px, 600, `#162233`
- Body: 14px, `#64748b`, student name bolded in `#162233`
- Buttons (flex, justify-end, gap 10px):
  - Cancel: white bg, `1px solid #d1d5db`, `#475569` text
  - "Confirm winner": `#162233` bg, white text

---

### Screen 6 — Teacher: Create Competition

**Purpose:** Form to set up a new competition — name, deadline, problem statement, PDF rules, number of access codes.

**Layout:** Full-page with breadcrumb header, single-column form, max-width ~700px.

#### Header
- Breadcrumb: "← Dashboard | New competition" (same style as submission detail header)

#### Form fields
All labels: 12px, 500, `#475569`, margin-bottom 8px.
All inputs: padding 10px 14px, border `1px solid #d1d5db`, radius 4px, 14px system-ui, `#162233`.

1. **Competition name** — text input, full-width, placeholder "e.g. The Fibonacci Cipher"
2. **Deadline** — flex row: date input (flex:1) + time input (140px fixed), gap 10px
3. **Problem statement** — rich text editor with minimal toolbar (B, I, `<>`, H1, H2, • List). Toolbar: `#f7f8fa` bg, `1px solid #e2e6ed` border-bottom, buttons padding 4px 8px. Body: min-height 140px, 14px, line-height 1.65.
4. **Rules document (PDF)** — drag-and-drop zone: `2px dashed #d1d5db`, radius 4px, text-align centre, upload icon SVG, "Click to upload or drag and drop" (13px, `#64748b`), "PDF · max 10 MB" (11px, `#94a3b8`)
5. **Student access codes** — inline: "Generate [number input, width 72px, centred] unique codes". Helper text: 12px, `#94a3b8`.

#### Action buttons
- Border-top `1px solid #e2e6ed`, padding-top 20px, flex row, gap 10px
- "Preview": `#f7f8fa` bg, `#d1d5db` border, `#475569` text, 13px 500
- "Publish competition": `#2558d4` bg, white, 14px 500, padding 10px 26px

---

## Interactions & Behaviour

### Student flow
1. Landing → click "Enter competition code" → Student Login screen
2. Student Login → enter code → Continue → Student Workspace (replace; no back)
3. Workspace → Run → output populates in Output panel
4. Workspace → Submit → Submission modal appears (permanent, no dismiss)

### Teacher flow
1. Teacher login link → separate login page (standard username/password, not designed here)
2. Dashboard → click row → Submission Detail
3. Submission Detail → "Mark as winner" → Winner confirmation dialog → confirm → row updates, button disabled
4. Dashboard → "+ New competition" → Create Competition form
5. Create Competition → "Preview" → modal preview of landing page; "Publish" → activates competition and generates codes

### Countdown timer
- JavaScript `setInterval` updating every second
- Displays DD:HH:MM:SS or HH:MM:SS depending on remaining time
- When expired: show "Competition closed" in place of countdown; disable student entry

### Pulse animation
```css
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
```

### Problem panel collapse
- Toggle class on split container to set problem pane width: 380px (expanded) ↔ 40px (collapsed)
- Collapsed state shows rotated "PROBLEM" label and expand chevron

---

## State Management

### Student workspace
- `problemCollapsed: boolean`
- `language: string` (Python 3 | JavaScript | etc.)
- `code: string` — persist to `localStorage` keyed by access code
- `outputTab: 'output' | 'testcases'`
- `runOutput: { stdout: string[], exitCode: number, duration: number, testResults: TestResult[] } | null`
- `submitted: boolean`
- `submissionCode: string | null`

### Teacher dashboard
- `submissions: Submission[]`
- `filter: 'all' | 'shortlisted' | 'winner'`
- `sort: 'newest' | 'oldest'`
- `selectedSubmissionId: string | null`
- `confirmingWinner: boolean`

### Submission detail
- `comment: string`
- `commentSaved: boolean`
- `shortlisted: boolean`
- `winner: boolean`
- `runOutput: RunOutput | null`

---

## API Shape (suggested)
```
POST /api/auth/student        { code } → { studentName, competitionId, token }
GET  /api/competition/active  → { id, name, description, deadline, problemHtml, testCases[] }
POST /api/run                 { code, language } → { stdout, stderr, exitCode, duration, testResults[] }
POST /api/submit              { code, language } → { confirmationCode, submittedAt }

GET  /api/teacher/submissions → Submission[]
GET  /api/teacher/submissions/:id → Submission + code
PATCH /api/teacher/submissions/:id { shortlisted?, winner?, comment? }
POST /api/competitions        → create new competition
```

---

## Assets
- No image assets. All icons are inline SVG.
- JetBrains Mono: `https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap`
- Logo mark: `</>` text in JetBrains Mono bold, white on `#162233` square, radius 4px

---

## Files
- `Competition Platform.dc.html` — full design reference, all 8 screens/states on a pannable canvas (pan with mouse drag)
- `support.js` — design system runtime (not production code, disregard)
