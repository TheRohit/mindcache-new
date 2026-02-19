import { sql } from "drizzle-orm";
import {
  customType,
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

// Better Auth tables — managed by better-auth, do not modify directly.
export * from "./auth-schema";

const vector = customType<{
  data: number[];
  driverData: string;
  config: { dimensions: number };
}>({
  dataType(config) {
    return `vector(${config?.dimensions ?? 128})`;
  },
  toDriver(value) {
    return `[${value.join(",")}]`;
  },
  fromDriver(value) {
    const trimmed = value.trim();
    const raw = trimmed.startsWith("[") && trimmed.endsWith("]")
      ? trimmed.slice(1, -1)
      : trimmed;
    if (!raw) return [];
    return raw.split(",").map((item) => Number(item.trim()));
  },
});

export const contentTypeEnum = pgEnum("content_type", [
  "note",
  "website",
  "youtube",
  "tweet",
]);

export const ingestStatusEnum = pgEnum("ingest_status", [
  "processing",
  "ready",
  "failed",
]);

export const content = pgTable(
  "content",
  {
    id: text("id").primaryKey(),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    type: contentTypeEnum("type").notNull(),
    sourceId: text("sourceId"),
    sourceUrl: text("sourceUrl"),
    canonicalUrl: text("canonicalUrl"),
    siteName: text("siteName"),
    author: text("author"),
    publishedAt: timestamp("publishedAt", { withTimezone: true }),
    thumbnailUrl: text("thumbnailUrl"),
    faviconUrl: text("faviconUrl"),
    title: text("title"),
    description: text("description"),
    body: text("body").notNull(),
    rawMetadata: jsonb("rawMetadata")
      .$type<Record<string, unknown>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    embedding: vector("embedding", { dimensions: 128 }).notNull(),
    embeddingModel: text("embeddingModel").notNull().default("local-hash-v1"),
    ingestStatus: ingestStatusEnum("ingestStatus").notNull().default("ready"),
    lastError: text("lastError"),
    createdAt: timestamp("createdAt", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updatedAt", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdx: index("content_user_idx").on(table.userId),
    userCreatedIdx: index("content_user_created_idx").on(table.userId, table.createdAt),
    userTypeIdx: index("content_user_type_idx").on(table.userId, table.type),
  }),
);
