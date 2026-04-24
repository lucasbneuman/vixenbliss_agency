import { fetchPublishedFeedItems } from "../../services/directus.ts";
import { FeedItemsProviderError } from "./errors.ts";
import type { FeedItemsProvider } from "./types.ts";

export const directusFeedItemsProvider: FeedItemsProvider = {
  async getFeedItems() {
    try {
      return await fetchPublishedFeedItems();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown Directus error.";

      throw new FeedItemsProviderError(`[feed] Unable to load feed items from Directus.\n${message}`, {
        cause: error,
      });
    }
  },
};
