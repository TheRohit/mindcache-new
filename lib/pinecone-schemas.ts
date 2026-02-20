import { z } from "zod";
import { CONTENT_TYPES } from "./content-types";

export const pineconeEnvSchema = z.object({
  PINECONE_API_KEY: z.string().trim().min(1, "PINECONE_API_KEY is required"),
  PINECONE_INDEX_HOST: z.url("PINECONE_INDEX_HOST must be a valid URL"),
  PINECONE_NAMESPACE_PREFIX: z.string().trim().default("user:"),
});

export const pineconeMemoryFieldsSchema = z.object({
  type: z.enum(CONTENT_TYPES),
  body: z.string(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  sourceId: z.string().optional(),
  sourceUrl: z.string().optional(),
  canonicalUrl: z.string().optional(),
  siteName: z.string().optional(),
  author: z.string().optional(),
  publishedAt: z.iso.datetime().optional(),
  thumbnailUrl: z.string().optional(),
  faviconUrl: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  text: z.string().optional(),
});

export type PineconeMemoryFieldsParsed = z.infer<typeof pineconeMemoryFieldsSchema>;
