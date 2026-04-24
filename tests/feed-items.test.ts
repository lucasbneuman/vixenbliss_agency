import test from "node:test";
import assert from "node:assert/strict";

import { fetchPublishedFeedItems, getFeedItemsEndpoint, mapDirectusFeedItem } from "../src/services/directus.ts";
import { getFeedItemsProvider } from "../src/data/feed-items/provider.ts";
import { getBunnyEmbedUrl } from "../src/lib/bunny.ts";
import { env, getContentSource } from "../src/lib/env.ts";

test("Directus provider is selected when CONTENT_SOURCE=directus", () => {
  env.CONTENT_SOURCE = "directus";

  const provider = getFeedItemsProvider();

  assert.equal(typeof provider.getFeedItems, "function");
});

test("CONTENT_SOURCE=mock is rejected in runtime configuration", () => {
  env.CONTENT_SOURCE = "mock";

  assert.throws(() => getContentSource(), /Only CONTENT_SOURCE=directus is supported/);
});

test("invalid CONTENT_SOURCE throws a clear configuration error", () => {
  env.CONTENT_SOURCE = "staging";

  assert.throws(() => getContentSource(), /Invalid CONTENT_SOURCE/);
});

test("Directus endpoint includes published filter, fields, and expected sort order", () => {
  env.CONTENT_SOURCE = "directus";
  env.DIRECTUS_URL = "https://cms.example.com";

  const endpoint = getFeedItemsEndpoint();

  assert.equal(endpoint.origin, "https://cms.example.com");
  assert.equal(endpoint.pathname, "/items/feed_items");
  assert.equal(endpoint.searchParams.get("filter[status][_eq]"), "published");
  assert.equal(endpoint.searchParams.get("fields"), "*");
  assert.deepEqual(endpoint.searchParams.getAll("sort[]"), ["-is_featured", "sort_order", "-published_at"]);
});

test("Directus mapper returns a clean FeedItem with safe fallbacks", () => {
  const item = mapDirectusFeedItem({
    id: 1,
    status: "published",
    title: "VB Teaser 01",
    slug: "vb-teaser-01",
    caption_short: "Short caption",
    caption_long: null,
    thumbnail_url: "",
    bunny_video_id: "",
    bunny_embed_url: null,
    cta_text: "",
    cta_url: "",
    sort_order: null,
    published_at: "2026-04-23T10:00:00.000Z",
    is_featured: true,
    campaign_tag: "launch",
    created_at: "2026-04-24T00:58:54.308Z",
    updated_at: null,
  });

  assert.equal(item?.id, "1");
  assert.equal(item?.caption_long, "");
  assert.equal(item?.thumbnail_url, "");
  assert.equal(item?.bunny_video_id, "");
  assert.equal(item?.cta_text, "Ver mas");
  assert.equal(item?.cta_url, "#");
  assert.equal(item?.sort_order, 0);
});

test("Directus mapper drops items without minimum renderable structure", () => {
  const item = mapDirectusFeedItem({
    id: 1,
    status: "draft",
    title: "",
  });

  assert.equal(item, null);
});

test("Directus fetch uses the public API without an auth token and returns mapped items", async () => {
  env.CONTENT_SOURCE = "directus";
  env.DIRECTUS_URL = "https://cms.example.com";

  const originalFetch = globalThis.fetch;
  let receivedHeaders: HeadersInit | undefined;

  globalThis.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
    receivedHeaders = init?.headers;

    return new Response(
      JSON.stringify({
        data: [
          {
            id: 2,
            status: "published",
            title: "Live item",
            slug: "live-item",
            caption_short: "Real Directus content",
            thumbnail_url: "https://example.com/thumb.jpg",
            bunny_video_id: "video-2",
            cta_text: "Open",
            cta_url: "https://example.com",
            sort_order: 1,
            published_at: "2026-04-23T11:00:00.000Z",
            is_featured: false,
            campaign_tag: "launch",
          },
        ],
      }),
      { status: 200, headers: { "content-type": "application/json" } },
    );
  }) as typeof fetch;

  try {
    const items = await fetchPublishedFeedItems();

    assert.equal(items.length, 1);
    assert.equal(items[0]?.id, "2");
    assert.deepEqual(receivedHeaders, { Accept: "application/json" });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("Bunny embed helper builds the public embed URL when the library ID is present", () => {
  env.BUNNY_LIBRARY_ID = "library-123";

  const embedUrl = getBunnyEmbedUrl("video-456");

  assert.equal(embedUrl, "https://iframe.mediadelivery.net/embed/library-123/video-456");
});
