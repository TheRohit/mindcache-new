"use client";

import type { BaseCardProps } from "./types";
import { MemoryCardShell } from "./card-shell";
import { SourceLink } from "./source-link";

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
        <SourceLink href={props.item.sourceUrl} label="Watch on YouTube" />
      ) : null}
    </MemoryCardShell>
  );
}
