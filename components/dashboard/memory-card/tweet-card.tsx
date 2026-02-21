"use client";

import { ClientTweetCard } from "@/components/tweet/client-tweet";
import type { BaseCardProps } from "./types";
import { MemoryCardShell } from "./card-shell";
import { SourceLink } from "./source-link";

interface TweetCardProps extends BaseCardProps {
  tweetEmbeds?: Record<string, React.ReactNode>;
}

export function TweetCard({ tweetEmbeds, ...props }: TweetCardProps) {
  const tweetId = props.item.sourceUrl?.match(/status\/(\d+)/)?.[1];
  const serverEmbed = tweetId ? tweetEmbeds?.[tweetId] : undefined;

  return (
    <MemoryCardShell {...props} item={{ ...props.item, thumbnailUrl: null }}>
      {tweetId ? (
        <div
          className="[&_.react-tweet-theme]:w-full! [&_.react-tweet-theme]:m-0! [&_.react-tweet-theme]:rounded-none! overflow-hidden"
          data-theme="dark"
        >
          {serverEmbed ?? <ClientTweetCard id={tweetId} />}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">
          {props.item.body}
        </p>
      )}
      {props.item.sourceUrl && !tweetId ? (
        <SourceLink href={props.item.sourceUrl} label="Open tweet" />
      ) : null}
    </MemoryCardShell>
  );
}
