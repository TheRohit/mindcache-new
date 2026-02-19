/**
 * Ensures required Postgres extensions exist before schema sync.
 * Requires DATABASE_URL from .env.local
 */
import { sql } from "drizzle-orm";
import { db } from "../lib/db";

await db.execute(sql`CREATE EXTENSION IF NOT EXISTS vector`);
console.log("✓ Ensured pgvector extension.");

