const parseTtl = (value: string | undefined, fallback: number) => {
  const ttl = Number(value);
  return Number.isFinite(ttl) ? ttl : fallback;
};

export const METADATA_CACHE_TTL_SECONDS = parseTtl(
  process.env.METADATA_CACHE_TTL_SECONDS,
  60 * 60 * 24,
);

export const TWEET_CACHE_TTL_SECONDS = parseTtl(
  process.env.TWEET_CACHE_TTL_SECONDS,
  60 * 60 * 12,
);

export const cacheKeys = {
  metadata: (url: string) => `metadata:${url}`,
  tweet: (tweetId: string) => `tweet:${tweetId}`,
  extractionRetry: (url: string) => `extract:retry:${url}`,
} as const;

