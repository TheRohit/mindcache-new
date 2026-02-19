import { and, desc, eq, getTableColumns, inArray, sql } from "drizzle-orm";
import { generateObject, generateText } from "ai";
import { z } from "zod";
import { db } from "./db";
import { aiModels, groqProviderOptions } from "./ai/models";
import { buildEmbedding } from "./embeddings";
import { extractTweetMetadata, extractWebsiteMetadata, extractYouTubeMetadata } from "./metadata";
import { SIMILARITY_THRESHOLD } from "./search-config";
import { content } from "./schema";
import type { SearchResultItem } from "./content-types";
import type {
  DeleteContentValues,
  IngestContentValues,
  SearchMemoriesValues,
  UpdateContentValues,
} from "./validations";

const metadataSchema = z.object({
  canonicalUrl: z.string().nullable(),
  siteName: z.string().nullable(),
  author: z.string().nullable(),
  publishedAt: z.string().nullable(),
  thumbnailUrl: z.string().nullable(),
  faviconUrl: z.string().nullable(),
  title: z.string().nullable(),
  description: z.string().nullable(),
});

const nowIso = () => new Date().toISOString();

async function normalizeMetadata(
  fallback: Record<string, unknown>,
  contentBody: string,
) {
  const startedAt = Date.now();
  try {
    const result = await generateObject({
      model: aiModels.extraction,
      providerOptions: { groq: groqProviderOptions },
      schema: metadataSchema,
      prompt: [
        "Normalize this extracted metadata for a memory card.",
        "Return only values that are confidently present.",
        `Body:\n${contentBody.slice(0, 2000)}`,
        `Fallback metadata:\n${JSON.stringify(fallback)}`,
      ].join("\n\n"),
    });
    console.info("ai.normalize.onFinish", {
      usage: result.usage,
      durationMs: Date.now() - startedAt,
    });

    return {
      ...fallback,
      ...result.object,
    };
  } catch (error) {
    console.error("ai.normalize.onError", error);
    return fallback;
  }
}

async function generateNoteTitle(body: string) {
  const startedAt = Date.now();
  try {
    const result = await generateText({
      model: aiModels.title,
      providerOptions: { groq: groqProviderOptions },
      prompt: `Generate a concise title (max 8 words) for this note:\n\n${body.slice(0, 2000)}`,
    });
    console.info("ai.title.onFinish", {
      usage: result.usage,
      durationMs: Date.now() - startedAt,
    });

    return result.text.trim().replace(/^["']|["']$/g, "").slice(0, 180);
  } catch (error) {
    console.error("ai.title.onError", error);
    return "Untitled Note";
  }
}

export async function ingestMemory(userId: string, input: IngestContentValues) {
  let body = "";
  let fallbackMetadata: Record<string, unknown> = {};

  if (input.type === "note") {
    const title = input.title?.trim() || (await generateNoteTitle(input.body));
    body = input.body.trim();
    fallbackMetadata = {
      title,
      description: body.slice(0, 180),
    };
  }

  if (input.type === "website") {
    const extracted = await extractWebsiteMetadata(input.url);
    body = extracted.body;
    fallbackMetadata = {
      ...extracted.metadata,
      title: input.title ?? extracted.metadata.title ?? null,
      description: input.description ?? extracted.metadata.description ?? null,
    };
  }

  if (input.type === "youtube") {
    const extracted = await extractYouTubeMetadata(input.url);
    body = extracted.body;
    fallbackMetadata = {
      ...extracted.metadata,
      title: input.title ?? extracted.metadata.title ?? null,
    };
  }

  if (input.type === "tweet") {
    const extracted = await extractTweetMetadata(input.url);
    body = input.body?.trim() || extracted.body;
    fallbackMetadata = {
      ...extracted.metadata,
    };
  }

  const normalized = await normalizeMetadata(fallbackMetadata, body);
  const embeddingInput = [
    String(normalized.title ?? ""),
    String(normalized.description ?? ""),
    body,
  ]
    .filter(Boolean)
    .join("\n");
  const embedding = buildEmbedding(embeddingInput);
  const id = crypto.randomUUID();
  const timestamp = nowIso();

  const [created] = await db
    .insert(content)
    .values({
      id,
      userId,
      type: input.type,
      sourceId: (normalized.sourceId as string | null | undefined) ?? null,
      sourceUrl: (normalized.sourceUrl as string | null | undefined) ?? null,
      canonicalUrl: (normalized.canonicalUrl as string | null | undefined) ?? null,
      siteName: (normalized.siteName as string | null | undefined) ?? null,
      author: (normalized.author as string | null | undefined) ?? null,
      publishedAt: normalized.publishedAt
        ? new Date(String(normalized.publishedAt))
        : null,
      thumbnailUrl: (normalized.thumbnailUrl as string | null | undefined) ?? null,
      faviconUrl: (normalized.faviconUrl as string | null | undefined) ?? null,
      title: (normalized.title as string | null | undefined) ?? null,
      description: (normalized.description as string | null | undefined) ?? null,
      body,
      rawMetadata: normalized,
      embedding,
      ingestStatus: "ready",
      updatedAt: new Date(timestamp),
    })
    .returning();

  return created;
}

export async function listMemories(userId: string) {
  const rows = await db
    .select()
    .from(content)
    .where(eq(content.userId, userId))
    .orderBy(desc(content.createdAt));

  return rows;
}

export async function updateMemory(userId: string, input: UpdateContentValues) {
  const updates: Partial<typeof content.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (input.title !== undefined) updates.title = input.title;
  if (input.description !== undefined) updates.description = input.description;
  if (input.thumbnailUrl !== undefined) updates.thumbnailUrl = input.thumbnailUrl ?? null;

  const [updated] = await db
    .update(content)
    .set(updates)
    .where(and(eq(content.id, input.id), eq(content.userId, userId)))
    .returning();

  return updated ?? null;
}

export async function deleteMemory(userId: string, input: DeleteContentValues) {
  const [deleted] = await db
    .delete(content)
    .where(and(eq(content.id, input.id), eq(content.userId, userId)))
    .returning({ id: content.id });

  return deleted ?? null;
}

export async function searchMemories(userId: string, input: SearchMemoriesValues) {
  const threshold = input.threshold ?? SIMILARITY_THRESHOLD;
  const queryEmbedding = buildEmbedding(input.query);
  const queryVector = `[${queryEmbedding.join(",")}]`;
  const similarityExpr = sql<number>`1 - (${content.embedding} <=> ${queryVector}::vector)`;

  const whereClause = input.types?.length
    ? and(eq(content.userId, userId), inArray(content.type, input.types))
    : eq(content.userId, userId);

  const rows = await db
    .select({
      ...getTableColumns(content),
      score: similarityExpr,
    })
    .from(content)
    .where(whereClause)
    .orderBy(desc(similarityExpr))
    .limit(input.limit);

  const filteredRows = rows.filter((row) => row.score >= threshold);
  const finalRows = filteredRows.length > 0 ? filteredRows : rows;

  return finalRows.map<SearchResultItem>((item) => ({
    id: item.id,
    userId: item.userId,
    type: item.type,
    body: item.body,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
    metadata: {
      sourceId: item.sourceId,
      sourceUrl: item.sourceUrl,
      canonicalUrl: item.canonicalUrl,
      siteName: item.siteName,
      author: item.author,
      publishedAt: item.publishedAt?.toISOString() ?? null,
      thumbnailUrl: item.thumbnailUrl,
      faviconUrl: item.faviconUrl,
      title: item.title,
      description: item.description,
    },
    score: item.score,
  }));
}

