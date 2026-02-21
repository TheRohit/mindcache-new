import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { IngestContentValues } from "@/lib/validations"
import type { SearchResultItem } from "@/lib/content-types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/* ── Content type detection ──────────────────────────────── */

export type SourceType = IngestContentValues["type"];

export function detectType(input: string): SourceType {
  const s = input.trim();
  if (!s) return "note";
  if (/^https?:\/\/(www\.)?(youtube\.com\/watch|youtu\.be\/)/.test(s))
    return "youtube";
  if (/^https?:\/\/(www\.)?(twitter\.com|x\.com)\/\w+\/status\/\d+/.test(s))
    return "tweet";
  if (/^https?:\/\//.test(s)) return "website";
  return "note";
}

/* ── Dashboard item types & transforms ───────────────────── */

export interface DashboardItem {
  id: string;
  type: "note" | "website" | "youtube" | "tweet";
  body: string;
  sourceUrl: string | null;
  siteName: string | null;
  author: string | null;
  publishedAt: string | null;
  thumbnailUrl: string | null;
  title: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export function toSearchItem(item: DashboardItem): SearchResultItem {
  return {
    id: item.id,
    type: item.type,
    userId: "current-user",
    body: item.body,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    metadata: {
      sourceUrl: item.sourceUrl,
      siteName: item.siteName,
      author: item.author,
      publishedAt: item.publishedAt,
      thumbnailUrl: item.thumbnailUrl,
      title: item.title,
      description: item.description,
    },
    score: 1,
  };
}

export function toDashboardItem(raw: {
  id: string;
  type: DashboardItem["type"];
  body: string;
  sourceUrl: string | null;
  siteName: string | null;
  author: string | null;
  publishedAt: Date | null;
  thumbnailUrl: string | null;
  title: string | null;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}): DashboardItem {
  return {
    ...raw,
    publishedAt: raw.publishedAt?.toISOString() ?? null,
    createdAt: raw.createdAt.toISOString(),
    updatedAt: raw.updatedAt.toISOString(),
  };
}
