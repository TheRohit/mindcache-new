import { EMBEDDING_DIMENSIONS } from "./search-config";

const tokenRegex = /[a-z0-9]+/g;

function tokenHash(token: string) {
  let hash = 2166136261;
  for (let i = 0; i < token.length; i += 1) {
    hash ^= token.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash);
}

export function buildEmbedding(text: string) {
  const vector = new Array<number>(EMBEDDING_DIMENSIONS).fill(0);
  const normalized = text.toLowerCase();
  const tokens = normalized.match(tokenRegex) ?? [];

  for (const token of tokens) {
    const idx = tokenHash(token) % EMBEDDING_DIMENSIONS;
    vector[idx] += 1;
  }

  const magnitude = Math.sqrt(vector.reduce((acc, item) => acc + item * item, 0));
  if (magnitude === 0) return vector;

  return vector.map((value) => value / magnitude);
}

