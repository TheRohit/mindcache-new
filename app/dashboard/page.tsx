import { redirect } from "next/navigation";
import { MemoryDashboard } from "@/components/dashboard/memory-dashboard";
import { getServerSession } from "@/lib/session";
import { listMemories } from "@/lib/content-service";

export const dynamic = "force-dynamic";

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

  return <MemoryDashboard initialItems={initialItems} />;
}
