"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  deleteContentAction,
  ingestContentAction,
  listContentAction,
  searchMemoriesAction,
} from "@/actions/content-actions";
import { Ingest } from "./ingest-composer";
import { NoteCard, TweetCard, WebsiteCard, YouTubeCard } from "./memory-card";
import type { IngestContentValues } from "@/lib/validations";
import type { SearchResultItem } from "@/lib/content-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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

interface MemoryDashboardProps {
  initialItems: DashboardItem[];
}

function toSearchItem(item: DashboardItem): SearchResultItem {
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

function toDashboardItem(raw: {
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
}) {
  return {
    ...raw,
    publishedAt: raw.publishedAt?.toISOString() ?? null,
    createdAt: raw.createdAt.toISOString(),
    updatedAt: raw.updatedAt.toISOString(),
  } satisfies DashboardItem;
}

export function MemoryDashboard({ initialItems }: MemoryDashboardProps) {
  const [items, setItems] = useState<DashboardItem[]>(initialItems);
  const [searchResults, setSearchResults] = useState<SearchResultItem[] | null>(null);
  const [query, setQuery] = useState("");
  const [isIngesting, startIngestTransition] = useTransition();
  const [isSearching, startSearchTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const renderedItems = searchResults ? searchResults : items.map(toSearchItem);

  function refreshList() {
    startSearchTransition(async () => {
      const nextItems = await listContentAction();
      setItems(nextItems.map((item) => toDashboardItem(item)));
    });
  }

  async function handleIngest(payload: IngestContentValues) {
    startIngestTransition(async () => {
      try {
        await ingestContentAction(payload);
        toast.success("Memory ingested.");
        refreshList();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Ingestion failed.");
      }
    });
  }

  function handleSearch() {
    if (!query.trim()) {
      setSearchResults(null);
      return;
    }
    startSearchTransition(async () => {
      try {
        const results = await searchMemoriesAction({
          query,
          limit: 20,
        });
        setSearchResults(results);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Search failed.");
      }
    });
  }

  function clearSearch() {
    setQuery("");
    setSearchResults(null);
  }

  function handleDelete(id: string) {
    setDeletingId(id);
    startSearchTransition(async () => {
      try {
        await deleteContentAction({ id });
        setItems((prev) => prev.filter((item) => item.id !== id));
        setSearchResults((prev) => prev?.filter((item) => item.id !== id) ?? null);
        toast.success("Memory deleted.");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Delete failed.");
      } finally {
        setDeletingId(null);
      }
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 sm:p-6">
      <Ingest.Root onSubmit={handleIngest} isSubmitting={isIngesting}>
        <Ingest.SourceTabs />
        <Ingest.Fields />
        <Ingest.Preview />
      </Ingest.Root>

      <div className="rounded-xl border bg-card p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            placeholder="Search your memory vault..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <div className="flex gap-2">
            <Button onClick={handleSearch} disabled={isSearching}>
              {isSearching ? "Searching..." : "Search"}
            </Button>
            <Button variant="outline" onClick={clearSearch}>
              Clear
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {renderedItems.map((item) => {
          const cardProps = {
            item: {
              id: item.id,
              type: item.type,
              body: item.body,
              title: item.metadata.title ?? null,
              description: item.metadata.description ?? null,
              sourceUrl: item.metadata.sourceUrl ?? null,
              thumbnailUrl: item.metadata.thumbnailUrl ?? null,
              siteName: item.metadata.siteName ?? null,
              author: item.metadata.author ?? null,
              publishedAt: item.metadata.publishedAt ?? null,
              score: searchResults ? item.score : undefined,
            },
            onDelete: handleDelete,
            deleting: deletingId === item.id,
          };

          if (item.type === "note") return <NoteCard key={item.id} {...cardProps} />;
          if (item.type === "website") return <WebsiteCard key={item.id} {...cardProps} />;
          if (item.type === "youtube") return <YouTubeCard key={item.id} {...cardProps} />;
          return <TweetCard key={item.id} {...cardProps} />;
        })}
      </div>
    </div>
  );
}

