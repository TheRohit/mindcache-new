import { getLinkPreview } from "link-preview-js";
import { fetchTweet } from "react-tweet/api";
import {
  cacheKeys,
  METADATA_CACHE_TTL_SECONDS,
  TWEET_CACHE_TTL_SECONDS,
} from "./cache/keys";
import { getRedis } from "./cache/redis";
import type { ContentMetadata } from "./content-types";

interface MetadataResult {
  metadata: ContentMetadata;
  body: string;
}

const youtubeRegex =
  /(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/i;

const og = (html: string, property: string) => {
  const pattern = new RegExp(
    `<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["'][^>]*>`,
    "i"
  );
  return html.match(pattern)?.[1];
};

export function getYouTubeVideoId(url: string) {
  return url.match(youtubeRegex)?.[1] ?? null;
}

async function setCache(key: string, value: MetadataResult, ttl: number) {
  const redis = getRedis();
  if (!redis) return;
  await redis.set(key, value, { ex: ttl });
}

async function getCache(key: string) {
  const redis = getRedis();
  if (!redis) return null;
  return redis.get<MetadataResult>(key);
}

export async function extractWebsiteMetadata(
  url: string
): Promise<MetadataResult> {
  const cacheKey = cacheKeys.metadata(url);
  const cached = await getCache(cacheKey);
  if (cached) {
    console.info("cache.metadata.hit", { key: cacheKey, source: "website" });
    return cached;
  }
  console.info("cache.metadata.miss", { key: cacheKey, source: "website" });

  const preview = await getLinkPreview(url, {
    followRedirects: "follow",
  });

  const previewData = Array.isArray(preview) ? preview[0] : preview;
  const response = await fetch(url);
  const html = await response.text();

  const metadata: ContentMetadata = {
    sourceUrl: url,
    canonicalUrl: og(html, "og:url") ?? url,
    siteName: og(html, "og:site_name") ?? previewData?.siteName ?? null,
    author: og(html, "article:author") ?? null,
    publishedAt: og(html, "article:published_time") ?? null,
    thumbnailUrl:
      og(html, "og:image") ??
      previewData?.images?.[0] ??
      previewData?.favicons?.[0] ??
      null,
    faviconUrl: previewData?.favicons?.[0] ?? null,
    title: og(html, "og:title") ?? previewData?.title ?? null,
    description: og(html, "og:description") ?? previewData?.description ?? null,
  };

  const result: MetadataResult = {
    metadata,
    body: [metadata.title, metadata.description, url]
      .filter(Boolean)
      .join("\n"),
  };
  await setCache(cacheKey, result, METADATA_CACHE_TTL_SECONDS);
  return result;
}

export async function extractYouTubeMetadata(
  url: string
): Promise<MetadataResult> {
  const videoId = getYouTubeVideoId(url);
  if (!videoId) {
    throw new Error("Invalid YouTube URL");
  }

  const cacheKey = cacheKeys.metadata(`youtube:${videoId}`);
  const cached = await getCache(cacheKey);
  if (cached) {
    console.info("cache.metadata.hit", { key: cacheKey, source: "youtube" });
    return cached;
  }
  console.info("cache.metadata.miss", { key: cacheKey, source: "youtube" });

  const oembedRes = await fetch(
    `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`
  );
  const oembed = (await oembedRes.json()) as {
    title?: string;
    author_name?: string;
    thumbnail_url?: string;
    provider_name?: string;
  };

  const thumbnail =
    oembed.thumbnail_url ?? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
  const metadata: ContentMetadata = {
    sourceId: videoId,
    sourceUrl: url,
    canonicalUrl: `https://www.youtube.com/watch?v=${videoId}`,
    siteName: oembed.provider_name ?? "YouTube",
    author: oembed.author_name ?? null,
    thumbnailUrl: thumbnail,
    title: oembed.title ?? null,
    description: null,
  };

  const result: MetadataResult = {
    metadata,
    body: [oembed.title ?? "", oembed.author_name ?? "", url]
      .filter(Boolean)
      .join("\n"),
  };
  await setCache(cacheKey, result, METADATA_CACHE_TTL_SECONDS);
  return result;
}

function getTweetId(url: string) {
  const matches = url.match(/status\/(\d+)/i);
  return matches?.[1] ?? null;
}

export async function extractTweetMetadata(
  url: string
): Promise<MetadataResult> {
  const tweetId = getTweetId(url);
  if (!tweetId) {
    throw new Error("Invalid tweet URL");
  }

  const cacheKey = cacheKeys.tweet(tweetId);
  const cached = await getCache(cacheKey);
  if (cached) {
    console.info("cache.metadata.hit", { key: cacheKey, source: "tweet" });
    return cached;
  }
  console.info("cache.metadata.miss", { key: cacheKey, source: "tweet" });

  const { data } = await fetchTweet(tweetId);
  if (!data) {
    throw new Error("Tweet data not found");
  }

  const metadata: ContentMetadata = {
    sourceId: tweetId,
    sourceUrl: url,
    canonicalUrl: `https://x.com/i/status/${tweetId}`,
    siteName: "X",
    author: data.user?.name ?? null,
    publishedAt: data.created_at ?? null,
    thumbnailUrl: data.photos?.[0]?.url ?? null,
    title: data.user?.name ? `Tweet by ${data.user.name}` : "Tweet",
    description: data.text ?? null,
    likeCount: data.favorite_count ?? null,
    replyCount: data.conversation_count ?? null,
  };

  const result: MetadataResult = {
    metadata,
    body: [data.text ?? "", data.user?.name ?? "", url]
      .filter(Boolean)
      .join("\n"),
  };
  await setCache(cacheKey, result, TWEET_CACHE_TTL_SECONDS);
  return result;
}
