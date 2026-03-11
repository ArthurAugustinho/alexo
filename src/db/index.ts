import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./schema";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Neon/remote PG needs TLS; local connections can rely on defaults.
  ssl: process.env.DATABASE_URL?.includes("localhost")
    ? undefined
    : { rejectUnauthorized: false },
});

export const db = drizzle(pool, { schema });

// Re-export the schema to keep `@/db` usable as a single entry point if needed.
export * from "./schema";
