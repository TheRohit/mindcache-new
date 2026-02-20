"use client";

import { Tweet } from "react-tweet";
import type { SearchResultItem } from "@/lib/content-types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type CardItem = {
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

interface BaseCardProps {
  item: CardItem;
  onDelete: (id: string) => void;
  deleting: boolean;
}

function formatDate(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const typeConfig = {
  note: {
    label: "Note",
    className: "type-badge-note",
    icon: (
      <svg className="size-3" viewBox="0 0 12 12" fill="none">
        <path d="M2 2h8M2 5h8M2 8h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  website: {
    label: "Website",
    className: "type-badge-website",
    icon: (
      <svg className="size-3" viewBox="0 0 12 12" fill="none">
        <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M6 1.5C6 1.5 4 4 4 6s2 4.5 2 4.5M6 1.5C6 1.5 8 4 8 6s-2 4.5-2 4.5M1.5 6h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  youtube: {
    label: "YouTube",
    className: "type-badge-youtube",
    icon: (
      <svg className="size-3" viewBox="0 0 12 12" fill="none">
        <rect x="1" y="2.5" width="10" height="7" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M5 4.5L8 6L5 7.5V4.5Z" fill="currentColor" />
      </svg>
    ),
  },
  tweet: {
    label: "Tweet",
    className: "type-badge-tweet",
    icon: (
      <svg className="size-3" viewBox="0 0 12 12" fill="currentColor">
        <path d="M9.5 1.5H11L7.5 5.5L11.5 10.5H8.5L6 7.5L3.5 10.5H1L4.5 6.5L1 1.5H4L6.5 4.5L9.5 1.5Z" />
      </svg>
    ),
  },
} as const;

function TypeBadge({ type }: { type: CardItem["type"] }) {
  const config = typeConfig[type];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-none px-2 py-0.5 text-[11px] font-semibold",
        config.className,
      )}
    >
      {config.icon}
      {config.label}
    </span>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  return (
    <span className="inline-flex items-center gap-1 rounded-none border border-primary/20 bg-primary/8 px-2 py-0.5 text-[11px] font-semibold text-primary">
      <span className="size-1.5 rounded-full bg-primary" />
      {pct}%
    </span>
  );
}

function DeleteButton({
  onDelete,
  id,
  deleting,
}: {
  onDelete: (id: string) => void;
  id: string;
  deleting: boolean;
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn(
        "h-7 w-7 p-0 text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-all",
        "opacity-0 group-hover:opacity-100",
        deleting && "opacity-60 pointer-events-none",
      )}
      onClick={() => onDelete(id)}
      disabled={deleting}
      aria-label="Delete memory"
    >
      {deleting ? (
        <span className="size-3.5 animate-spin rounded-full border border-current/30 border-t-current" />
      ) : (
        <svg className="size-3.5" viewBox="0 0 12 12" fill="none">
          <path
            d="M2 3h8M5 3V2h2v1M4.5 3v6.5M7.5 3v6.5M3 3l.5 7h5L9 3"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </Button>
  );
}

function MemoryCardShell({
  item,
  children,
  onDelete,
  deleting,
}: React.PropsWithChildren<BaseCardProps>) {
  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-none",
        "border-2 border-border bg-card shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]",
        "transition-all duration-200 ease-out",
        "hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)]",
        "active:translate-x-0 active:translate-y-0 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:active:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]",
      )}
    >
      {/* Thumbnail */}
      {item.thumbnailUrl ? (
        <div className="relative h-40 w-full overflow-hidden bg-muted">
          <img
            src={item.thumbnailUrl}
            alt={item.title ?? "Memory thumbnail"}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
          <div className="absolute inset-0 bg-linear-to-t from-card/60 via-transparent to-transparent" />
          {/* Badge overlaid on thumbnail */}
          <div className="absolute left-3 bottom-3 flex items-center gap-2">
            <TypeBadge type={item.type} />
          </div>
        </div>
      ) : null}

      <div className="flex flex-1 flex-col gap-3 p-4">
        {/* Header row (when no thumbnail) */}
        {!item.thumbnailUrl ? (
          <div className="flex items-center justify-between gap-2">
            <TypeBadge type={item.type} />
            <div className="flex items-center gap-1.5">
              {typeof item.score === "number" && <ScoreBadge score={item.score} />}
              <DeleteButton onDelete={onDelete} id={item.id} deleting={deleting} />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-end gap-1.5">
            {typeof item.score === "number" && <ScoreBadge score={item.score} />}
            <DeleteButton onDelete={onDelete} id={item.id} deleting={deleting} />
          </div>
        )}

        {/* Title */}
        {item.title ? (
          <h3 className="text-sm font-semibold leading-snug text-foreground line-clamp-2">
            {item.title}
          </h3>
        ) : null}

        {/* Body / content */}
        <div className="flex-1">{children}</div>

        {/* Footer */}
        <div className="flex items-center gap-2 pt-1 text-[11px] text-muted-foreground/60 border-t border-border/30">
          {item.siteName && <span className="font-medium">{item.siteName}</span>}
          {item.siteName && (item.author || item.publishedAt) && (
            <span className="text-border">·</span>
          )}
          {item.author && <span>{item.author}</span>}
          {item.author && item.publishedAt && <span className="text-border">·</span>}
          {item.publishedAt && <span>{formatDate(item.publishedAt)}</span>}
          {!item.siteName && !item.author && !item.publishedAt && (
            <span className="opacity-50">No metadata</span>
          )}
        </div>
      </div>
    </article>
  );
}

