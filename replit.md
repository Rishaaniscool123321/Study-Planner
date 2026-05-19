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

- **Auth** — Replit Auth (OIDC) gates all pages. Per-user data isolation enforced at every layer: `subjects`, `tasks`, `study_sessions`, and `passwords` all have a `userId varchar NOT NULL` FK to `users.id` (ON DELETE CASCADE) with a per-user index, and every API route requires auth + scopes SELECT/UPDATE/DELETE by `req.user.id`. Task/session writes also verify the referenced `subjectId` belongs to the requesting user.
- **Dashboard** — fully customisable widget layout. Toggle individual widgets (stats cards, today's goal, weekly mini-chart, today's sessions, up next, quick timer) on/off in Customize. The Quick Timer widget is its own component so 1-second timer ticks don't re-render the rest of the page.
- **Tasks** — full CRUD with priority levels (low/medium/high), due dates, subject assignment, filters
- **Subjects** — dedicated `/subjects` page (separate from Settings) with full CRUD, colour picker (presets + custom), per-user list. Sidebar nav link with BookOpen icon.
- **Schedule** — weekly calendar view with study sessions blocked by subject colour, sorted by start time, with per-day total minutes. "Today" button + prev/next week navigation. iCal support: upload `.ics` files, import from any iCalendar URL (Google/Apple/Outlook/Canvas/Notion, `webcal://` accepted), and export your whole schedule as `.ics`. Imports dedupe by `(userId, externalUid)` so re-importing the same calendar updates events in place. RRULE recurrence is expanded for the next 90 days using `ical.js`.
- **Timer** — Pomodoro/focus timer with circular progress, session auto-logging, subject selector. While running it syncs `document.title` to a live countdown (e.g. `⏱ 24:30 · Focus`). On completion it plays a 3-tone WebAudio chime and shows a browser Notification (with permission requested on first start). Sound + notifications can be toggled in Customize.
- **Progress** — Today's-goal progress card and four summary cards (Completion rate, Total study time, Current streak, Overdue tasks) are now click-to-expand: each opens an inline detail panel (today's sessions, by-priority breakdown, today/7d/all-time tiles, last-7-day mini-bars, overdue task list). Plus a 14-day Recharts bar chart of study minutes, 12-week heatmap (84 cells coloured by minutes vs daily goal, today is ringed), streak section, per-subject breakdown.
- **Customize** — Quick-Preset cards (Default / Focus / Cozy / Hacker / Pastel) apply a full theme + layout in one click. Below them, accordion sections for Appearance (light/dark + 46+ themes filterable by mode and category), Look & feel (font, text size, corner radius, density, reduce motion), Layout (sidebar position/size), Daily study goal (slider 15–240 min), Dashboard widgets (toggle list), Timer notifications (sound + browser pop-ups). Custom theme creator picks 3 colours and auto-derives text/card/border (Advanced toggle exposes the rest). All state persisted to `localStorage`.
- **Passwords** — per-user encrypted password vault. AES-256-GCM at rest using `SESSION_SECRET`-derived key. Stores name, website, username, password, optional 2FA TOTP secret. Password and TOTP secret only revealed on explicit click. Live TOTP code generation in the UI
- **Study AI** — floating chat assistant (default name "Study AI", renameable in Customize, can be disabled). Powered by Google Gemini 2.5 Flash via the Replit AI Integrations proxy (no user-supplied API key). Chats about study topics with simple guardrails ("study-only" system prompt, no homework answers) and can apply customisations via natural language. The model emits `ACTION:` JSON lines that the server parses against a strict Zod discriminated-union schema (`applyPreset`, `setColorTheme`, `setMode`, `setDailyGoal`, `setFont`, `setDensity`, `setRadius`, `setSidebarPosition`, `toggleWidget`, `setTimerSound`, `setTimerNotifications`); unknown actions are dropped, max 6 actions per reply. User-supplied prompt-context fields (assistant name, theme IDs) are constrained to safe character sets to prevent prompt injection. Chat history is client-side only (`localStorage`, last 30 messages, shape-validated on load). Closeable via Escape key.

## Client-side state (localStorage via `theme-provider.tsx`)

- `app-color-theme`, `app-theme` (light/dark/system), `app-font`, `app-font-scale`, `app-radius`, `app-density`, `app-sidebar-position`, `app-sidebar-size`, `app-reduce-motion`
- `app-daily-goal-minutes` (default 60)
- `app-dashboard-widgets` — `{stats, goal, weekly, schedule, upNext, timer}` booleans
- `app-timer-sound`, `app-timer-notifications`
- `app-custom-themes` — user-defined themes
- `study-planner-ai-name` (default "Study AI"), `study-planner-ai-enabled` (default true), `study-planner-ai-chat-history`

## Database Schema (additions)

- `subjects` — userId (FK, indexed), name, color, icon, createdAt
- `tasks` — userId (FK, indexed), title, description, subjectId, priority, dueDate, completed, createdAt, updatedAt
- `study_sessions` — userId (FK, indexed), subjectId, date, startTime, endTime, durationMinutes, sessionType, notes, externalUid, sourceUrl, createdAt (index on userId+externalUid for iCal dedupe)
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
- `POST /sessions/import-ical` — import sessions from inline .ics payload (dedupes via externalUid)
- `POST /sessions/import-ical-url` — fetch + import from iCalendar URL (http/https/webcal)
- `GET /sessions/export.ics` — download user's sessions as iCalendar feed
- `GET /stats/summary` — overall progress summary
- `GET /stats/streak` — study streak info
- `GET /stats/by-subject` — per-subject completion stats

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
