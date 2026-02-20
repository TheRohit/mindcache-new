import { Pinecone } from "@pinecone-database/pinecone";
import type { SearchResultItem } from "./content-types";
import {
  buildUserNamespace,
  toIso,
} from "./pinecone-utils";
import {
  pineconeEnvSchema,
  pineconeMemoryFieldsSchema,
  type PineconeMemoryFieldsParsed,
} from "./pinecone-schemas";
import type {
  IntegratedRecordInput,
  ListMemoriesOptions,
  MemoryRecord,
  PineconeIntegratedRecord,
  PineconeMemoryFields,
  PineconeMetadataInput,
  SearchHitInput,
  SearchMemoriesByTextInput,
  SearchableTextInput,
} from "./pinecone-types";

const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const PINECONE_INDEX_HOST = process.env.PINECONE_INDEX_HOST;
const PINECONE_NAMESPACE_PREFIX = process.env.PINECONE_NAMESPACE_PREFIX ?? "user:";

function getIndex() {
  const env = pineconeEnvSchema.parse({
    PINECONE_API_KEY,
    PINECONE_INDEX_HOST,
    PINECONE_NAMESPACE_PREFIX,
  });
  const apiKey = env.PINECONE_API_KEY;
  const host = env.PINECONE_INDEX_HOST;
  const client = new Pinecone({ apiKey });
  return client.index<PineconeMemoryFields>({ host });
}

function namespaceForUser(userId: string) {
  return buildUserNamespace(PINECONE_NAMESPACE_PREFIX, userId);
}

function metadataWithoutNulls(fields: PineconeMetadataInput): PineconeMemoryFields {
  const metadata: PineconeMemoryFields = {
    type: fields.type,
    body: fields.body,
    createdAt: fields.createdAt,
    updatedAt: fields.updatedAt,
    text: fields.text,
  };

  const optionalEntries = {
    sourceId: fields.sourceId,
    sourceUrl: fields.sourceUrl,
    canonicalUrl: fields.canonicalUrl,
    siteName: fields.siteName,
    author: fields.author,
    publishedAt: fields.publishedAt,
    thumbnailUrl: fields.thumbnailUrl,
    faviconUrl: fields.faviconUrl,
    title: fields.title,
    description: fields.description,
  };

  for (const [key, value] of Object.entries(optionalEntries)) {
    if (value !== null && value !== undefined && value !== "") {
      metadata[key as keyof typeof metadata] = value;
    }
  }

  return metadata;
}

export function buildSearchableText(input: SearchableTextInput) {
  return [input.title ?? "", input.description ?? "", input.body].filter(Boolean).join("\n");
}

export function toIntegratedRecord(input: IntegratedRecordInput): PineconeIntegratedRecord {
  return {
    _id: input.id,
    ...metadataWithoutNulls({
      type: input.type,
      body: input.body,
      sourceId: input.sourceId,
      sourceUrl: input.sourceUrl,
      canonicalUrl: input.canonicalUrl,
      siteName: input.siteName,
      author: input.author,
      publishedAt: input.publishedAt,
      thumbnailUrl: input.thumbnailUrl,
      faviconUrl: input.faviconUrl,
      title: input.title,
      description: input.description,
      createdAt: toIso(input.createdAt),
      updatedAt: toIso(input.updatedAt),
      text: input.text,
    }),
  };
}

export function toMemoryRecord(
  userId: string,
  id: string,
  fields: PineconeMemoryFieldsParsed,
): MemoryRecord {
  return {
    id,
    userId,
    type: fields.type,
    body: fields.body,
    sourceId: fields.sourceId ?? null,
    sourceUrl: fields.sourceUrl ?? null,
    canonicalUrl: fields.canonicalUrl ?? null,
    siteName: fields.siteName ?? null,
    author: fields.author ?? null,
    publishedAt: fields.publishedAt ? new Date(fields.publishedAt) : null,
    thumbnailUrl: fields.thumbnailUrl ?? null,
    faviconUrl: fields.faviconUrl ?? null,
    title: fields.title ?? null,
    description: fields.description ?? null,
    createdAt: new Date(fields.createdAt),
    updatedAt: new Date(fields.updatedAt),
  };
}

function toSearchResult(userId: string, hit: SearchHitInput): SearchResultItem | null {
  const id = hit.id ?? "";
  const parsed = pineconeMemoryFieldsSchema.safeParse(hit.fields ?? {});
  if (!parsed.success) {
    console.warn("pinecone.search.invalid_record", {
      id,
      issues: parsed.error.issues.map((issue) => issue.message),
    });
    return null;
  }
  const memory = toMemoryRecord(userId, id, parsed.data);

  return {
    id: memory.id,
    userId,
    type: memory.type,
    body: memory.body,
    createdAt: memory.createdAt.toISOString(),
    updatedAt: memory.updatedAt.toISOString(),
    metadata: {
      sourceId: memory.sourceId,
      sourceUrl: memory.sourceUrl,
      canonicalUrl: memory.canonicalUrl,
      siteName: memory.siteName,
      author: memory.author,
      publishedAt: memory.publishedAt?.toISOString() ?? null,
      thumbnailUrl: memory.thumbnailUrl,
      faviconUrl: memory.faviconUrl,
      title: memory.title,
      description: memory.description,
    },
    score: hit.score ?? 0,
  };
}

