import { getTweet } from "react-tweet/api";
import { MagicTweet, TweetNotFound } from "./magic-tweet";

export async function ServerTweetEmbed({ id }: { id: string }) {
  const tweet = await getTweet(id);
  if (!tweet) return <TweetNotFound />;
  return <MagicTweet tweet={tweet} />;
}
