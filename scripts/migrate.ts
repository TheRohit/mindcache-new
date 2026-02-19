/**
 * Run this script once to create the better-auth tables in Neon.
 * Requires DATABASE_URL to be set in .env.local
 *
 * Usage: bun scripts/migrate.ts
 */

import { getMigrations } from "better-auth/db";
import { auth } from "../lib/auth";
import { db } from "../lib/db";
import { sql } from "drizzle-orm";

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
await db.execute(sql`CREATE EXTENSION IF NOT EXISTS vector`);
await db.execute(sql`
  CREATE TYPE IF NOT EXISTS content_type AS ENUM ('note', 'website', 'youtube', 'tweet');
`);
await db.execute(sql`
  CREATE TYPE IF NOT EXISTS ingest_status AS ENUM ('processing', 'ready', 'failed');
`);
await db.execute(sql`
  CREATE TABLE IF NOT EXISTS content (
    id text PRIMARY KEY,
    "userId" text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    type content_type NOT NULL,
    "sourceId" text,
    "sourceUrl" text,
    "canonicalUrl" text,
    "siteName" text,
    author text,
    "publishedAt" timestamp with time zone,
    "thumbnailUrl" text,
    "faviconUrl" text,
    title text,
    description text,
    body text NOT NULL,
    "rawMetadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
    embedding vector(128) NOT NULL,
    "embeddingModel" text NOT NULL DEFAULT 'local-hash-v1',
    "ingestStatus" ingest_status NOT NULL DEFAULT 'ready',
    "lastError" text,
    "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
    "updatedAt" timestamp with time zone NOT NULL DEFAULT now()
  );
`);
await db.execute(sql`CREATE INDEX IF NOT EXISTS content_user_idx ON content ("userId")`);
await db.execute(
  sql`CREATE INDEX IF NOT EXISTS content_user_created_idx ON content ("userId", "createdAt")`,
);
await db.execute(sql`CREATE INDEX IF NOT EXISTS content_user_type_idx ON content ("userId", type)`);
await db.execute(
  sql`CREATE INDEX IF NOT EXISTS content_embedding_idx ON content USING ivfflat (embedding vector_cosine_ops)`,
);

console.log("✓ Migrations applied successfully.");
