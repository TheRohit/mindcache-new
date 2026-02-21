"use client";

import type { BaseCardProps } from "./types";
import { MemoryCardShell } from "./card-shell";

export function NoteCard(props: BaseCardProps) {
  return (
    <MemoryCardShell {...props}>
      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-5 whitespace-pre-wrap">
        {props.item.body}
      </p>
    </MemoryCardShell>
  );
}
