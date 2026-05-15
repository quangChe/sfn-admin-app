import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import type { NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

type Db = NeonHttpDatabase<typeof schema>;

let _db: Db | undefined;

// Lazy-init: neon() throws if DATABASE_URL is undefined, so we defer
// connection creation until the first query — not at module evaluation time.
// This allows `next build` to succeed before DATABASE_URL is configured.
function createDb(): Db {
  if (!_db) {
    _db = drizzle(neon(process.env.DATABASE_URL!), { schema });
  }
  return _db;
}

export const db: Db = new Proxy({} as Db, {
  get(_, prop: string | symbol) {
    return createDb()[prop as keyof Db];
  },
});
