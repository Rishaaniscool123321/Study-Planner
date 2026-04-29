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
- **Dashboard** — fully customisable widget layout. Toggle individual widgets (stats cards, today's goal, weekly mini-chart, today's sessions, up next, quick timer) on/off in Customize. The Quick Timer widget is its own component so 1-second timer ticks don't re-render the rest of the page.
- **Tasks** — full CRUD with priority levels (low/medium/high), due dates, subject assignment, filters
- **Schedule** — weekly calendar view with study sessions blocked by subject colour
- **Timer** — Pomodoro/focus timer with circular progress, session auto-logging, subject selector. While running it syncs `document.title` to a live countdown (e.g. `⏱ 24:30 · Focus`). On completion it plays a 3-tone WebAudio chime and shows a browser Notification (with permission requested on first start). Sound + notifications can be toggled in Customize.
- **Progress** — Today's-goal progress card, summary cards, 14-day Recharts bar chart of study minutes, 12-week heatmap (84 cells coloured by minutes vs daily goal, today is ringed), streak section, per-subject breakdown.
- **Customize** — Quick-Preset cards (Default / Focus / Cozy / Hacker / Pastel) apply a full theme + layout in one click. Below them, accordion sections for Appearance (light/dark + 46+ themes filterable by mode and category), Look & feel (font, text size, corner radius, density, reduce motion), Layout (sidebar position/size), Daily study goal (slider 15–240 min), Dashboard widgets (toggle list), Timer notifications (sound + browser pop-ups). Custom theme creator picks 3 colours and auto-derives text/card/border (Advanced toggle exposes the rest). All state persisted to `localStorage`.
- **Passwords** — per-user encrypted password vault. AES-256-GCM at rest using `SESSION_SECRET`-derived key. Stores name, website, username, password, optional 2FA TOTP secret. Password and TOTP secret only revealed on explicit click. Live TOTP code generation in the UI

## Client-side state (localStorage via `theme-provider.tsx`)

- `app-color-theme`, `app-theme` (light/dark/system), `app-font`, `app-font-scale`, `app-radius`, `app-density`, `app-sidebar-position`, `app-sidebar-size`, `app-reduce-motion`
- `app-daily-goal-minutes` (default 60)
- `app-dashboard-widgets` — `{stats, goal, weekly, schedule, upNext, timer}` booleans
- `app-timer-sound`, `app-timer-notifications`
- `app-custom-themes` — user-defined themes

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
