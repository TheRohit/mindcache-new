/**
 * Run this script once to create the better-auth tables in Neon.
 * Requires DATABASE_URL to be set in .env.local
 *
 * Usage: bun scripts/migrate.ts
 */

import { getMigrations } from "better-auth/db";
import { auth } from "../lib/auth";

const { toBeCreated, toBeAdded, runMigrations } = await getMigrations(
  auth.options
);

if (toBeCreated.length === 0 && toBeAdded.length === 0) {
  console.log("✓ Database schema is already up to date.");
  process.exit(0);
}

if (toBeCreated.length > 0) {
  console.log(
    "Tables to create:",
    toBeCreated.map((t) => t.table)
  );
}
if (toBeAdded.length > 0) {
  console.log(
    "Columns to add:",
    toBeAdded.map((t) => t.table)
  );
}

await runMigrations();
console.log("✓ Migrations applied successfully.");
