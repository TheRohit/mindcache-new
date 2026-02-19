import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { deleteMemory, updateMemory } from "@/lib/content-service";
import { updateContentSchema } from "@/lib/validations";

interface RouteParams {
  params: Promise<{ id: string }>;
}

async function getRouteUser(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  return session?.user ?? null;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const user = await getRouteUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const input = updateContentSchema.parse({
    ...body,
    id,
  });
  const item = await updateMemory(user.id, input);
  if (!item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ item });
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const user = await getRouteUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const item = await deleteMemory(user.id, { id });
  if (!item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ item });
}

