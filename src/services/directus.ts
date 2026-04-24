import { assertDirectusEnv, env } from "../lib/env.ts";
import type { FeedItem } from "../types/feed-item.ts";

export const DIRECTUS_COLLECTION = "feed_items";

type DirectusRecord = Record<string, unknown>;

export const directusConfig = {
  baseUrl: env.DIRECTUS_URL,
  collection: DIRECTUS_COLLECTION,
  sort: ["-is_featured", "sort_order", "-published_at"],
  filter: {
    status: {
      _eq: "published",
    },
  },
  fields: "*",
} as const;

export function getFeedItemsEndpoint(): URL {
  assertDirectusEnv();

  const url = new URL(`/items/${DIRECTUS_COLLECTION}`, env.DIRECTUS_URL);

  url.searchParams.set("filter[status][_eq]", "published");
  url.searchParams.set("sort[]", "-is_featured");
  url.searchParams.append("sort[]", "sort_order");
  url.searchParams.append("sort[]", "-published_at");
  url.searchParams.set("fields", directusConfig.fields);

  return url;
}

export async function fetchPublishedFeedItems(): Promise<FeedItem[]> {
  assertDirectusEnv();

  const endpoint = getFeedItemsEndpoint();

  const response = await fetch(endpoint, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    logDirectusError(`Failed to fetch feed items (${response.status}).`);
    throw new Error(`[directus] Failed to fetch feed items (${response.status}).`);
  }

  const payload = (await response.json()) as { data?: unknown };

  if (!payload.data) {
    logDirectusItemCount(0);
    return [];
  }

  if (!Array.isArray(payload.data)) {
    logDirectusError("Invalid payload shape. Expected data to be an array.");
    throw new Error("[directus] Invalid payload shape. Expected data to be an array.");
  }

  const items = payload.data
    .map((record) => mapDirectusFeedItem(record))
    .filter((item): item is FeedItem => item !== null);

  logDirectusItemCount(items.length);

  return items;
}

export function mapDirectusFeedItem(record: unknown): FeedItem | null {
  if (!isRecord(record)) {
    return null;
  }

  const id = toStringValue(record.id);
  const status = toStringValue(record.status);
  const title = toStringValue(record.title);
  const slug = toStringValue(record.slug);
  const publishedAt =
    toStringValue(record.published_at) || toStringValue(record.created_at) || toStringValue(record.updated_at);

  if (!id || status !== "published" || !title || !slug) {
    return null;
  }

  return {
    id,
    status: "published",
    title,
    slug,
    caption_short: toStringValue(record.caption_short),
    caption_long: toStringValue(record.caption_long),
    thumbnail_url: toStringValue(record.thumbnail_url),
    bunny_video_id: toStringValue(record.bunny_video_id),
    bunny_embed_url: toNullableString(record.bunny_embed_url),
    cta_text: toStringValue(record.cta_text) || "Ver mas",
    cta_url: toSafeCtaUrl(record.cta_url),
    sort_order: toNumberValue(record.sort_order),
    published_at: publishedAt,
    is_featured: record.is_featured === true,
    campaign_tag: toStringValue(record.campaign_tag),
    created_at: toOptionalString(record.created_at),
    updated_at: toOptionalString(record.updated_at),
  };
}

function isRecord(value: unknown): value is DirectusRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toStringValue(value: unknown): string {
  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return "";
}

function toNullableString(value: unknown): string | null {
  const stringValue = toStringValue(value);
  return stringValue || null;
}

function toOptionalString(value: unknown): string | undefined {
  const stringValue = toStringValue(value);
  return stringValue || undefined;
}

function toNumberValue(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function toSafeCtaUrl(value: unknown): string {
  const url = toStringValue(value);

  if (!url) {
    return "#";
  }

  return url;
}

function logDirectusItemCount(count: number): void {
  if (isProduction()) {
    return;
  }

  console.info(`[directus] Received ${count} feed item(s).`);
}

function logDirectusError(message: string): void {
  console.error(`[directus] ${message}`);
}

function isProduction(): boolean {
  return Boolean((import.meta as ImportMeta & { env?: { PROD?: boolean } }).env?.PROD);
}
