"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { LinkSquare01Icon } from "@hugeicons/core-free-icons";

interface SourceLinkProps {
  href: string;
  label: string;
}

export function SourceLink({ href, label }: SourceLinkProps) {
  return (
    <a
      className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:text-primary/80 transition-colors"
      href={href}
      target="_blank"
      rel="noreferrer"
    >
      {label}
      <HugeiconsIcon icon={LinkSquare01Icon} size={12} strokeWidth={1.5} />
    </a>
  );
}
