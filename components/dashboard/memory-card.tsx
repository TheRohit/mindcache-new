"use client";

import { Tweet } from "react-tweet";
import type { SearchResultItem } from "@/lib/content-types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type CardItem = {
  id: string;
  type: SearchResultItem["type"];
  body: string;
  title: string | null;
  description: string | null;
  sourceUrl: string | null;
  thumbnailUrl: string | null;
  siteName: string | null;
  author: string | null;
  publishedAt: string | null;
  score?: number;
};

interface BaseCardProps {
  item: CardItem;
  onDelete: (id: string) => void;
  deleting: boolean;
}

function formatDate(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString();
}

function MemoryCardShell({ item, children, onDelete, deleting }: React.PropsWithChildren<BaseCardProps>) {
  return (
    <Card className="overflow-hidden">
      {item.thumbnailUrl ? (
        <div className="h-40 w-full bg-muted">
          <img src={item.thumbnailUrl} alt={item.title ?? "Memory thumbnail"} className="h-full w-full object-cover" />
        </div>
      ) : null}
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <Badge variant="secondary" className="capitalize">
            {item.type}
          </Badge>
          {typeof item.score === "number" ? (
            <Badge variant="outline">Score {item.score.toFixed(2)}</Badge>
          ) : null}
        </div>
        <CardTitle className="text-base">{item.title ?? "Untitled memory"}</CardTitle>
        {item.description ? <CardDescription>{item.description}</CardDescription> : null}
      </CardHeader>
      <CardContent className="space-y-3">
        {children}
        <div className="flex items-center justify-between gap-3 pt-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            {item.siteName ? <span>{item.siteName}</span> : null}
            {item.author ? <span>{item.author}</span> : null}
            {item.publishedAt ? <span>{formatDate(item.publishedAt)}</span> : null}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className={cn("h-auto p-1 text-destructive", deleting && "opacity-60")}
            onClick={() => onDelete(item.id)}
            disabled={deleting}
          >
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function NoteCard(props: BaseCardProps) {
  return <MemoryCardShell {...props}><p className="text-sm text-foreground/90 whitespace-pre-wrap">{props.item.body}</p></MemoryCardShell>;
}

export function WebsiteCard(props: BaseCardProps) {
  return (
    <MemoryCardShell {...props}>
      <p className="text-sm text-foreground/90 line-clamp-4">{props.item.body}</p>
      {props.item.sourceUrl ? (
        <a className="text-xs text-primary underline-offset-4 hover:underline" href={props.item.sourceUrl} target="_blank" rel="noreferrer">
          Open source
        </a>
      ) : null}
    </MemoryCardShell>
  );
}

export function YouTubeCard(props: BaseCardProps) {
  return (
    <MemoryCardShell {...props}>
      <p className="text-sm text-foreground/90 line-clamp-4">{props.item.body}</p>
      {props.item.sourceUrl ? (
        <a className="text-xs text-primary underline-offset-4 hover:underline" href={props.item.sourceUrl} target="_blank" rel="noreferrer">
          Watch on YouTube
        </a>
      ) : null}
    </MemoryCardShell>
  );
}

export function TweetCard(props: BaseCardProps) {
  const tweetId = props.item.sourceUrl?.match(/status\/(\d+)/)?.[1];
  return (
    <MemoryCardShell {...props}>
      {tweetId ? (
        <div className="[&_.react-tweet-theme]:w-full" data-theme="dark">
          <Tweet id={tweetId} />
        </div>
      ) : (
        <p className="text-sm text-foreground/90 line-clamp-4">{props.item.body}</p>
      )}
      {props.item.sourceUrl ? (
        <a className="text-xs text-primary underline-offset-4 hover:underline" href={props.item.sourceUrl} target="_blank" rel="noreferrer">
          Open tweet
        </a>
      ) : null}
    </MemoryCardShell>
  );
}

