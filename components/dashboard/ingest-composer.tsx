"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  NoteIcon,
  GlobeIcon,
  YoutubeIcon,
  NewTwitterIcon,
  PlayIcon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { IngestContentValues } from "@/lib/validations";
import { cn, detectType, type SourceType } from "@/lib/utils";

/* ── Type badge config ───────────────────────────────────── */
const typeConfig: Record<
  SourceType,
  { label: string; className: string; icon: React.ComponentProps<typeof HugeiconsIcon>["icon"] }
> = {
  note: { label: "Note", className: "type-badge-note", icon: NoteIcon },
  website: { label: "Website", className: "type-badge-website", icon: GlobeIcon },
  youtube: { label: "YouTube", className: "type-badge-youtube", icon: YoutubeIcon },
  tweet: { label: "Tweet", className: "type-badge-tweet", icon: NewTwitterIcon },
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
      <HugeiconsIcon icon={cfg.icon} size={12} strokeWidth={2} />
      {cfg.label}
    </span>
  );
}

/* ── Preview card ────────────────────────────────────────── */
interface PreviewData {
  title?: string | null;
  description?: string | null;
  thumbnailUrl?: string | null;
  siteName?: string | null;
  author?: string | null;
  faviconUrl?: string | null;
  likeCount?: number | null;
  replyCount?: number | null;
}

function YouTubePreview({ preview }: { preview: PreviewData }) {
  return (
    <div className="flex flex-col gap-0 overflow-hidden">
      {preview.thumbnailUrl && (
        <div className="relative w-full overflow-hidden bg-black" style={{ aspectRatio: "16/9" }}>
          <Image
            src={preview.thumbnailUrl}
            alt={preview.title ?? "YouTube thumbnail"}
            fill
            className="object-cover opacity-90"
            unoptimized
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <div className="flex size-12 items-center justify-center rounded-full bg-red-600/90 shadow-lg backdrop-blur-sm">
              <HugeiconsIcon icon={PlayIcon} size={20} className="translate-x-0.5 text-white" />
            </div>
          </div>
        </div>
      )}
      <div className="p-3">
        {preview.title && (
          <p className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">
            {preview.title}
          </p>
        )}
        {(preview.author || preview.siteName) && (
          <p className="mt-1 text-xs text-muted-foreground">
            {preview.author ?? preview.siteName}
            {preview.author && preview.siteName && preview.author !== preview.siteName && (
              <span className="text-muted-foreground/50"> · {preview.siteName}</span>
            )}
          </p>
        )}
      </div>
    </div>
  );
}

function WebsitePreview({ preview, url }: { preview: PreviewData; url: string }) {
  const hostname = (() => {
    try { return new URL(url).hostname.replace(/^www\./, ""); }
    catch { return url; }
  })();

  return (
    <div className="flex flex-col gap-0 overflow-hidden">
      {preview.thumbnailUrl && (
        <div className="relative h-36 w-full overflow-hidden bg-muted">
          <Image
            src={preview.thumbnailUrl}
            alt={preview.title ?? "Preview"}
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      )}
      <div className="p-3">
        <div className="mb-1.5 flex items-center gap-1.5">
          {preview.faviconUrl && (
            <Image
              src={preview.faviconUrl}
              alt=""
              width={14}
              height={14}
              className="size-3.5 rounded-sm object-contain"
              unoptimized
            />
          )}
          <span className="text-[11px] font-medium text-muted-foreground">
            {preview.siteName ?? hostname}
          </span>
        </div>
        {preview.title && (
          <p className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">
            {preview.title}
          </p>
        )}
        {preview.description && (
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {preview.description}
          </p>
        )}
      </div>
    </div>
  );
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function TweetPreview({ preview, url }: { preview: PreviewData | null; url: string }) {
  const handle = url.match(/(?:twitter\.com|x\.com)\/([^/]+)\/status/)?.[1];
  return (
    <div className="flex flex-col gap-0">
      <div className="flex items-start gap-2.5 p-3 pb-2">
        <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted-foreground/15 text-[11px] font-bold text-muted-foreground">
          {preview?.author?.[0]?.toUpperCase() ?? handle?.[0]?.toUpperCase() ?? "X"}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-1.5">
            {preview?.author && (
              <span className="text-xs font-semibold text-foreground">{preview.author}</span>
            )}
            {handle && (
              <span className="text-[11px] text-muted-foreground">@{handle}</span>
            )}
          </div>
          {preview?.description ? (
            <p className="mt-0.5 line-clamp-3 text-xs leading-relaxed text-foreground/80">
              {preview.description}
            </p>
          ) : (
            <p className="mt-0.5 text-[11px] text-muted-foreground/60">Loading tweet…</p>
          )}
        </div>
      </div>

      {preview?.thumbnailUrl && (
        <div className="relative mx-3 mb-2 h-32 overflow-hidden rounded-none border border-border/40 bg-muted">
          <Image
            src={preview.thumbnailUrl}
            alt=""
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      )}

      {(preview?.likeCount != null || preview?.replyCount != null) && (
        <div className="flex items-center gap-3 border-t border-border/30 px-3 py-2">
          {preview.replyCount != null && (
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              {formatCount(preview.replyCount)}
            </span>
          )}
          {preview.likeCount != null && (
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              {formatCount(preview.likeCount)}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function URLPreview({
  preview,
  loading,
  type,
  url,
}: {
  preview: PreviewData | null;
  loading: boolean;
  type: SourceType;
  url: string;
}) {
  if (!loading && !preview) return null;

  return (
    <div className="mx-3 mb-2 overflow-hidden rounded-none border border-dashed border-border bg-muted/40">
      {loading ? (
        <div className="flex items-center gap-2 p-3 text-xs text-muted-foreground">
          <span className="size-3 animate-spin rounded-full border border-muted-foreground/30 border-t-muted-foreground" />
          Fetching preview…
        </div>
      ) : type === "tweet" && preview ? (
        <TweetPreview preview={preview} url={url} />
      ) : type === "youtube" && preview ? (
        <YouTubePreview preview={preview} />
      ) : type === "website" && preview ? (
        <WebsitePreview preview={preview} url={url} />
      ) : null}
    </div>
  );
}

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
        "md:w-1/2 w-full "
      )}
    >
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
          style={{ minHeight: isURL ? "28px" : "120px" }}
        />
      </div>

      {/* URL Preview */}
      <URLPreview preview={preview} loading={previewLoading} type={type} url={trimmed} />

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
    onSubmit,
    isSubmitting,
  }: {
    children?: React.ReactNode;
    onSubmit: (p: IngestContentValues) => Promise<void>;
    isSubmitting: boolean;
  }) => <SmartIngest onSubmit={onSubmit} isSubmitting={isSubmitting} />,
  SourceTabs: () => null,
  Fields: () => null,
  Preview: () => null,
};