export function NoteCard(props: BaseCardProps) {
  return (
    <MemoryCardShell {...props}>
      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-5 whitespace-pre-wrap">
        {props.item.body}
      </p>
    </MemoryCardShell>
  );
}

export function WebsiteCard(props: BaseCardProps) {
  return (
    <MemoryCardShell {...props}>
      {props.item.description ? (
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
          {props.item.description}
        </p>
      ) : (
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">
          {props.item.body}
        </p>
      )}
      {props.item.sourceUrl ? (
        <a
          className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:text-primary/80 transition-colors"
          href={props.item.sourceUrl}
          target="_blank"
          rel="noreferrer"
        >
          Open source
          <svg className="size-3" viewBox="0 0 12 12" fill="none">
            <path d="M2.5 9.5L9.5 2.5M9.5 2.5H5M9.5 2.5V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      ) : null}
    </MemoryCardShell>
  );
}

export function YouTubeCard(props: BaseCardProps) {
  return (
    <MemoryCardShell {...props}>
      {props.item.description ? (
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
          {props.item.description}
        </p>
      ) : (
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">
          {props.item.body}
        </p>
      )}
      {props.item.sourceUrl ? (
        <a
          className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:text-primary/80 transition-colors"
          href={props.item.sourceUrl}
          target="_blank"
          rel="noreferrer"
        >
          Watch on YouTube
          <svg className="size-3" viewBox="0 0 12 12" fill="none">
            <path d="M2.5 9.5L9.5 2.5M9.5 2.5H5M9.5 2.5V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      ) : null}
    </MemoryCardShell>
  );
}

export function TweetCard(props: BaseCardProps) {
  const tweetId = props.item.sourceUrl?.match(/status\/(\d+)/)?.[1];
  return (
    <MemoryCardShell {...props}>
      {tweetId ? (
        <div className="[&_.react-tweet-theme]:w-full! [&_.react-tweet-theme]:m-0! [&_.react-tweet-theme]:rounded-none! overflow-hidden" data-theme="dark">
          <Tweet id={tweetId} />
        </div>
      ) : (
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">
          {props.item.body}
        </p>
      )}
      {props.item.sourceUrl && !tweetId ? (
        <a
          className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:text-primary/80 transition-colors"
          href={props.item.sourceUrl}
          target="_blank"
          rel="noreferrer"
        >
          Open tweet
          <svg className="size-3" viewBox="0 0 12 12" fill="none">
            <path d="M2.5 9.5L9.5 2.5M9.5 2.5H5M9.5 2.5V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      ) : null}
    </MemoryCardShell>
  );
}
