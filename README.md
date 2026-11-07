# Suryodaya Ops Dashboard (Next.js)

The operator-facing dashboard for the Suryodaya Packers & Movers demo (a **fictional** company). A single admin signs in to see enquiries from WhatsApp, Instagram and IndiaMART, read live conversations, review photo estimates, manage surveys, control follow-ups and change survey scheduling.

It pairs with the Express backend in [`suryodaya-packers-movers-demo`](../suryodaya-packers-movers-demo). **The dashboard never writes to the database itself**: every change goes through the backend's internal API. Read [ARCHITECTURE.md](ARCHITECTURE.md) first if you are changing anything.

> **Status (4 November 2026):** dashboard `df6cb88`, paired with Express `85a6e03`. 204 unit tests at the last run.

Stack: Next.js 16 (App Router, Turbopack), React 19, Tailwind 4, base-ui based shadcn components, Supabase Auth and Realtime, the `postgres` library for server-side reads, tests with `tsx --test`.

## Quick start

Prerequisites: Node 22, the Express backend running on port 3000, the same Supabase project, and one admin user created in Supabase Auth (there is **no sign-up page**; keep sign-ups disabled in Supabase).

```powershell
npm install
copy .env.local.example .env.local   # then fill in the values
npm run dev                          # next dev -p 3001
```

Open `http://localhost:3001` and sign in with the admin user.

## Configuration (`.env.local`)

| Variable | Meaning |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (used in the browser for sign-in and Realtime). |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase public (publishable) key. |
| `DATABASE_URL` | Postgres connection string for **server-side reads** only. |
| `SUPABASE_SECRET_KEY` | Server-side key used to sign media URLs. Never expose it to the browser. |
| `SUPABASE_STORAGE_BUCKET` | Bucket holding customer photos and videos (default `move-media`). |
| `EXPRESS_INTERNAL_API_URL` | Base URL of the backend (default `http://localhost:3000`). |
| `INTERNAL_API_SECRET` | Shared secret sent as `X-Internal-Secret`. Must equal the backend's value. |

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Development server on port 3001. |
| `npm run build` / `npm start` | Production build and server on port 3001. |
| `npm run lint` | ESLint; keep it at zero warnings. |
| `npm test` | Unit tests for the pure `lib/` logic (`tsx --test "lib/**/*.test.ts"`). |

Run, in this order, before committing: `npm test`, `npm run lint`, then `npm run build` last.

## Pages

| Route | What it shows |
|---|---|
| `/` | **Enquiries** inbox with filters (source, status, awaiting reply, escalated) and search. |
| `/leads/[id]` | One enquiry: contact, enquiries for the same contact, Follow-up outreach and consent history, delivery problems, **Automated messages**, live conversation with a send box and a Human Takeover switch, captures grouped by room, Move Estimate, Survey, Admin alerts, touchpoints. |
| `/surveys` | Upcoming surveys grouped by day with calendar status. |
| `/settings` | **Survey settings** (days, hours, lunch break, survey length, buffer, step, concurrency, notice, horizon, holidays) and the **Instagram connection** card. |
| `/login` | Sign-in. |

A header banner appears on every page when the Instagram token is close to expiry.

## Repository map

```
app/
  (dashboard)/             layout (nav, banner), inbox, leads/[id], surveys, settings
  api/                     route handlers that proxy writes to Express (Origin + auth checked)
  login/
components/                UI cards and client panels (chat, outreach, automation, settings form...)
components/ui/             base-ui shadcn primitives
lib/                       pure logic and tests; queries.ts (reads), internal-api.ts (Express calls)
utils/supabase/            Supabase clients and the session proxy
proxy.ts                   Next 16 request proxy: refreshes the Supabase session
```

## Working agreements

- **Writes only through Express.** New write features need a backend `/internal` route first, then a dashboard route handler that checks the Origin (`isAllowedOrigin`), the signed-in user, validates the body and forwards with the secret.
- **Keep logic out of components.** Put formatting, labels and validation in `lib/` with a `node:test` file; the components stay thin.
- **Schema changes belong to the backend.** If you add a table the dashboard reads, the backend's `initSchema()` must create it and lock it down.
- `AGENTS.md` carries Next.js 16 guidance for coding agents. `next dev` may re-add a block to it; do not commit that accidental change.

## Known limits

- No component or browser tests; only the pure `lib/` logic is tested.
- Chat updates arrive through Supabase Realtime on message inserts; other cards update on refresh or after an action.
- The Instagram token card and header banner depend on the backend being reachable; if it is not, they hide quietly.
- Delivery problems are shown per recipient number, not per message.
- A single admin user only; there is no role model.
- Dates are shown in India time by design.
