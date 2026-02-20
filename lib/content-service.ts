import { generateObject, generateText } from "ai";
import { z } from "zod";
import { aiModels, groqProviderOptions } from "./ai/models";
import { extractTweetMetadata, extractWebsiteMetadata, extractYouTubeMetadata } from "./metadata";
import { SIMILARITY_THRESHOLD } from "./search-config";
import {
  buildSearchableText,
  deleteMemoryRecord,
  fetchMemoryById,
  listMemoriesByUser,
  searchMemoriesByText,
  toIntegratedRecord,
  upsertMemoryRecord,
} from "./pinecone";
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
  const id = crypto.randomUUID();
  const timestamp = new Date(nowIso());
  const sourceId = (normalized.sourceId as string | null | undefined) ?? null;
  const sourceUrl = (normalized.sourceUrl as string | null | undefined) ?? null;
  const canonicalUrl = (normalized.canonicalUrl as string | null | undefined) ?? null;
  const siteName = (normalized.siteName as string | null | undefined) ?? null;
  const author = (normalized.author as string | null | undefined) ?? null;
  const publishedAt = normalized.publishedAt ? String(normalized.publishedAt) : null;
  const thumbnailUrl = (normalized.thumbnailUrl as string | null | undefined) ?? null;
  const faviconUrl = (normalized.faviconUrl as string | null | undefined) ?? null;
  const title = (normalized.title as string | null | undefined) ?? null;
  const description = (normalized.description as string | null | undefined) ?? null;
  const text = buildSearchableText({ title, description, body });

  const integratedRecord = toIntegratedRecord({
    id,
    type: input.type,
    body,
    sourceId,
    sourceUrl,
    canonicalUrl,
    siteName,
    author,
    publishedAt,
    thumbnailUrl,
    faviconUrl,
    title,
    description,
    createdAt: timestamp,
    updatedAt: timestamp,
    text,
  });

  await upsertMemoryRecord(userId, integratedRecord);

  return {
    id,
    userId,
    type: input.type,
    sourceId,
    sourceUrl,
    canonicalUrl,
    siteName,
    author,
    publishedAt: publishedAt ? new Date(publishedAt) : null,
    thumbnailUrl,
    faviconUrl,
    title,
    description,
    body,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export async function listMemories(userId: string, options?: { limit?: number; cursor?: string }) {
  return listMemoriesByUser(userId, options);
}

export async function updateMemory(userId: string, input: UpdateContentValues) {
  const existing = await fetchMemoryById(userId, input.id);
  if (!existing) return null;

  const nextTitle = input.title !== undefined ? input.title : existing.title;
  const nextDescription = input.description !== undefined ? input.description : existing.description;
  const nextThumbnail =
    input.thumbnailUrl !== undefined ? input.thumbnailUrl ?? null : existing.thumbnailUrl;
  const now = new Date();

  await upsertMemoryRecord(
    userId,
    toIntegratedRecord({
      id: existing.id,
      type: existing.type,
      body: existing.body,
      sourceId: existing.sourceId,
      sourceUrl: existing.sourceUrl,
      canonicalUrl: existing.canonicalUrl,
      siteName: existing.siteName,
      author: existing.author,
      publishedAt: existing.publishedAt?.toISOString() ?? null,
      thumbnailUrl: nextThumbnail,
      faviconUrl: existing.faviconUrl,
      title: nextTitle,
      description: nextDescription,
      createdAt: existing.createdAt,
      updatedAt: now,
      text: buildSearchableText({
        title: nextTitle,
        description: nextDescription,
        body: existing.body,
      }),
    }),
  );

  return {
    ...existing,
    title: nextTitle,
    description: nextDescription,
    thumbnailUrl: nextThumbnail,
    updatedAt: now,
  };
}

export async function deleteMemory(userId: string, input: DeleteContentValues) {
  return deleteMemoryRecord(userId, input.id);
}

export async function searchMemories(userId: string, input: SearchMemoriesValues) {
  const threshold = input.threshold ?? SIMILARITY_THRESHOLD;
  const rows = await searchMemoriesByText(userId, {
    query: input.query,
    limit: input.limit,
    types: input.types,
  });
  const filteredRows = rows.filter((row) => row.score >= threshold);
  return filteredRows.length > 0 ? filteredRows : rows;
}

