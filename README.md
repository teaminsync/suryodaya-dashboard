# Suryodaya Ops Dashboard

Operations dashboard for Suryodaya Packers & Movers enquiries. Built with Next.js 16, App Router, Tailwind 4, and shadcn/base-ui.

## Architecture

This dashboard is **read-only** for the Postgres database. All writes (new enquiries, messages, captures, state changes) go through the Express project's internal API, authenticated with a shared secret.

The dashboard provides:
- Enquiry inbox with search, filtering, and activity tracking
- Real-time conversation view with AI/human takeover controls
- Move estimation and photo/video capture review grouped by room
- Contact history and outreach status
- Instagram and WhatsApp lead support
- Upcoming surveys page with booked survey times and calendar status

## Environment Variables

Create a `.env.local` file (see `.env.local.example` for reference) with:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` - Supabase anon/public key
- `SUPABASE_SECRET_KEY` - Supabase service role key (server-side only)
- `SUPABASE_STORAGE_BUCKET` - Storage bucket name (defaults to "move-media")
- `DATABASE_URL` - Postgres connection string (read-only access)
- `EXPRESS_INTERNAL_API_URL` - Express server base URL for internal API
- `INTERNAL_API_SECRET` - Shared secret for authenticating internal API calls

## Getting Started

Install dependencies:
```bash
npm install
```

Run the development server:
```bash
npm run dev
```

Open [http://localhost:3001](http://localhost:3001). The dashboard runs on port 3001 (the Express server uses port 3000). When running locally, set `DASHBOARD_BASE_URL=http://localhost:3001` in the Express `.env` file.

## Build and Test

Build for production:
```bash
npm run build
```

Run tests:
```bash
npm test
```

Run linter:
```bash
npm run lint
```

## Project Structure

- `app/` - Next.js App Router pages and API routes
  - `(dashboard)/` - Main dashboard pages (inbox, lead detail)
  - `api/leads/[id]/` - API endpoints for lead actions (send-message, takeover, outreach)
  - `login/` - Authentication page
- `components/` - React components (chat panel, capture groups, outreach panel, badges)
- `lib/` - Pure helper modules and database queries
  - `queries.ts` - Read-only Postgres queries
  - `internal-api.ts` - Express API client functions
  - `storage.ts` - Supabase Storage signed URL generation
  - `contact-label.ts`, `captures.ts`, `inbox.ts`, `origin.ts` - Pure business logic
- `utils/supabase/` - Supabase client creation (server and client)

## Authentication

The single admin user is created directly in Supabase (no signup page in this app). Use the Supabase dashboard or CLI to manage users.

## Notes

- The Express project must be running for writes to work (messages, takeover, outreach actions).
- Media captures (photos/videos) are stored in Supabase Storage; signed URLs are generated server-side with a 600-second (10-minute) expiry.
- Real-time message updates use Supabase Realtime subscriptions.
- Tests use Node's built-in test runner (`tsx --test`) for pure helper modules only.

