import { describe, expect, test } from "bun:test";
import { buildEmbedding } from "@/lib/embeddings";
import { EMBEDDING_DIMENSIONS } from "@/lib/search-config";

describe("buildEmbedding", () => {
  test("returns fixed dimensions", () => {
    const vector = buildEmbedding("MindCache semantic test");
    expect(vector.length).toBe(EMBEDDING_DIMENSIONS);
  });

  test("is deterministic", () => {
    const first = buildEmbedding("repeatable text");
    const second = buildEmbedding("repeatable text");
    expect(first).toEqual(second);
  });
});

