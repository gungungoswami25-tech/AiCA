# AiCA (AI Code Evolution Lab) — Hackathon Jury Demo Runbook

> **Platform:** AI Code Evolution Lab (`AiCA`)  
> **Core Innovation:** Evolutionary Code Evaluation, Deterministic Sandboxing & Pedagogical AI Diagnostics  
> **Target Audience:** Hackathon Jury, Evaluators & Technical Reviewers  
> **Revision:** 2.0.0 (Production Ready)  

---

## 1. Quickstart (Under 60 Seconds)

Ensure Docker services (PostgreSQL, MongoDB, Redis, Judge0) are running, or run the app in development mode with seeded offline fallbacks:

```bash
# 1. Install dependencies across all monorepo workspaces
pnpm install

# 2. Seed database with 5 curriculum problems, users & evolutionary history
pnpm seed

# 3. Launch the full platform (Vite Web SPA + Express REST API + BullMQ Worker)
pnpm dev
```

The web application will be live at: **`http://localhost:5173`**  
The API gateway will be live at: **`http://localhost:5000`**

---

## 2. Pre-Configured Demo Accounts

| Role | Email | Password | Pre-seeded Persona |
|---|---|---|---|
| **Student** | `student@aica.lab` | `DemoUser123!` | `algo_student` (5-day streak, 1 problem solved, 3 submissions) |
| **Admin** | `admin@aica.lab` | `AdminSecret123!` | `lab_admin` (Full curriculum authoring & test-case inspection) |

*(Competitive leaderboard personas `ada_lovelace`, `alan_turing`, and `grace_hopper` are also pre-seeded into standings).*

---

## 3. 5-Minute Scripted Live Demo Walkthrough

### Act 1: Problem Catalog & Dynamic Solved Badges (`/problems`)
1. Log in as **Student** (`student@aica.lab` / `DemoUser123!`).
2. Navigate to **Problems** in the top navigation bar.
3. Observe the **5 Classic Published Problems**:
   - `Two Sum Optimal` (Easy — Arrays, Hash-Table) $\to$ Marked with a **`SOLVED`** green checkmark badge.
   - `Longest Substring Without Repeating Characters` (Medium — Strings, Sliding-Window)
   - `Container With Most Water` (Medium — Arrays, Two-Pointers)
   - `Valid Parentheses` (Easy — Stack, Strings)
   - `Binary Search Optimal` (Easy — Binary-Search, Divide-and-Conquer)
4. Demonstrate filtering by difficulty (Easy, Medium) and searching by problem tags.

---

### Act 2: Monaco Workspace & Custom Run Sandbox (`/workspace/two-sum-optimal`)
1. Click on **Two Sum Optimal**.
2. Point out the pedagogical layout:
   - Left pane: Markdown problem description, constraints, and formatted I/O examples.
   - Right pane: High-performance **Monaco Code Editor** with multi-language boilerplate (Python, JavaScript, C++, Java).
3. **Run Custom Code (Ephemeral Sandbox):**
   - Click the **Custom Input** tab in the console.
   - Enter custom stdin:
     ```text
     4
     2 7 11 15
     9
     ```
   - Click **Run Code**.
   - Observe the instantaneous **`EXECUTED`** verdict badge (proving that Custom Run never produces an official `ACCEPTED` verdict, creates zero database clutter, and consumes zero AI tokens).

---

### Act 3: Deterministic Judging & Dual AI Diagnostics
1. Switch to the **Submissions** tab in the lower panel.
2. Review the pre-seeded evolutionary history:
   - **Submission 1 (Brute-Force):** 82ms runtime, `ACCEPTED`. Click to view the **Mode A (Optimization)** report recommending an $O(N)$ hash-table transformation.
   - **Submission 2 (Buggy Solution):** `WRONG_ANSWER`. Click to view the **Mode B (Diagnostic)** report highlighting the duplicate element edge-case trap without leaking the raw hidden test case.
   - **Submission 3 (Optimal Solution):** 14ms runtime, `ACCEPTED`, 98.2 composite score.
3. **Submit Code Live:**
   - Type or modify the Python solution.
   - Click **Submit Code**.
   - Show how the state machine transitions: `QUEUED` $\to$ `COMPILING` $\to$ `EXECUTING` $\to$ `ANALYZING_AI` $\to$ `COMPLETED`.
   - **Fault-Tolerant Isolation Invariant:** Point out that deterministic verification happens before AI analysis. Even if Gemini experiences a rate limit or timeout, the student's `ACCEPTED` verdict is locked and never lost.

---

### Act 4: Evolutionary Solution Comparison (`Compare Solutions` Tab)
1. In the Submissions list, select **Submission 1** ($O(N^2)$ brute-force) and **Submission 3** ($O(N)$ optimal) using the checkboxes.
2. Click **"Compare Selected (2)"** (or click the 1-click **"Quick Compare"** button).
3. Switch to the **Compare Solutions** tab:
   - **Side-by-side Monaco DiffEditor:** Visual split diff comparing brute-force nested loops against the single-pass dictionary lookup.
   - **Delta Metrics Card:** Highlights the **-68ms (-82.9%)** runtime drop and memory trade-offs.
   - **AI Evolutionary Trade-Off Narrative:** Synthesizes why trading $O(N)$ space for $O(1)$ lookup time represents the optimal algorithmic leap.

---

### Act 5: Global Hall of Fame & Language-Normalized Scoring (`/leaderboard`)
1. Navigate to **Leaderboard** in the top navigation bar.
2. Toggle between:
   - **Global Platform Standings:** Ranks students platform-wide across distinct problems solved, cumulative score, average runtime, and activity streak (featuring Ada Lovelace, Alan Turing, Grace Hopper, and our student).
   - **Problem Leaderboard:** Shows the transparent logarithmic scoring breakdown for `Two Sum Optimal`:
     $$\text{Composite Score} = 0.50 \times S_{\text{time}} + 0.30 \times S_{\text{mem}} + 0.20 \times S_{\text{quality}}$$

---

## 4. Verification Suite & Monorepo Health Commands

To independently verify the complete platform health:

```bash
# Run all 11 automated test suites (114 passing tests)
pnpm test

# Verify Turbo build across all 5 workspace packages
pnpm turbo run build

# Run database seeder (safe & idempotent)
pnpm seed
```

---

## 5. Architectural Invariants Summary

1. **Zero Host Execution:** All code runs inside isolated Judge0 sandbox containers with Linux cgroups v2, no network access (`--net=none`), and non-root users.
2. **Hidden Test Confidentiality:** Student-facing APIs filter out and redact hidden test case outputs.
3. **AI Fault Tolerance:** Gemini failures, rate limits, or timeouts never alter or fail a deterministic verdict.
4. **Custom Run Ephemeral Safety:** `POST /api/v1/submissions/run` never writes to MongoDB, never updates leaderboards, and strictly returns `EXECUTED`.
5. **SSOT Data Separation:** PostgreSQL is the single source of truth for accounts and authentication; MongoDB is the single source of truth for curriculum, submissions, and evaluation reports.
