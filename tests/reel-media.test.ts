import test from "node:test";
import assert from "node:assert/strict";

import { resolveReelMedia, withBunnyAutoplayParams } from "../src/lib/reel-media.ts";
import { env } from "../src/lib/env.ts";
import type { FeedItem } from "../src/types/feed-item.ts";

const baseItem: FeedItem = {
  id: "item-1",
  status: "published",
  title: "Video title",
  slug: "video-title",
  caption_short: "Short caption",
  caption_long: "",
  thumbnail_url: "",
  bunny_video_id: "",
  bunny_embed_url: null,
  cta_text: "Open",
  cta_url: "https://example.com",
  sort_order: 1,
  published_at: "2026-04-23T10:00:00.000Z",
  is_featured: false,
  campaign_tag: "launch",
};

test("reel media prefers an explicit Bunny embed URL", () => {
  env.BUNNY_LIBRARY_ID = "library-123";

  const media = resolveReelMedia({
    ...baseItem,
    bunny_embed_url: "https://iframe.mediadelivery.net/embed/custom/video-1",
    bunny_video_id: "video-1",
    thumbnail_url: "https://example.com/thumb.jpg",
  });

  assert.deepEqual(media, {
    kind: "embed",
    src: "https://iframe.mediadelivery.net/embed/custom/video-1",
  });
});

test("reel media builds a Bunny embed URL from video ID when the library ID exists", () => {
  env.BUNNY_LIBRARY_ID = "library-123";

  const media = resolveReelMedia({
    ...baseItem,
    bunny_video_id: "video-456",
    thumbnail_url: "https://example.com/thumb.jpg",
  });

  assert.deepEqual(media, {
    kind: "embed",
    src: "https://iframe.mediadelivery.net/embed/library-123/video-456?autoplay=true&muted=true&playsinline=true&loop=true",
  });
});

test("reel media falls back to thumbnail when Bunny cannot be resolved", () => {
  env.BUNNY_LIBRARY_ID = "";

  const media = resolveReelMedia({
    ...baseItem,
    bunny_video_id: "video-456",
    thumbnail_url: "https://example.com/thumb.jpg",
  });

  assert.deepEqual(media, {
    alt: "Thumbnail for Video title",
    kind: "thumbnail",
    src: "https://example.com/thumb.jpg",
  });
});

test("reel media uses a placeholder when video and thumbnail are missing", () => {
  env.BUNNY_LIBRARY_ID = "";

  const media = resolveReelMedia(baseItem);

  assert.deepEqual(media, {
    kind: "placeholder",
  });
});

test("Bunny autoplay params keep explicit embed URLs playable and mobile-friendly", () => {
  const src = withBunnyAutoplayParams("https://iframe.mediadelivery.net/embed/custom/video-1?preload=true");

  assert.equal(
    src,
    "https://iframe.mediadelivery.net/embed/custom/video-1?preload=true&autoplay=true&muted=true&playsinline=true&loop=true",
  );
});

test("Bunny autoplay params leave invalid URLs untouched", () => {
  assert.equal(withBunnyAutoplayParams("not a url"), "not a url");
});
