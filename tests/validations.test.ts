import { describe, expect, test } from "bun:test";
import { ingestContentSchema, searchMemoriesSchema } from "@/lib/validations";
import { buildSearchableText, toIntegratedRecord, toMemoryRecord } from "@/lib/pinecone";

describe("ingest content schema", () => {
  test("accepts a note payload", () => {
    const parsed = ingestContentSchema.parse({
      type: "note",
      body: "This is my note",
    });

    expect(parsed.type).toBe("note");
  });

  test("rejects website payload without URL", () => {
    expect(() =>
      ingestContentSchema.parse({
        type: "website",
      }),
    ).toThrow();
  });
});

describe("search schema", () => {
  test("parses defaults", () => {
    const parsed = searchMemoriesSchema.parse({
      query: "knowledge",
    });

    expect(parsed.limit).toBe(20);
  });
});

describe("pinecone serialization", () => {
  test("builds searchable text from title, description, and body", () => {
    const text = buildSearchableText({
      title: "AI Notes",
      description: "thoughts about embeddings",
      body: "tweet body content",
    });

    expect(text).toBe("AI Notes\nthoughts about embeddings\ntweet body content");
  });

  test("drops null metadata fields for pinecone", () => {
    const record = toIntegratedRecord({
      id: "rec-1",
      type: "tweet",
      body: "hello world",
      sourceId: null,
      sourceUrl: "https://x.com/abc/status/1",
      canonicalUrl: null,
      siteName: "X",
      author: null,
      publishedAt: null,
      thumbnailUrl: null,
      faviconUrl: null,
      title: "Tweet",
      description: null,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
      text: "Tweet\nhello world",
    });

    expect(record._id).toBe("rec-1");
    expect(record.sourceUrl).toBe("https://x.com/abc/status/1");
    expect(record.siteName).toBe("X");
    expect("sourceId" in record).toBe(false);
    expect("author" in record).toBe(false);
    expect("description" in record).toBe(false);
  });

  test("maps fetched pinecone fields to memory record", () => {
    const row = toMemoryRecord("user-1", "rec-2", {
      type: "note",
      body: "hello",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T01:00:00.000Z",
      title: "My note",
    });

    expect(row.userId).toBe("user-1");
    expect(row.id).toBe("rec-2");
    expect(row.type).toBe("note");
    expect(row.title).toBe("My note");
    expect(row.createdAt.toISOString()).toBe("2026-01-01T00:00:00.000Z");
  });
});

