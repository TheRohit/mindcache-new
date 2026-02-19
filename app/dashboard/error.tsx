"use client";

import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-4 p-6 text-center">
      <h2 className="text-xl font-semibold">Dashboard failed to load</h2>
      <p className="text-sm text-muted-foreground">{error.message}</p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}

