"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import Masonry from "react-masonry-css";
import { useInView } from "react-intersection-observer";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Search01Icon,
  Cancel01Icon,
  AiBrain01Icon,
} from "@hugeicons/core-free-icons";
import {
  deleteContentAction,
  ingestContentAction,
  listContentAction,
  searchMemoriesAction,
} from "@/actions/content-actions";
import { SmartIngest } from "./ingest-composer";
import { NoteCard, TweetCard, WebsiteCard, YouTubeCard } from "./memory-card";
import type { IngestContentValues } from "@/lib/validations";
import type { SearchResultItem } from "@/lib/content-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  cn,
  toDashboardItem,
  toSearchItem,
  type DashboardItem,
} from "@/lib/utils";

interface MemoryDashboardProps {
  initialItems: DashboardItem[];
  tweetEmbeds?: Record<string, React.ReactNode>;
}

export function MemoryDashboard({
  initialItems,
  tweetEmbeds,
}: MemoryDashboardProps) {
  const [items, setItems] = useState<DashboardItem[]>(initialItems);
  const [searchResults, setSearchResults] = useState<SearchResultItem[] | null>(
    null
  );
  const [query, setQuery] = useState("");
  const [isIngesting, startIngestTransition] = useTransition();
  const [isSearching, startSearchTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [hasMore, setHasMore] = useState(initialItems.length >= 50);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const { ref, inView } = useInView();

  useEffect(() => {
    async function loadMore() {
      setIsLoadingMore(true);
      try {
        const cursor = items[items.length - 1]?.createdAt;
        if (!cursor) return;

        const nextItems = await listContentAction({ cursor, limit: 50 });
        setItems((prev) => [
          ...prev,
          ...nextItems.map((item) => toDashboardItem(item)),
        ]);
        setHasMore(nextItems.length >= 50);
      } catch (error) {
        console.error("Failed to load more:", error);
      } finally {
        setIsLoadingMore(false);
      }
    }

    if (inView && hasMore && !isLoadingMore && !searchResults) {
      loadMore();
    }
  }, [inView, hasMore, isLoadingMore, searchResults, items]);

  const renderedItems = searchResults ? searchResults : items.map(toSearchItem);
  const isEmpty = renderedItems.length === 0;

  function refreshList() {
    startSearchTransition(async () => {
      const nextItems = await listContentAction({ limit: 50 });
      setItems(nextItems.map((item) => toDashboardItem(item)));
      setHasMore(nextItems.length >= 50);
    });
  }

  async function handleIngest(payload: IngestContentValues) {
    startIngestTransition(async () => {
      try {
        await ingestContentAction(payload);
        toast.success("Memory saved.");
        refreshList();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to save memory."
        );
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
        const results = await searchMemoriesAction({ query, limit: 50 });
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
        setSearchResults(
          (prev) => prev?.filter((item) => item.id !== id) ?? null
        );
        toast.success("Memory deleted.");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Delete failed.");
      } finally {
        setDeletingId(null);
      }
    });
  }

  const breakpointColumnsObj = {
    default: 3,
    1024: 2,
    640: 1,
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      {/* Smart capture composer */}
      <div className="mb-6 flex justify-center items-center">
        <SmartIngest onSubmit={handleIngest} isSubmitting={isIngesting} />
      </div>

      {/* Search bar */}
      <div className="mb-8">
        <div
          className={cn(
            "flex items-center gap-2 rounded-none border-2 border-border bg-card p-2 pl-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]",
            "transition-all focus-within:-translate-x-0.5 focus-within:-translate-y-0.5 focus-within:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:focus-within:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)]"
          )}
        >
          <HugeiconsIcon
            icon={Search01Icon}
            size={16}
            strokeWidth={2}
            className={cn(
              "shrink-0 transition-colors",
              isSearching ? "text-primary" : "text-muted-foreground/60"
            )}
          />

          <Input
            placeholder="Semantic search across all memories…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="h-10 flex-1 border-0 bg-transparent p-0 text-base shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/40 font-medium"
          />

          {query && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSearch}
              className="h-8 px-2.5 text-muted-foreground hover:text-foreground active:translate-y-0"
            >
              <HugeiconsIcon icon={Cancel01Icon} size={16} strokeWidth={2} />
            </Button>
          )}

          <Button
            onClick={handleSearch}
            disabled={isSearching}
            size="sm"
            className="h-9 shrink-0 px-4 text-sm font-bold active:translate-y-0"
          >
            {isSearching ? (
              <span className="flex items-center gap-2">
                <span className="size-3.5 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                Searching
              </span>
            ) : (
              "Search"
            )}
          </Button>
        </div>

        {searchResults !== null && (
          <div className="mt-3 flex items-center gap-2 px-1">
            <span className="text-sm font-medium text-muted-foreground">
              {searchResults.length} result
              {searchResults.length !== 1 ? "s" : ""} for{" "}
              <span className="font-bold text-foreground">
                &quot;{query}&quot;
              </span>
            </span>
            <button
              onClick={clearSearch}
              className="text-sm font-bold text-primary hover:text-primary/80 transition-colors underline underline-offset-4"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Memory count */}
      {items.length > 0 && searchResults === null && (
        <div className="mb-6">
          <p className="text-sm font-medium text-muted-foreground">
            {items.length} memor{items.length === 1 ? "y" : "ies"} saved
          </p>
        </div>
      )}

      {/* Memory grid */}
      {isEmpty ? (
        <EmptyState isSearch={searchResults !== null} onClear={clearSearch} />
      ) : (
        <>
          <Masonry
            breakpointCols={breakpointColumnsObj}
            className="my-masonry-grid"
            columnClassName="my-masonry-grid_column [&>article]:mb-6"
          >
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

              if (item.type === "note")
                return <NoteCard key={item.id} {...cardProps} />;
              if (item.type === "website")
                return <WebsiteCard key={item.id} {...cardProps} />;
              if (item.type === "youtube")
                return <YouTubeCard key={item.id} {...cardProps} />;
              return (
                <TweetCard
                  key={item.id}
                  {...cardProps}
                  tweetEmbeds={tweetEmbeds}
                />
              );
            })}
          </Masonry>

          {/* Infinite Scroll trigger */}
          {!searchResults && hasMore && (
            <div ref={ref} className="py-8 flex justify-center">
              <span className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
                <span className="size-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
                Loading more...
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function EmptyState({
  isSearch,
  onClear,
}: {
  isSearch: boolean;
  onClear: () => void;
}) {
  if (isSearch) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-none border-2 border-dashed border-border/50 bg-card/30 py-20 text-center shadow-sm">
        <div className="flex size-14 items-center justify-center rounded-none bg-muted border-2 border-border/50">
          <HugeiconsIcon
            icon={Search01Icon}
            size={24}
            strokeWidth={2}
            className="text-muted-foreground"
          />
        </div>
        <div>
          <p
            className="text-lg font-bold text-foreground"
            style={{ fontFamily: "var(--font-display)" }}
          >
            No memories found
          </p>
          <p className="mt-1 text-sm font-medium text-muted-foreground">
            Try a different search query
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onClear} className="mt-2">
          Clear search
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-none border-2 border-dashed border-border/50 bg-card/30 py-24 text-center shadow-sm">
      <div className="flex size-16 items-center justify-center rounded-none bg-primary/10 border-2 border-primary/20">
        <HugeiconsIcon
          icon={AiBrain01Icon}
          size={28}
          strokeWidth={1.5}
          className="text-primary"
        />
      </div>
      <div>
        <p
          className="text-xl font-bold text-foreground"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Your vault is empty
        </p>
        <p className="mt-2 text-sm font-medium text-muted-foreground max-w-sm mx-auto">
          Add your first memory above — a note, website, YouTube video, or
          tweet.
        </p>
      </div>
    </div>
  );
}
