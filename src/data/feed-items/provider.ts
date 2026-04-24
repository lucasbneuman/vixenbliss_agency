import { getContentSource } from "../../lib/env.ts";
import { directusFeedItemsProvider } from "./directus-provider.ts";
import type { FeedItemsProvider } from "./types.ts";

export function getFeedItemsProvider(): FeedItemsProvider {
  getContentSource();
  return directusFeedItemsProvider;
}
