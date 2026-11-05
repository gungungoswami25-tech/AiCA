# CLAUDE.md — AI Code Evolution Lab Coding Standards & Guidelines

This document provides system directives for Claude Code and AI pair programmers working on this repository.

## Commands
- **Install dependencies:** `pnpm install`
- **Build all packages:** `pnpm build`
- **Run tests:** `pnpm test`
- **Start frontend dev:** `pnpm --filter @aica/web dev` (http://localhost:5173)
- **Start API gateway dev:** `pnpm --filter @aica/api dev` (http://localhost:5000)
- **Start worker daemon:** `pnpm --filter @aica/worker dev`
- **Build shared types:** `pnpm --filter @aica/shared build`

## Git Discipline — STRICT RULES
- **NEVER push directly to `main` (`git push origin main` is prohibited).**
- Always create a dedicated feature branch: `git checkout -b feat/<module>-<feature>`
- Use Conventional Commits (`feat(...)`, `fix(...)`, `docs(...)`, `test(...)`).
- Verify `pnpm build && pnpm test` before any commit.
- Open a Pull Request on GitHub for merging into `main`.

## Code Style & Architecture Expectations
- **Human-Quality Engineering:** Write clean, modular, and idiomatic TypeScript. Avoid boilerplate AI filler comments, empty TODOs, or monolithic spaghetti functions.
- **Strict Typing:** No `any`. Use domain interfaces and Zod schemas from `@aica/shared`.
- **Architectural Isolation:**
  - `apps/web` (React SPA) must never import internal backend code.
  - All shared models, status enums, and API contracts reside in `packages/shared`.
  - Rebuild `@aica/shared` after modifying types: `pnpm --filter @aica/shared build`.
- **Error Handling:** Use `createSuccessResponse()` and `createErrorResponse()` from `@aica/shared`.
- **UI Aesthetics:** Dark theme (`bg-slate-950`, `border-slate-800`), Lucide icons, responsive layout.
