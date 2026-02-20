"use server";

import { revalidatePath } from "next/cache";
import {
  deleteMemory,
  ingestMemory,
  listMemories,
  searchMemories,
  updateMemory,
} from "@/lib/content-service";
import { requireServerUser } from "@/lib/session";
import {
  deleteContentSchema,
  ingestContentSchema,
  searchMemoriesSchema,
  updateContentSchema,
} from "@/lib/validations";

export async function listContentAction(options?: { limit?: number; cursor?: string }) {
  const user = await requireServerUser();
  const memories = await listMemories(user.id, options);
  return memories;
}

export async function ingestContentAction(payload: unknown) {
  const user = await requireServerUser();
  const input = ingestContentSchema.parse(payload);
  const item = await ingestMemory(user.id, input);
  revalidatePath("/dashboard");
  return item;
}

export async function updateContentAction(payload: unknown) {
  const user = await requireServerUser();
  const input = updateContentSchema.parse(payload);
  const item = await updateMemory(user.id, input);
  revalidatePath("/dashboard");
  return item;
}

export async function deleteContentAction(payload: unknown) {
  const user = await requireServerUser();
  const input = deleteContentSchema.parse(payload);
  const item = await deleteMemory(user.id, input);
  revalidatePath("/dashboard");
  return item;
}

export async function searchMemoriesAction(payload: unknown) {
  const user = await requireServerUser();
  const input = searchMemoriesSchema.parse(payload);
  return searchMemories(user.id, input);
}

