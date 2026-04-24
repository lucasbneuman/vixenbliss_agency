import { mockFeedItems } from "./mock-feed-items.ts";
import type { FeedItemsProvider } from "./types.ts";

export const mockFeedItemsProvider: FeedItemsProvider = {
  async getFeedItems() {
    return mockFeedItems;
  },
};
