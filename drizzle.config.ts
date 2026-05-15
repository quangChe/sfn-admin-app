import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";

// Load .env.local for local dev; in CI env vars are injected directly.
config({ path: ".env.local", quiet: true });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set. Add it to .env.local or your CI environment.");
}

// drizzle-kit runs in Node, not the Edge runtime — supply a WebSocket constructor
// so @neondatabase/serverless can open a connection.
neonConfig.webSocketConstructor = ws;

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/lib/db/schema/*",
  out: "./drizzle/migrations",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
