import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { SEARCH_RESULT_LIMIT } from "@/lib/search-config";
import { searchMemories } from "@/lib/content-service";
import { searchMemoriesSchema } from "@/lib/validations";

async function getRouteUser(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  return session?.user ?? null;
}

export async function POST(request: Request) {
  const user = await getRouteUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json();
  const input = searchMemoriesSchema.parse(payload);
  const results = await searchMemories(user.id, input);
  return NextResponse.json({ results });
}

export async function GET(request: Request) {
  const user = await getRouteUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";
  const limit = Number(searchParams.get("limit") ?? SEARCH_RESULT_LIMIT);
  const input = searchMemoriesSchema.parse({ query, limit });
  const results = await searchMemories(user.id, input);
  return NextResponse.json({ results });
}

