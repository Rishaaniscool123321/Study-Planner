# Study Planner

## Overview

A full-stack Study Planner web app built for the Distance Learning Vibe Coding Challenge. Helps online students organise their time, track tasks, and stay motivated.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (artifacts/study-planner)
- **API framework**: Express 5 (artifacts/api-server)
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **UI**: shadcn/ui + Tailwind + framer-motion
- **Routing**: wouter
- **Dark mode**: next-themes (manual ThemeProvider)

## Features

- **Auth** — Replit Auth (OIDC) gates all pages; per-user data isolation via `userId` column
- **Dashboard** — overview stats, streak counter, quick task list, quick timer
- **Tasks** — full CRUD with priority levels (low/medium/high), due dates, subject assignment, filters
- **Schedule** — weekly calendar view with study sessions blocked by subject colour
- **Timer** — Pomodoro/focus timer with circular progress, session auto-logging, subject selector
- **Progress** — completion stats, study time, streak tracker, per-subject breakdown
- **Customize** — 46+ built-in themes (classic / vibrant / nature / wild / terminal / editor / retro-game / medieval / tech) plus custom theme creator with HSL colour pickers; font picker, density, radius, sidebar position/size, motion toggle. State persisted to `localStorage`
- **Passwords** — per-user encrypted password vault. AES-256-GCM at rest using `SESSION_SECRET`-derived key. Stores name, website, username, password, optional 2FA TOTP secret. Password and TOTP secret only revealed on explicit click. Live TOTP code generation in the UI

## Database Schema (additions)

- `passwords` — userId (FK), name, website, username, encryptedPassword, encryptedTotpSecret, createdAt, updatedAt

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/study-planner run dev` — run frontend locally

## Database Schema

- `subjects` — name, color (hex), icon
- `tasks` — title, description, subjectId, priority (low/medium/high), dueDate, completed
- `study_sessions` — subjectId, date, startTime, endTime, durationMinutes, sessionType (pomodoro/regular/exam_prep), notes

## API Routes

All under `/api`:
- `GET/POST /tasks` — list/create tasks
- `GET/PATCH/DELETE /tasks/:id` — task CRUD
- `GET/POST /subjects` — list/create subjects
- `PATCH/DELETE /subjects/:id` — subject management
- `GET/POST /sessions` — list/create study sessions
- `PATCH/DELETE /sessions/:id` — session management
- `GET /stats/summary` — overall progress summary
- `GET /stats/streak` — study streak info
- `GET /stats/by-subject` — per-subject completion stats

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
