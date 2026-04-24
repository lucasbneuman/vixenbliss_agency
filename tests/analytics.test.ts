import test from "node:test";
import assert from "node:assert/strict";

import {
  createAnalyticsAdapter,
  isAnalyticsEnabled,
  trackAnalyticsEvent,
  type AnalyticsAdapter,
} from "../src/lib/analytics.ts";
import { trackEvent, type GtagWindow } from "../src/lib/ga.ts";

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

test("trackEvent is a no-op when GA is unavailable", () => {
  const previousWindow = globalThis.window;

  try {
    delete (globalThis as typeof globalThis & { window?: unknown }).window;

    assert.doesNotThrow(() => {
      trackEvent("reel_impression", { feed_item_id: "item-1" });
    });
  } finally {
    (globalThis as typeof globalThis & { window?: unknown }).window = previousWindow;
  }
});

test("trackEvent sends GA events when gtag exists", () => {
  const calls: unknown[][] = [];
  const previousWindow = globalThis.window;

  try {
    (globalThis as typeof globalThis & { window: GtagWindow }).window = {
      gtag: (...args: unknown[]) => {
        calls.push(args);
      },
    } as GtagWindow;

    trackEvent("cta_click", { cta_url: "https://example.com" });

    assert.deepEqual(calls, [["event", "cta_click", { cta_url: "https://example.com" }]]);
  } finally {
    (globalThis as typeof globalThis & { window?: unknown }).window = previousWindow;
  }
});

test("trackAnalyticsEvent forwards existing events to GA once", () => {
  const calls: unknown[][] = [];
  const adapterCalls: unknown[] = [];
  const previousWindow = globalThis.window;
  const adapter: AnalyticsAdapter = {
    track(event) {
      adapterCalls.push(event);
    },
  };

  try {
    (globalThis as typeof globalThis & { window: GtagWindow }).window = {
      gtag: (...args: unknown[]) => {
        calls.push(args);
      },
    } as GtagWindow;

    trackAnalyticsEvent(
      "reel_active",
      {
        campaign_tag: "spring",
        feed_item_id: "item-1",
        index: 0,
        slug: "intro",
      },
      adapter,
    );

    assert.equal(adapterCalls.length, 1);
    assert.deepEqual(calls, [
      [
        "event",
        "reel_active",
        {
          campaign_tag: "spring",
          feed_item_id: "item-1",
          index: 0,
          slug: "intro",
        },
      ],
    ]);
  } finally {
    (globalThis as typeof globalThis & { window?: unknown }).window = previousWindow;
  }
});
