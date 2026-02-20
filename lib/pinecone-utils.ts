import type { ContentType } from "./content-types";

export function requireEnv(name: string, value: string | undefined) {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function buildUserNamespace(prefix: string, userId: string) {
  return `${prefix}${userId}`;
}

export function toIso(value: Date | string) {
  return value instanceof Date ? value.toISOString() : value;
}

export function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

export function asContentType(value: unknown): ContentType {
  if (value === "note" || value === "website" || value === "youtube" || value === "tweet") {
    return value;
  }
  return "note";
}
