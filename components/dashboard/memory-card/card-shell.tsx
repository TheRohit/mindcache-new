"use client";

import { cn } from "@/lib/utils";
import type { BaseCardProps } from "./types";
import { formatDate } from "./types";
import { TypeBadge } from "./type-badge";
import { ScoreBadge } from "./score-badge";
import { DeleteButton } from "./delete-button";

export function MemoryCardShell({
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
        "active:translate-x-0 active:translate-y-0 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:active:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]"
      )}
    >
      {item.thumbnailUrl ? (
        <div className="relative h-40 w-full overflow-hidden bg-muted">
          <img
            src={item.thumbnailUrl}
            alt={item.title ?? "Memory thumbnail"}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
          <div className="absolute inset-0 bg-linear-to-t from-card/60 via-transparent to-transparent" />
          <div className="absolute left-3 bottom-3 flex items-center gap-2">
            <TypeBadge type={item.type} />
          </div>
        </div>
      ) : null}

      <div className="flex flex-1 flex-col gap-3 p-4">
        {!item.thumbnailUrl ? (
          <div className="flex items-center justify-between gap-2">
            <TypeBadge type={item.type} />
            <div className="flex items-center gap-1.5">
              {typeof item.score === "number" && (
                <ScoreBadge score={item.score} />
              )}
              <DeleteButton
                onDelete={onDelete}
                id={item.id}
                deleting={deleting}
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-end gap-1.5">
            {typeof item.score === "number" && (
              <ScoreBadge score={item.score} />
            )}
            <DeleteButton
              onDelete={onDelete}
              id={item.id}
              deleting={deleting}
            />
          </div>
        )}

        {item.title ? (
          <h3 className="text-sm font-semibold leading-snug text-foreground line-clamp-2">
            {item.title}
          </h3>
        ) : null}

        <div className="flex-1">{children}</div>

        <div className="flex items-center gap-2 pt-1 text-[11px] text-muted-foreground/60 border-t border-border/30">
          {item.siteName && (
            <span className="font-medium">{item.siteName}</span>
          )}
          {item.siteName && (item.author || item.publishedAt) && (
            <span className="text-border">·</span>
          )}
          {item.author && <span>{item.author}</span>}
          {item.author && item.publishedAt && (
            <span className="text-border">·</span>
          )}
          {item.publishedAt && <span>{formatDate(item.publishedAt)}</span>}
          {!item.siteName && !item.author && !item.publishedAt && (
            <span className="opacity-50">No metadata</span>
          )}
        </div>
      </div>
    </article>
  );
}
