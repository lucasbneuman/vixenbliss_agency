import test from "node:test";
import assert from "node:assert/strict";

import {
  buildBunnyEmbedUrl,
  buildDirectusFeedItemPayload,
  getDirectusToken,
  getMissingEnvKeys,
  slugifyTitle,
} from "../scripts/sync-bunny-to-directus.ts";

test("sync env validation accepts either Directus admin token or sync token", () => {
  const env = {
    BUNNY_LIBRARY_ID: "123",
    BUNNY_STREAM_API_KEY: "stream-key",
    DIRECTUS_URL: "https://cms.example.com",
    DIRECTUS_SYNC_TOKEN: "sync-token",
  };

  assert.deepEqual(getMissingEnvKeys(env), []);
  assert.equal(getDirectusToken(env), "sync-token");
});

test("sync env validation reports missing Directus token as an either-or requirement", () => {
  const env = {
    BUNNY_LIBRARY_ID: "123",
    BUNNY_STREAM_API_KEY: "stream-key",
    DIRECTUS_URL: "https://cms.example.com",
  };

  assert.deepEqual(getMissingEnvKeys(env), ["DIRECTUS_ADMIN_TOKEN or DIRECTUS_SYNC_TOKEN"]);
});

test("sync payload creates Directus draft fields from a Bunny video", () => {
  const payload = buildDirectusFeedItemPayload(
    {
      guid: "2f8d9b18-c64b-4510-a4d3-fdf43d63c099",
      title: "  VixenBliss Drop #12!  ",
      thumbnailUrl: "https://cdn.example.com/thumb.jpg",
    },
    "98765",
  );

  assert.deepEqual(payload, {
    status: "draft",
    title: "VixenBliss Drop #12!",
    slug: "vixenbliss-drop-12-2f8d9b18",
    caption_short: "",
    caption_long: "",
    bunny_video_id: "2f8d9b18-c64b-4510-a4d3-fdf43d63c099",
    bunny_embed_url: "https://player.mediadelivery.net/embed/98765/2f8d9b18-c64b-4510-a4d3-fdf43d63c099",
    thumbnail_url: "https://cdn.example.com/thumb.jpg",
    cta_text: "Ver más",
    cta_url: "#",
    sort_order: 100,
    is_featured: false,
    campaign_tag: "bunny-sync",
    published_at: null,
  });
});

test("sync payload falls back to an editable untitled draft when Bunny title is missing", () => {
  const payload = buildDirectusFeedItemPayload({ guid: "abcdef1234567890", title: "" }, "123");

  assert.equal(payload.title, "Untitled Bunny Video");
  assert.equal(payload.slug, "untitled-bunny-video-abcdef12");
  assert.equal(payload.thumbnail_url, undefined);
});

test("sync payload can build a thumbnail URL from Bunny thumbnail file name and pull zone", () => {
  const payload = buildDirectusFeedItemPayload(
    {
      guid: "video-123",
      title: "Behind the scenes",
      thumbnailFileName: "thumbnail.jpg",
    },
    "123",
    "vz-example.b-cdn.net/",
  );

  assert.equal(payload.thumbnail_url, "https://vz-example.b-cdn.net/video-123/thumbnail.jpg");
});

test("sync helpers normalize slugs and embed URLs", () => {
  assert.equal(slugifyTitle("  Ámbar & Neon / Teaser  "), "ambar-neon-teaser");
  assert.equal(buildBunnyEmbedUrl("111", "video-222"), "https://player.mediadelivery.net/embed/111/video-222");
});
