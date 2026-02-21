"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  NoteIcon,
  GlobeIcon,
  YoutubeIcon,
  NewTwitterIcon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import type { CardItem } from "./types";

const typeConfig = {
  note: {
    label: "Note",
    className: "type-badge-note",
    icon: NoteIcon,
  },
  website: {
    label: "Website",
    className: "type-badge-website",
    icon: GlobeIcon,
  },
  youtube: {
    label: "YouTube",
    className: "type-badge-youtube",
    icon: YoutubeIcon,
  },
  tweet: {
    label: "Tweet",
    className: "type-badge-tweet",
    icon: NewTwitterIcon,
  },
} as const;

export function TypeBadge({ type }: { type: CardItem["type"] }) {
  const config = typeConfig[type];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-none px-2 py-0.5 text-[11px] font-semibold",
        config.className,
      )}
    >
      <HugeiconsIcon icon={config.icon} size={12} strokeWidth={2} />
      {config.label}
    </span>
  );
}
