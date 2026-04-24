import { getBunnyEmbedUrl } from "./bunny.ts";
import type { FeedItem } from "../types/feed-item.ts";

export type ReelMedia =
  | {
      kind: "embed";
      src: string;
    }
  | {
      alt: string;
      kind: "thumbnail";
      src: string;
    }
  | {
      kind: "placeholder";
    };

export function resolveReelMedia(item: FeedItem): ReelMedia {
  const explicitEmbedUrl = item.bunny_embed_url?.trim();

  if (explicitEmbedUrl) {
    return {
      kind: "embed",
      src: explicitEmbedUrl,
    };
  }

  const bunnyVideoId = item.bunny_video_id.trim();

  if (bunnyVideoId) {
    try {
      return {
        kind: "embed",
        src: getBunnyEmbedUrl(bunnyVideoId),
      };
    } catch {
      // Missing BUNNY_LIBRARY_ID should fall through to thumbnail rendering.
    }
  }

  const thumbnailUrl = item.thumbnail_url.trim();

  if (thumbnailUrl) {
    return {
      alt: `Thumbnail for ${item.title}`,
      kind: "thumbnail",
      src: thumbnailUrl,
    };
  }

  return {
    kind: "placeholder",
  };
}

export function withBunnyAutoplayParams(src: string): string {
  try {
    const url = new URL(src);
    url.searchParams.set("autoplay", "true");
    url.searchParams.set("muted", "true");
    url.searchParams.set("playsinline", "true");
    url.searchParams.set("loop", "true");

    return url.toString();
  } catch {
    return src;
  }
}
