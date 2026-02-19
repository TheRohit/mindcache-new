import { describe, expect, test } from "bun:test";
import { ingestContentSchema, searchMemoriesSchema } from "@/lib/validations";

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

