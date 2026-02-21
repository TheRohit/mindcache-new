"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Delete01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DeleteButtonProps {
  onDelete: (id: string) => void;
  id: string;
  deleting: boolean;
}

export function DeleteButton({ onDelete, id, deleting }: DeleteButtonProps) {
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
        <HugeiconsIcon icon={Delete01Icon} size={14} strokeWidth={1.5} />
      )}
    </Button>
  );
}
