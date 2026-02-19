"use client";

import { createContext, use, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { IngestContentValues } from "@/lib/validations";
import { cn } from "@/lib/utils";

type SourceType = IngestContentValues["type"];

interface IngestContextValue {
  sourceType: SourceType;
  setSourceType: (value: SourceType) => void;
  values: Record<string, string>;
  setValue: (name: string, value: string) => void;
  preview: { title?: string | null; description?: string | null; thumbnailUrl?: string | null } | null;
  previewLoading: boolean;
  buildPayload: () => IngestContentValues | null;
}

const IngestContext = createContext<IngestContextValue | null>(null);

function useIngestContext() {
  const ctx = use(IngestContext);
  if (!ctx) throw new Error("Ingest compound components must be used inside <Ingest.Root>");
  return ctx;
}

function IngestRoot({
  children,
  onSubmit,
  isSubmitting,
}: {
  children: React.ReactNode;
  onSubmit: (payload: IngestContentValues) => Promise<void>;
  isSubmitting: boolean;
}) {
  const [sourceType, setSourceType] = useState<SourceType>("note");
  const [values, setValues] = useState<Record<string, string>>({
    title: "",
    body: "",
    url: "",
    description: "",
  });
  const [previewLoading, setPreviewLoading] = useState(false);
  const [preview, setPreview] = useState<IngestContextValue["preview"]>(null);

  const shouldPreview = sourceType !== "note" && values.url.length > 6;

  useEffect(() => {
    if (!shouldPreview) {
      setPreview(null);
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      setPreviewLoading(true);
      try {
        const response = await fetch("/api/content/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: sourceType,
            url: values.url,
            title: values.title,
            body: values.body,
            description: values.description,
          }),
          signal: controller.signal,
        });

        if (!response.ok) throw new Error("Preview failed");
        const data = (await response.json()) as {
          metadata?: { title?: string | null; description?: string | null; thumbnailUrl?: string | null };
        };
        setPreview(data.metadata ?? null);
      } catch {
        setPreview(null);
      } finally {
        setPreviewLoading(false);
      }
    }, 350);

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [sourceType, values.url, values.title, values.body, values.description, shouldPreview]);

  const buildPayload = (): IngestContentValues | null => {
    if (sourceType === "note") {
      if (!values.body.trim()) return null;
      return {
        type: "note",
        body: values.body.trim(),
        title: values.title.trim() || undefined,
      };
    }
    if (sourceType === "website") {
      if (!values.url.trim()) return null;
      return {
        type: "website",
        url: values.url.trim(),
        title: values.title.trim() || undefined,
        description: values.description.trim() || undefined,
      };
    }
    if (sourceType === "youtube") {
      if (!values.url.trim()) return null;
      return { type: "youtube", url: values.url.trim(), title: values.title.trim() || undefined };
    }
    if (!values.url.trim()) return null;
    return { type: "tweet", url: values.url.trim(), body: values.body.trim() || undefined };
  };

  const contextValue: IngestContextValue = {
    sourceType,
    setSourceType,
    values,
    setValue: (name, value) => {
      setValues((prev) => ({ ...prev, [name]: value }));
    },
    preview,
    previewLoading,
    buildPayload,
  };

  async function handleSubmit() {
    const payload = buildPayload();
    if (!payload) {
      toast.error("Please fill in required fields before ingesting.");
      return;
    }
    await onSubmit(payload);
    setValues({ title: "", body: "", url: "", description: "" });
    setPreview(null);
  }

  return (
    <IngestContext value={contextValue}>
      <Card>
        <CardHeader>
          <CardTitle>Add Memory</CardTitle>
          <CardDescription>Capture notes, websites, YouTube videos, and tweets.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {children}
          <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Ingesting..." : "Ingest Memory"}
          </Button>
        </CardContent>
      </Card>
    </IngestContext>
  );
}

function IngestSourceTabs() {
  const { sourceType, setSourceType } = useIngestContext();
  const tabs: SourceType[] = ["note", "website", "youtube", "tweet"];
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {tabs.map((tab) => (
        <Button
          key={tab}
          type="button"
          variant={sourceType === tab ? "default" : "outline"}
          className="capitalize"
          onClick={() => setSourceType(tab)}
        >
          {tab}
        </Button>
      ))}
    </div>
  );
}

function IngestFields() {
  const { sourceType, values, setValue } = useIngestContext();

  if (sourceType === "note") {
    return (
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="note-title">Title (optional)</Label>
          <Input id="note-title" value={values.title} onChange={(event) => setValue("title", event.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="note-body">Note</Label>
          <Textarea
            id="note-body"
            value={values.body}
            rows={6}
            onChange={(event) => setValue("body", event.target.value)}
          />
        </div>
      </div>
    );
  }

  if (sourceType === "website") {
    return (
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="website-url">Website URL</Label>
          <Input id="website-url" value={values.url} onChange={(event) => setValue("url", event.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="website-title">Title override (optional)</Label>
          <Input id="website-title" value={values.title} onChange={(event) => setValue("title", event.target.value)} />
        </div>
      </div>
    );
  }

  if (sourceType === "youtube") {
    return (
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="youtube-url">YouTube URL</Label>
          <Input id="youtube-url" value={values.url} onChange={(event) => setValue("url", event.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="youtube-title">Title override (optional)</Label>
          <Input id="youtube-title" value={values.title} onChange={(event) => setValue("title", event.target.value)} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="tweet-url">Tweet URL</Label>
        <Input id="tweet-url" value={values.url} onChange={(event) => setValue("url", event.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="tweet-notes">Notes (optional)</Label>
        <Textarea
          id="tweet-notes"
          rows={3}
          value={values.body}
          onChange={(event) => setValue("body", event.target.value)}
        />
      </div>
    </div>
  );
}

function IngestPreview() {
  const { preview, previewLoading } = useIngestContext();

  return (
    <div className="rounded-lg border border-dashed p-3">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Preview</p>
      {previewLoading ? <p className="text-sm text-muted-foreground">Extracting metadata...</p> : null}
      {!preview && !previewLoading ? <p className="text-sm text-muted-foreground">No preview yet.</p> : null}
      {preview ? (
        <div className="space-y-2">
          <p className="text-sm font-medium">{preview.title ?? "Untitled"}</p>
          {preview.description ? <p className="text-sm text-muted-foreground">{preview.description}</p> : null}
          {preview.thumbnailUrl ? (
            <img
              src={preview.thumbnailUrl}
              alt="Preview thumbnail"
              className={cn("h-28 w-full rounded-md border object-cover")}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export const Ingest = {
  Root: IngestRoot,
  SourceTabs: IngestSourceTabs,
  Fields: IngestFields,
  Preview: IngestPreview,
};

