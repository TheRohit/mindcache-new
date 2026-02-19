import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { extractTweetMetadata, extractWebsiteMetadata, extractYouTubeMetadata } from "@/lib/metadata";
import {
  noteIngestSchema,
  tweetIngestSchema,
  websiteIngestSchema,
  youtubeIngestSchema,
} from "@/lib/validations";

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
  const type = payload?.type as string | undefined;

  if (type === "website") {
    const parsed = websiteIngestSchema.parse(payload);
    const result = await extractWebsiteMetadata(parsed.url);
    return NextResponse.json(result);
  }

  if (type === "youtube") {
    const parsed = youtubeIngestSchema.parse(payload);
    const result = await extractYouTubeMetadata(parsed.url);
    return NextResponse.json(result);
  }

  if (type === "tweet") {
    const parsed = tweetIngestSchema.parse(payload);
    const result = await extractTweetMetadata(parsed.url);
    return NextResponse.json(result);
  }

  if (type === "note") {
    const parsed = noteIngestSchema.parse(payload);
    return NextResponse.json({
      metadata: {
        title: parsed.title ?? "Untitled Note",
        description: parsed.body.slice(0, 180),
      },
      body: parsed.body,
    });
  }

  return NextResponse.json({ error: "Unsupported type" }, { status: 400 });
}

