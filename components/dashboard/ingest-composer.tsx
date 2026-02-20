"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { IngestContentValues } from "@/lib/validations";
import { cn } from "@/lib/utils";

type SourceType = IngestContentValues["type"];

/* ── Detection ───────────────────────────────────────────── */
function detectType(input: string): SourceType {
  const s = input.trim();
  if (!s) return "note";
  if (/^https?:\/\/(www\.)?(youtube\.com\/watch|youtu\.be\/)/.test(s))
    return "youtube";
  if (/^https?:\/\/(www\.)?(twitter\.com|x\.com)\/\w+\/status\/\d+/.test(s))
    return "tweet";
  if (/^https?:\/\//.test(s)) return "website";
  return "note";
}

/* ── Type badge config ───────────────────────────────────── */
const typeConfig: Record<
  SourceType,
  { label: string; className: string; icon: React.ReactNode }
> = {
  note: {
    label: "Note",
    className: "type-badge-note",
    icon: (
      <svg className="size-3" viewBox="0 0 12 12" fill="none">
        <path
          d="M2 2.5h8M2 5.5h8M2 8.5h5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  website: {
    label: "Website",
    className: "type-badge-website",
    icon: (
      <svg className="size-3" viewBox="0 0 12 12" fill="none">
        <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M6 1.5C6 1.5 4 4 4 6s2 4.5 2 4.5M6 1.5C6 1.5 8 4 8 6s-2 4.5-2 4.5M1.5 6h9"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  youtube: {
    label: "YouTube",
    className: "type-badge-youtube",
    icon: (
      <svg className="size-3" viewBox="0 0 12 12" fill="none">
        <rect
          x="1"
          y="2.5"
          width="10"
          height="7"
          rx="2"
          stroke="currentColor"
          strokeWidth="1.5"
        />
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
};

function TypeChip({ type }: { type: SourceType }) {
  const cfg = typeConfig[type];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-none px-2 py-0.5 text-[11px] font-semibold transition-all",
        cfg.className
      )}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

/* ── Preview card ────────────────────────────────────────── */
interface PreviewData {
  title?: string | null;
  description?: string | null;
  thumbnailUrl?: string | null;
}

function URLPreview({
  preview,
  loading,
}: {
  preview: PreviewData | null;
  loading: boolean;
}) {
  if (!loading && !preview) return null;

  return (
    <div className="mx-3 mb-2 rounded-none border border-dashed border-border bg-muted/40 p-3">
      {loading ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="size-3 animate-spin rounded-full border border-muted-foreground/30 border-t-muted-foreground" />
          Fetching preview…
        </div>
      ) : preview ? (
        <div className="flex gap-3">
          {preview.thumbnailUrl ? (
            <img
              src={preview.thumbnailUrl}
              alt=""
              className="size-16 shrink-0 rounded-none object-cover"
            />
          ) : null}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-snug text-foreground">
              {preview.title ?? "Untitled"}
            </p>
            {preview.description ? (
              <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground leading-relaxed">
                {preview.description}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* ── Main component ──────────────────────────────────────── */
interface SmartIngestProps {
  onSubmit: (payload: IngestContentValues) => Promise<void>;
  isSubmitting: boolean;
}

export function SmartIngest({ onSubmit, isSubmitting }: SmartIngestProps) {
  const [input, setInput] = useState("");
  const [title, setTitle] = useState("");
  const [showTitle, setShowTitle] = useState(false);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const type = detectType(input);
  const isURL = type !== "note";
  const trimmed = input.trim();

  // Auto-grow textarea
  function autoGrow() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }

  // Fetch URL preview with debounce
  useEffect(() => {
    if (!isURL || trimmed.length < 8) {
      setPreview(null);
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      setPreviewLoading(true);
      try {
        const res = await fetch("/api/content/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, url: trimmed }),
          signal: controller.signal,
        });
        if (!res.ok) throw new Error();
        const data = (await res.json()) as { metadata?: PreviewData };
        setPreview(data.metadata ?? null);
      } catch {
        setPreview(null);
      } finally {
        setPreviewLoading(false);
      }
    }, 400);

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [isURL, type, trimmed]);

  function buildPayload(): IngestContentValues | null {
    if (!trimmed) return null;
    switch (type) {
      case "note":
        return {
          type: "note",
          body: trimmed,
          title: title.trim() || undefined,
        };
      case "website":
        return {
          type: "website",
          url: trimmed,
          title: title.trim() || undefined,
        };
      case "youtube":
        return { type: "youtube", url: trimmed };
      case "tweet":
        return { type: "tweet", url: trimmed };
    }
  }

  async function handleSubmit() {
    const payload = buildPayload();
    if (!payload) {
      toast.error("Add something first.");
      return;
    }
    await onSubmit(payload);
    setInput("");
    setTitle("");
    setShowTitle(false);
    setPreview(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-none border-2 border-border bg-card transition-all duration-200 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]",
        "focus-within:-translate-x-0.5 focus-within:-translate-y-0.5 focus-within:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:focus-within:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)]",
        "md:w-3/4 lg:w-1/2 "
      )}
    >
      {/* Optional title row */}
      {showTitle && (
        <div className="border-b border-border/60 px-3 pt-3">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title…"
            className="h-8 border-0 bg-transparent px-0 text-sm font-semibold shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/50"
          />
        </div>
      )}

      {/* Main input */}
      <div className="px-3 pt-3">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            autoGrow();
          }}
          onKeyDown={handleKeyDown}
          placeholder={
            isURL
              ? "Paste URL…"
              : "Write a note, or paste a URL to save a website, YouTube video, or tweet…"
          }
          rows={isURL ? 1 : 3}
          className={cn(
            "w-full resize-none bg-transparent text-sm leading-relaxed outline-none",
            "placeholder:text-muted-foreground/50 text-foreground",
            "transition-all duration-150"
          )}
          style={{ minHeight: isURL ? "28px" : "72px" }}
        />
      </div>

      {/* URL Preview */}
      <URLPreview preview={preview} loading={previewLoading} />

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 px-3 pb-3 pt-1">
        <div className="flex items-center gap-2">
          <TypeChip type={type} />
          {type === "note" && (
            <button
              type="button"
              onClick={() => setShowTitle(!showTitle)}
              className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            >
              {showTitle ? "— title" : "+ title"}
            </button>
          )}
          {trimmed && (
            <span className="hidden text-[11px] text-muted-foreground/50 sm:block">
              ⌘↵ to save
            </span>
          )}
        </div>

        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={isSubmitting || !trimmed}
          className="h-7 px-3 text-xs font-semibold"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-1.5">
              <span className="size-3 animate-spin rounded-full border border-primary-foreground/30 border-t-primary-foreground" />
              Saving
            </span>
          ) : (
            "Save"
          )}
        </Button>
      </div>
    </div>
  );
}

/* ── Legacy compound API shim (used by existing dashboard) ── */
export const Ingest = {
  Root: ({
    children,
    onSubmit,
    isSubmitting,
  }: {
    children: React.ReactNode;
    onSubmit: (p: IngestContentValues) => Promise<void>;
    isSubmitting: boolean;
  }) => <SmartIngest onSubmit={onSubmit} isSubmitting={isSubmitting} />,
  SourceTabs: () => null,
  Fields: () => null,
  Preview: () => null,
};
