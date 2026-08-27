import postgres from "postgres";

// Read-only - this app never writes to Postgres directly. All writes go
// through the Express app's internal API, so there's a single source of
// truth for mutations. See lib/internal-api.ts.
const sql = postgres(process.env.DATABASE_URL!, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

export default sql;
