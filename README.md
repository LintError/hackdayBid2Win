# Hack Day Competition Platform — Prototype

A responsive Next.js + TypeScript prototype for a one-day hack-day competition: timed quiz, Bug Hunt submissions, organizer controls, leaderboard, projector display, and prize tracking.

## What works in this prototype

- Demo participant join flow (demo name is stored in browser local storage)
- Quiz interface with multiple-choice questions, a countdown, answer locking, and demo scoring
- Bug Hunt challenge brief and submission receipt
- Live-ish leaderboard using shared browser storage within the same browser profile
- Organizer dashboard with demo round controls, participant counts, and prize inventory
- Projector display with large type and read-only standings
- Responsive layout and keyboard-friendly controls
- Supabase client setup scaffold and SQL schema starter

## Important prototype limitations

This is a **frontend prototype**, not production-ready competition infrastructure. The demo uses browser local storage and seeded data. It does not provide secure cross-device synchronization, server-authoritative timing/scoring, real authentication, Row Level Security, or durable multi-user submissions until the Supabase backend is implemented and tested. Do not use local demo scores to determine real prize winners.

## Run locally

Requirements: Node.js 20+ recommended.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000.

On Windows PowerShell, use:

```powershell
Copy-Item .env.example .env.local
npm install
npm run dev
```

Supabase environment variables are optional for the visual demo. The app uses demo mode when credentials are missing.

## Routes

- `/` — public landing page
- `/join` — participant join
- `/quiz` — quiz demo
- `/bug-hunt` — Bug Hunt demo
- `/leaderboard` — live-ish leaderboard
- `/admin` — organizer controls and prize tracking
- `/display` — projector display

## Supabase integration path

1. Create a Supabase project.
2. Apply `supabase/schema.sql` in the SQL editor or convert it into reviewed migrations.
3. Implement Supabase Auth and invite-only organizer/judge roles.
4. Add server-side answer/submission handlers with schema validation, deadlines, idempotency, and audit logging.
5. Enable RLS and add policies before exposing any table to the client.
6. Replace demo storage with server-backed queries and realtime updates.
7. Add a separate disposable sandbox service if automated execution of submitted code is required.

Do not expose `SUPABASE_SERVICE_ROLE_KEY` to the browser. Never execute untrusted submissions inside the Next.js process.

## Suggested first production milestone

- Supabase Auth and role enforcement
- Event and participant registration
- Atomic server-side quiz answer acceptance/scoring
- Bug Hunt submission storage and judge workflow
- Public-safe leaderboard view
- RLS/security tests and rehearsal under expected load
