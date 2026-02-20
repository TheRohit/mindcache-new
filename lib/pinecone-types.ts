import type { RecordMetadata } from "@pinecone-database/pinecone";
import type { ContentType } from "./content-types";

export type PineconeMemoryFields = RecordMetadata & {
  type: ContentType;
  body: string;
  createdAt: string;
  updatedAt: string;
  sourceId?: string;
  sourceUrl?: string;
  canonicalUrl?: string;
  siteName?: string;
  author?: string;
  publishedAt?: string;
  thumbnailUrl?: string;
  faviconUrl?: string;
  title?: string;
  description?: string;
  text: string;
};

export interface MemoryRecord {
  id: string;
  userId: string;
  type: ContentType;
  body: string;
  sourceId: string | null;
  sourceUrl: string | null;
  canonicalUrl: string | null;
  siteName: string | null;
  author: string | null;
  publishedAt: Date | null;
  thumbnailUrl: string | null;
  faviconUrl: string | null;
  title: string | null;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SearchableTextInput {
  title?: string | null;
  description?: string | null;
  body: string;
}

export interface PineconeMetadataInput {
  type: ContentType;
  body: string;
  sourceId?: string | null;
  sourceUrl?: string | null;
  canonicalUrl?: string | null;
  siteName?: string | null;
  author?: string | null;
  publishedAt?: string | null;
  thumbnailUrl?: string | null;
  faviconUrl?: string | null;
  title?: string | null;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
  text: string;
}

export interface IntegratedRecordInput {
  id: string;
  type: ContentType;
  body: string;
  sourceId?: string | null;
  sourceUrl?: string | null;
  canonicalUrl?: string | null;
  siteName?: string | null;
  author?: string | null;
  publishedAt?: string | null;
  thumbnailUrl?: string | null;
  faviconUrl?: string | null;
  title?: string | null;
  description?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  text: string;
}

export type PineconeIntegratedRecord = { _id: string } & PineconeMemoryFields;

export interface SearchHitInput {
  id?: string;
  score?: number;
  fields?: Record<string, unknown>;
}

export interface ListMemoriesOptions {
  limit?: number;
  cursor?: string;
}

export interface SearchMemoriesByTextInput {
  query: string;
  limit: number;
  types?: ContentType[];
}
