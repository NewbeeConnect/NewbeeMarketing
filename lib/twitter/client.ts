/**
 * Twitter/X Client for Newbee Marketing Hub
 *
 * Uses OAuth 1.0a via twitter-api-v2 for posting as @newbeeconnect.
 * This is separate from the social hub OAuth 2.0 flow — it uses
 * app-level keys from .env.local for direct automated tweeting.
 */

import { TwitterApi } from "twitter-api-v2";

let _client: TwitterApi | null = null;

export function getTwitterClient(): TwitterApi | null {
  if (_client) return _client;

  const appKey = process.env.X_API_KEY;
  const appSecret = process.env.X_API_SECRET;
  const accessToken = process.env.X_ACCESS_TOKEN;
  const accessSecret = process.env.X_ACCESS_TOKEN_SECRET;

  if (!appKey || !appSecret || !accessToken || !accessSecret) {
    return null;
  }

  _client = new TwitterApi({ appKey, appSecret, accessToken, accessSecret });
  return _client;
}

export interface TweetResult {
  success: boolean;
  tweetId?: string;
  tweetUrl?: string;
  error?: string;
}

export async function postTweet(text: string): Promise<TweetResult> {
  const client = getTwitterClient();
  if (!client) {
    return { success: false, error: "Twitter API credentials not configured" };
  }

  try {
    const result = await client.v2.tweet(text);
    const tweetId = result.data.id;
    return {
      success: true,
      tweetId,
      tweetUrl: `https://x.com/newbeeconnect/status/${tweetId}`,
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return { success: false, error: message };
  }
}

export async function postThread(tweets: string[]): Promise<TweetResult> {
  const client = getTwitterClient();
  if (!client) {
    return { success: false, error: "Twitter API credentials not configured" };
  }

  if (tweets.length === 0) {
    return { success: false, error: "No tweets provided" };
  }

  if (tweets.length === 1) {
    return postTweet(tweets[0]);
  }

  try {
    const result = await client.v2.tweetThread(tweets);
    const firstTweet = result[0];
    const tweetId = firstTweet.data.id;
    return {
      success: true,
      tweetId,
      tweetUrl: `https://x.com/newbeeconnect/status/${tweetId}`,
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return { success: false, error: message };
  }
}

export async function deleteTweet(tweetId: string): Promise<{ success: boolean; error?: string }> {
  const client = getTwitterClient();
  if (!client) {
    return { success: false, error: "Twitter API credentials not configured" };
  }

  try {
    await client.v2.deleteTweet(tweetId);
    return { success: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return { success: false, error: message };
  }
}
