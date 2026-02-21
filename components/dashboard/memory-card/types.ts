import type { SearchResultItem } from "@/lib/content-types";

export type CardItem = {
  id: string;
  type: SearchResultItem["type"];
  body: string;
  title: string | null;
  description: string | null;
  sourceUrl: string | null;
  thumbnailUrl: string | null;
  siteName: string | null;
  author: string | null;
  publishedAt: string | null;
  score?: number;
};

export interface BaseCardProps {
  item: CardItem;
  onDelete: (id: string) => void;
  deleting: boolean;
}

export function formatDate(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
