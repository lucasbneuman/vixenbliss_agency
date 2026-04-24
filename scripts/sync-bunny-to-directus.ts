import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const BUNNY_API_BASE_URL = "https://video.bunnycdn.com";
const DIRECTUS_COLLECTION = "feed_items";
const DEFAULT_ITEMS_PER_PAGE = 100;

type EnvSource = Record<string, string | undefined>;

export type SyncEnv = {
  BUNNY_LIBRARY_ID: string;
  BUNNY_STREAM_API_KEY: string;
  BUNNY_PULL_ZONE_URL?: string;
  DIRECTUS_URL: string;
  DIRECTUS_TOKEN: string;
};

export type BunnyVideo = {
  guid?: unknown;
  videoId?: unknown;
  id?: unknown;
  title?: unknown;
  name?: unknown;
  thumbnailUrl?: unknown;
  thumbnail_url?: unknown;
  posterUrl?: unknown;
  poster_url?: unknown;
  thumbnailFileName?: unknown;
};

type DirectusFeedItemPayload = {
  status: "draft";
  title: string;
  slug: string;
  caption_short: string;
  caption_long: string;
  bunny_video_id: string;
  bunny_embed_url: string;
  thumbnail_url?: string;
  cta_text: string;
  cta_url: string;
  sort_order: number;
  is_featured: boolean;
  campaign_tag: string;
  published_at: null;
};

type SyncOptions = {
  env: SyncEnv;
  dryRun: boolean;
  fetchFn?: typeof fetch;
};

type SyncSummary = {
  seen: number;
  created: number;
  skipped: number;
  failed: number;
};