async function fetchAllIds(namespace: string) {
  const index = getIndex();
  const ids: string[] = [];
  let paginationToken: string | undefined;

  do {
    const response = await index.listPaginated({
      namespace,
      paginationToken,
      limit: 100,
    });

    ids.push(
      ...(response.vectors ?? [])
        .map((item) => item.id)
        .filter((id): id is string => Boolean(id)),
    );
    paginationToken = response.pagination?.next;
  } while (paginationToken);

  return ids;
}

export async function upsertMemoryRecord(userId: string, record: PineconeIntegratedRecord) {
  const index = getIndex();
  await index.upsertRecords({
    namespace: namespaceForUser(userId),
    records: [record],
  });
}

export async function fetchMemoryById(userId: string, id: string): Promise<MemoryRecord | null> {
  const index = getIndex();
  const namespace = namespaceForUser(userId);
  const response = await index.fetch({ namespace, ids: [id] });
  const record = response.records?.[id];
  if (!record?.metadata) return null;
  const parsed = pineconeMemoryFieldsSchema.safeParse(record.metadata);
  if (!parsed.success) {
    console.warn("pinecone.fetch.invalid_record", {
      id,
      issues: parsed.error.issues.map((issue) => issue.message),
    });
    return null;
  }
  return toMemoryRecord(userId, id, parsed.data);
}

export async function listMemoriesByUser(
  userId: string,
  options?: ListMemoriesOptions,
): Promise<MemoryRecord[]> {
  const namespace = namespaceForUser(userId);
  const ids = await fetchAllIds(namespace);
  if (ids.length === 0) return [];

  const index = getIndex();
  const chunks: string[][] = [];
  for (let i = 0; i < ids.length; i += 1000) {
    chunks.push(ids.slice(i, i + 1000));
  }

  const allRows: MemoryRecord[] = [];
  for (const chunk of chunks) {
    const response = await index.fetch({ namespace, ids: chunk });
    const records = response.records ?? {};
    for (const [id, vector] of Object.entries(records)) {
      const metadata = vector.metadata;
      if (!metadata) continue;
      const parsed = pineconeMemoryFieldsSchema.safeParse(metadata);
      if (!parsed.success) {
        console.warn("pinecone.list.invalid_record", {
          id,
          issues: parsed.error.issues.map((issue) => issue.message),
        });
        continue;
      }
      allRows.push(toMemoryRecord(userId, id, parsed.data));
    }
  }

  allRows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const cursorTime = options?.cursor ? new Date(options.cursor).getTime() : null;
  const afterCursor =
    cursorTime === null
      ? allRows
      : allRows.filter((item) => item.createdAt.getTime() < cursorTime);
  return afterCursor.slice(0, options?.limit ?? 50);
}

export async function deleteMemoryRecord(userId: string, id: string): Promise<{ id: string } | null> {
  const existing = await fetchMemoryById(userId, id);
  if (!existing) return null;

  const index = getIndex();
  await index.deleteOne({
    namespace: namespaceForUser(userId),
    id,
  });
  return { id };
}

export async function searchMemoriesByText(
  userId: string,
  input: SearchMemoriesByTextInput,
): Promise<SearchResultItem[]> {
  const index = getIndex();
  const namespace = namespaceForUser(userId);

  const filter =
    input.types && input.types.length > 0
      ? input.types.length === 1
        ? { type: { $eq: input.types[0] } }
        : { type: { $in: input.types } }
      : undefined;

  const response = await index.searchRecords({
    namespace,
    query: {
      topK: input.limit,
      inputs: { text: input.query },
      filter,
    },
    fields: [
      "type",
      "body",
      "sourceId",
      "sourceUrl",
      "canonicalUrl",
      "siteName",
      "author",
      "publishedAt",
      "thumbnailUrl",
      "faviconUrl",
      "title",
      "description",
      "createdAt",
      "updatedAt",
    ],
  });

  const hits = response.result?.hits ?? [];
  return hits
    .map((hit) =>
      toSearchResult(userId, {
        id: hit._id,
        score: hit._score,
        fields: hit.fields as Record<string, unknown> | undefined,
      }),
    )
    .filter((item): item is SearchResultItem => item !== null);
}
