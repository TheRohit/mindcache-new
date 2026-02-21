export const CONTENT_TYPES = ["note", "website", "youtube", "tweet"] as const;

export type ContentType = (typeof CONTENT_TYPES)[number];

export interface ContentMetadata {
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
  likeCount?: number | null;
  replyCount?: number | null;
}

export interface MemoryContent {
  id: string;
  userId: string;
  type: ContentType;
  body: string;
  createdAt: string;
  updatedAt: string;
  metadata: ContentMetadata;
}

export interface SearchResultItem extends MemoryContent {
  score: number;
}
