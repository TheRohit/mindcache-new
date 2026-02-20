const parseNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const SIMILARITY_THRESHOLD = parseNumber(
  process.env.SIMILARITY_THRESHOLD,
  0.2,
);

export const SEARCH_RESULT_LIMIT = parseNumber(
  process.env.SEARCH_RESULT_LIMIT,
  20,
);

