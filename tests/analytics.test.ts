import test from "node:test";
import assert from "node:assert/strict";

import {
  createAnalyticsAdapter,
  isAnalyticsEnabled,
  trackAnalyticsEvent,
  type AnalyticsAdapter,
} from "../src/lib/analytics.ts";

test("analytics is enabled unless PUBLIC_ANALYTICS_ENABLED is explicitly false", () => {
  assert.equal(isAnalyticsEnabled(undefined), true);
  assert.equal(isAnalyticsEnabled("true"), true);
  assert.equal(isAnalyticsEnabled(" TRUE "), true);
  assert.equal(isAnalyticsEnabled("false"), false);
});

test("analytics uses console adapter in development when enabled", () => {
  const events: unknown[] = [];
  const adapter = createAnalyticsAdapter({
    enabled: true,
    isDev: true,
    logger: (...args) => events.push(args),
  });

  adapter.track({
    name: "reel_active",
    payload: {
      campaign_tag: "spring",
      feed_item_id: "item-1",
      index: 0,
      slug: "intro",
    },
  });

  assert.equal(events.length, 1);
});

test("analytics uses no-op adapter in production without a provider", () => {
  const events: unknown[] = [];
  const adapter = createAnalyticsAdapter({
    enabled: true,
    isDev: false,
    logger: (...args) => events.push(args),
  });

  adapter.track({
    name: "reel_impression",
    payload: {
      campaign_tag: "spring",
      feed_item_id: "item-1",
      index: 0,
      slug: "intro",
    },
  });

  assert.equal(events.length, 0);
});

test("trackAnalyticsEvent never propagates adapter errors", () => {
  const failingAdapter: AnalyticsAdapter = {
    track() {
      throw new Error("Provider failed");
    },
  };

  assert.doesNotThrow(() => {
    trackAnalyticsEvent(
      "cta_click",
      {
        campaign_tag: "spring",
        cta_url: "https://example.com",
        feed_item_id: "item-1",
        index: 0,
        slug: "intro",
      },
      failingAdapter,
    );
  });
});