export function loadDotEnvFile(filePath = resolve(process.cwd(), ".env"), target: EnvSource = process.env): void {
  if (!existsSync(filePath)) {
    return;
  }

  const lines = readFileSync(filePath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();

    if (!key || target[key] !== undefined) {
      continue;
    }

    target[key] = rawValue.replace(/^['"]|['"]$/g, "");
  }
}

export function getMissingEnvKeys(env: EnvSource): string[] {
  const missing = ["BUNNY_LIBRARY_ID", "BUNNY_STREAM_API_KEY", "DIRECTUS_URL"].filter(
    (key) => !env[key]?.trim(),
  );

  if (!getDirectusToken(env)) {
    missing.push("DIRECTUS_ADMIN_TOKEN or DIRECTUS_SYNC_TOKEN");
  }

  return missing;
}

export function getDirectusToken(env: EnvSource): string {
  return env.DIRECTUS_SYNC_TOKEN?.trim() || env.DIRECTUS_ADMIN_TOKEN?.trim() || "";
}

export function getSyncEnv(env: EnvSource = process.env): SyncEnv {
  const missing = getMissingEnvKeys(env);

  if (missing.length > 0) {
    throw new Error(`[config] Missing required env var(s): ${missing.join(", ")}`);
  }

  return {
    BUNNY_LIBRARY_ID: env.BUNNY_LIBRARY_ID!.trim(),
    BUNNY_STREAM_API_KEY: env.BUNNY_STREAM_API_KEY!.trim(),
    BUNNY_PULL_ZONE_URL: env.BUNNY_PULL_ZONE_URL?.trim() || undefined,
    DIRECTUS_URL: env.DIRECTUS_URL!.trim(),
    DIRECTUS_TOKEN: getDirectusToken(env),
  };
}

export function buildBunnyEmbedUrl(libraryId: string, videoId: string): string {
  return `https://player.mediadelivery.net/embed/${encodeURIComponent(libraryId)}/${encodeURIComponent(videoId)}`;
}

export function slugifyTitle(title: string): string {
  const slug = title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

  return slug || "untitled-bunny-video";
}

export function buildDirectusFeedItemPayload(
  video: BunnyVideo,
  libraryId: string,
  pullZoneUrl?: string,
): DirectusFeedItemPayload {
  const videoId = getBunnyVideoId(video);

  if (!videoId) {
    throw new Error("[bunny] Video is missing a guid/videoId/id.");
  }

  const title = getBunnyVideoTitle(video);
  const thumbnailUrl = getBunnyThumbnailUrl(video, videoId, pullZoneUrl);
  const payload: DirectusFeedItemPayload = {
    status: "draft",
    title,
    slug: `${slugifyTitle(title)}-${videoId.slice(0, 8)}`,
    caption_short: "",
    caption_long: "",
    bunny_video_id: videoId,
    bunny_embed_url: buildBunnyEmbedUrl(libraryId, videoId),
    cta_text: "Ver más",
    cta_url: "#",
    sort_order: 100,
    is_featured: false,
    campaign_tag: "bunny-sync",
    published_at: null,
  };

  if (thumbnailUrl) {
    payload.thumbnail_url = thumbnailUrl;
  }

  return payload;
}

export async function syncBunnyToDirectus(options: SyncOptions): Promise<SyncSummary> {
  const fetchFn = options.fetchFn ?? fetch;
  const videos = await listBunnyVideos(options.env, fetchFn);
  const summary: SyncSummary = {
    seen: videos.length,
    created: 0,
    skipped: 0,
    failed: 0,
  };

  console.info(`[sync] Found ${videos.length} Bunny video(s).`);

  for (const video of videos) {
    const videoId = getBunnyVideoId(video);

    if (!videoId) {
      summary.failed += 1;
      console.error("[sync] Skipping Bunny video without guid/videoId/id.");
      continue;
    }

    try {
      const exists = await directusItemExists(videoId, options.env, fetchFn);

      if (exists) {
        summary.skipped += 1;
        console.info(`[sync] Skipping existing Directus item for Bunny video ${videoId}.`);
        continue;
      }

      const payload = buildDirectusFeedItemPayload(
        video,
        options.env.BUNNY_LIBRARY_ID,
        options.env.BUNNY_PULL_ZONE_URL,
      );

      if (options.dryRun) {
        summary.skipped += 1;
        console.info(`[dry-run] Would create "${payload.title}" (${payload.bunny_video_id}).`);
        continue;
      }

      await createDirectusItem(payload, options.env, fetchFn);
      summary.created += 1;
      console.info(`[sync] Created draft Directus item for Bunny video ${videoId}.`);
    } catch (error) {
      summary.failed += 1;
      console.error(`[sync] Failed to process Bunny video ${videoId}: ${getErrorMessage(error)}`);
    }
  }

  return summary;
}

async function listBunnyVideos(env: SyncEnv, fetchFn: typeof fetch): Promise<BunnyVideo[]> {
  const videos: BunnyVideo[] = [];
  let page = 1;

  while (true) {
    const url = new URL(`/library/${env.BUNNY_LIBRARY_ID}/videos`, BUNNY_API_BASE_URL);
    url.searchParams.set("page", String(page));
    url.searchParams.set("itemsPerPage", String(DEFAULT_ITEMS_PER_PAGE));

    const response = await fetchFn(url, {
      headers: {
        Accept: "application/json",
        AccessKey: env.BUNNY_STREAM_API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`[bunny] Failed to list videos (${response.status}).`);
    }

    const payload = (await response.json()) as { items?: unknown; totalItems?: unknown };
    const items = Array.isArray(payload.items) ? (payload.items as BunnyVideo[]) : [];

    videos.push(...items);

    if (items.length < DEFAULT_ITEMS_PER_PAGE || videos.length >= toFiniteNumber(payload.totalItems)) {
      break;
    }

    page += 1;
  }

  return videos;
}

async function directusItemExists(videoId: string, env: SyncEnv, fetchFn: typeof fetch): Promise<boolean> {
  const url = new URL(`/items/${DIRECTUS_COLLECTION}`, normalizeBaseUrl(env.DIRECTUS_URL));
  url.searchParams.set("filter[bunny_video_id][_eq]", videoId);
  url.searchParams.set("fields", "id,bunny_video_id,title");
  url.searchParams.set("limit", "1");

  const response = await fetchFn(url, {
    headers: getDirectusHeaders(env),
  });

  if (!response.ok) {
    throw new Error(`[directus] Failed to check existing item (${response.status}).`);
  }

  const payload = (await response.json()) as { data?: unknown };

  return Array.isArray(payload.data) && payload.data.length > 0;
}

async function createDirectusItem(
  payload: DirectusFeedItemPayload,
  env: SyncEnv,
  fetchFn: typeof fetch,
): Promise<void> {
  const url = new URL(`/items/${DIRECTUS_COLLECTION}`, normalizeBaseUrl(env.DIRECTUS_URL));
  const response = await fetchFn(url, {
    method: "POST",
    headers: {
      ...getDirectusHeaders(env),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`[directus] Failed to create item (${response.status}).`);
  }
}

function getDirectusHeaders(env: SyncEnv): HeadersInit {
  return {
    Accept: "application/json",
    Authorization: `Bearer ${env.DIRECTUS_TOKEN}`,
  };
}

function getBunnyVideoId(video: BunnyVideo): string {
  return toCleanString(video.guid) || toCleanString(video.videoId) || toCleanString(video.id);
}

function getBunnyVideoTitle(video: BunnyVideo): string {
  return toCleanString(video.title) || toCleanString(video.name) || "Untitled Bunny Video";
}

function getBunnyThumbnailUrl(video: BunnyVideo, videoId: string, pullZoneUrl?: string): string {
  const explicitUrl =
    toCleanString(video.thumbnailUrl) ||
    toCleanString(video.thumbnail_url) ||
    toCleanString(video.posterUrl) ||
    toCleanString(video.poster_url);

  if (explicitUrl) {
    return explicitUrl;
  }

  const thumbnailFileName = toCleanString(video.thumbnailFileName);

  if (thumbnailFileName && pullZoneUrl) {
    return `${normalizePullZoneUrl(pullZoneUrl)}/${encodeURIComponent(videoId)}/${encodeURIComponent(thumbnailFileName)}`;
  }

  return "";
}

function normalizePullZoneUrl(value: string): string {
  const trimmed = value.trim().replace(/\/+$/g, "");

  if (!trimmed) {
    return "";
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

function normalizeBaseUrl(value: string): string {
  return value.endsWith("/") ? value : `${value}/`;
}

function toCleanString(value: unknown): string {
  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "number") {
    return String(value);
  }

  return "";
}

function toFiniteNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : Number.POSITIVE_INFINITY;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}

function parseArgs(args: string[]): { dryRun: boolean } {
  return {
    dryRun: args.includes("--dry-run"),
  };
}

async function main(): Promise<void> {
  loadDotEnvFile();

  const { dryRun } = parseArgs(process.argv.slice(2));
  const env = getSyncEnv();
  const summary = await syncBunnyToDirectus({ env, dryRun });

  console.info(
    `[sync] Done. seen=${summary.seen} created=${summary.created} skipped=${summary.skipped} failed=${summary.failed}`,
  );

  if (summary.failed > 0) {
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error: unknown) => {
    console.error(getErrorMessage(error));
    process.exitCode = 1;
  });
}
