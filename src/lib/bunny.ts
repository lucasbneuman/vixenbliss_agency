import { env, hasBunnyLibraryId } from "./env.ts";

export function getBunnyEmbedUrl(videoId: string): string {
  if (!hasBunnyLibraryId()) {
    throw new Error("[bunny] BUNNY_LIBRARY_ID is required to build the public embed URL.");
  }

  const sanitizedVideoId = videoId.trim();

  if (!sanitizedVideoId) {
    throw new Error("[bunny] videoId is required to build the public embed URL.");
  }

  return `https://iframe.mediadelivery.net/embed/${env.BUNNY_LIBRARY_ID}/${sanitizedVideoId}`;
}
