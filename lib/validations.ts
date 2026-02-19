import { z } from "zod";
import { CONTENT_TYPES } from "./content-types";

const emailField = z.string().email({ message: "Enter a valid email address" });
const passwordField = z.string().min(8, { message: "Password must be at least 8 characters" });

export const signInSchema = z.object({
  email: emailField,
  password: passwordField,
});

export const signUpSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: emailField,
  password: passwordField,
});

export type SignInValues = z.infer<typeof signInSchema>;
export type SignUpValues = z.infer<typeof signUpSchema>;

const optionalHttpUrl = z
  .string()
  .url("Must be a valid URL")
  .optional()
  .or(z.literal(""));

export const noteIngestSchema = z.object({
  type: z.literal("note"),
  body: z.string().min(1, "Note content is required"),
  title: z.string().trim().max(180).optional(),
});

export const websiteIngestSchema = z.object({
  type: z.literal("website"),
  url: z.string().url("Enter a valid website URL"),
  title: z.string().trim().max(180).optional(),
  description: z.string().trim().max(2000).optional(),
});

export const youtubeIngestSchema = z.object({
  type: z.literal("youtube"),
  url: z.string().url("Enter a valid YouTube URL"),
  title: z.string().trim().max(180).optional(),
});

export const tweetIngestSchema = z.object({
  type: z.literal("tweet"),
  url: z.string().url("Enter a valid tweet URL"),
  body: z.string().trim().optional(),
});

export const ingestContentSchema = z.discriminatedUnion("type", [
  noteIngestSchema,
  websiteIngestSchema,
  youtubeIngestSchema,
  tweetIngestSchema,
]);

export const updateContentSchema = z.object({
  id: z.string().min(1),
  title: z.string().trim().max(180).optional(),
  description: z.string().trim().max(2000).optional(),
  thumbnailUrl: optionalHttpUrl.transform((value) => value || undefined),
});

export const deleteContentSchema = z.object({
  id: z.string().min(1),
});

export const searchMemoriesSchema = z.object({
  query: z.string().trim().min(1, "Search query is required"),
  limit: z.number().int().min(1).max(50).default(20),
  threshold: z.number().min(0).max(1).optional(),
  types: z.array(z.enum(CONTENT_TYPES)).optional(),
});

export type IngestContentValues = z.infer<typeof ingestContentSchema>;
export type UpdateContentValues = z.infer<typeof updateContentSchema>;
export type DeleteContentValues = z.infer<typeof deleteContentSchema>;
export type SearchMemoriesValues = z.infer<typeof searchMemoriesSchema>;
