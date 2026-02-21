import { Suspense } from "react";
import { redirect } from "next/navigation";
import { MemoryDashboard } from "@/components/dashboard/memory-dashboard";
import { getServerSession } from "@/lib/session";
import { listMemories } from "@/lib/content-service";
import { ServerTweetEmbed } from "@/components/tweet/server-tweet-embed";
import { TweetSkeleton } from "@/components/tweet/magic-tweet";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 18) return "Good Afternoon";
  return "Good Evening";
}

export default async function DashboardPage() {
  const session = await getServerSession();
  if (!session?.user) {
    redirect("/sign-in");
  }

  const rows = await listMemories(session.user.id);
  const initialItems = rows.map((item) => ({
    id: item.id,
    type: item.type,
    body: item.body,
    sourceUrl: item.sourceUrl,
    siteName: item.siteName,
    author: item.author,
    publishedAt: item.publishedAt?.toISOString() ?? null,
    thumbnailUrl: item.thumbnailUrl,
    title: item.title,
    description: item.description,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  }));

  const firstName = (session.user.name ?? "").split(" ")[0] || "there";

  const tweetEmbeds: Record<string, React.ReactNode> = {};
  for (const item of initialItems) {
    if (item.type === "tweet") {
      const tweetId = item.sourceUrl?.match(/status\/(\d+)/)?.[1];
      if (tweetId) {
        tweetEmbeds[tweetId] = (
          <Suspense fallback={<TweetSkeleton />}>
            <ServerTweetEmbed id={tweetId} />
          </Suspense>
        );
      }
    }
  }

  return (
    <div className="flex w-full flex-col items-center gap-12 px-4 py-16 sm:px-6 sm:py-12">
      <div className="flex w-full flex-col items-center gap-8">
        <h1 className="text-shadow-neo scroll-m-20 text-4xl font-extrabold tracking-tight text-orange-400 lg:text-5xl">
          {getGreeting()},{" "}
          <span className="text-[#51b8ff]">{firstName}</span>
        </h1>

        <MemoryDashboard
          initialItems={initialItems}
          tweetEmbeds={tweetEmbeds}
        />
      </div>
    </div>
  );
}
