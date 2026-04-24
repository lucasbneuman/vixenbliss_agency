import type { FeedItem } from "../../types/feed-item.ts";

export interface FeedItemsProvider {
  getFeedItems(): Promise<FeedItem[]>;
}
