import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ingestMemory, listMemories } from "@/lib/content-service";
import { ingestContentSchema } from "@/lib/validations";

async function getRouteUser(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  return session?.user ?? null;
}

export async function GET(request: Request) {
  const user = await getRouteUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const items = await listMemories(user.id);
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const user = await getRouteUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json();
  const input = ingestContentSchema.parse(payload);
  const item = await ingestMemory(user.id, input);
  return NextResponse.json({ item }, { status: 201 });
}

