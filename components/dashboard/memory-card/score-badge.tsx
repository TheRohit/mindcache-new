"use client";

export function ScoreBadge({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  return (
    <span className="inline-flex items-center gap-1 rounded-none border border-primary/20 bg-primary/8 px-2 py-0.5 text-[11px] font-semibold text-primary">
      <span className="size-1.5 rounded-full bg-primary" />
      {pct}%
    </span>
  );
}
