# Phase 2A Directus Readiness

This phase prepares the Astro frontend to consume `feed_items` from either mock fixtures or Directus, without requiring a live Directus server during local development.

## Goal

- Keep the app fully runnable with mock data
- Prepare a Directus provider that can be enabled later with env vars
- Render a basic SSR homepage feed with empty, error, and media fallback states

## Environment Variables

Use the following variables in `.env`:

```env
CONTENT_SOURCE=mock
DIRECTUS_URL=
DIRECTUS_TOKEN=
BUNNY_LIBRARY_ID=
SITE_URL=
```

Rules:

- `CONTENT_SOURCE=mock` is the default and requires no Directus connection
- `CONTENT_SOURCE=directus` requires `DIRECTUS_URL` and `DIRECTUS_TOKEN`
- `BUNNY_LIBRARY_ID` is optional; without it, video embeds fall back to thumbnail or placeholder rendering
- Never hardcode credentials in the repository

## Provider Pattern

The homepage no longer talks directly to Directus infrastructure. It requests data through a `FeedItemsProvider` contract:

```ts
interface FeedItemsProvider {
  getFeedItems(): Promise<FeedItem[]>;
}
```

Available implementations:

- `mockFeedItemsProvider`: returns local fixtures for development and layout validation
- `directusFeedItemsProvider`: calls the prepared Directus service and translates provider failures into readable feed errors

Selection is controlled by `CONTENT_SOURCE`.

## Directus Schema Expected

Collection: `feed_items`

Expected fields:

- `id`
- `status`
- `title`
- `slug`
- `caption_short`
- `caption_long`
- `thumbnail_url`
- `bunny_video_id`
- `bunny_embed_url`
- `cta_text`
- `cta_url`
- `sort_order`
- `published_at`
- `is_featured`
- `campaign_tag`
- `created_at`
- `updated_at`

Query behavior prepared in the Directus provider:

- filter: `status = published`
- sort: `is_featured DESC`
- sort: `sort_order ASC`
- sort: `published_at DESC`

## How To Run In Mock Mode

1. Copy `.env.example` to `.env`
2. Keep `CONTENT_SOURCE=mock`
3. Run `npm run dev`

Expected behavior:

- homepage renders fixture-based feed cards
- no Directus connection is attempted
- missing `BUNNY_LIBRARY_ID` only disables embeds, not the rest of the page

## How To Activate Directus Later

1. Set `CONTENT_SOURCE=directus`
2. Add `DIRECTUS_URL`
3. Add `DIRECTUS_TOKEN`
4. Optionally set `BUNNY_LIBRARY_ID`
5. Run `npm run dev` or `npm run build`

Expected behavior:

- homepage fetches `feed_items` server-side
- configuration errors render a visible message in-page
- HTTP or payload failures render an error state instead of breaking local startup

## Future Connection Checklist

- Directus collection `feed_items` exists
- fields match the expected schema
- `status` values include `published`
- API token has read-only access to `feed_items`
- `DIRECTUS_URL` points to the correct instance base URL
- `DIRECTUS_TOKEN` is configured in the runtime environment
- `BUNNY_LIBRARY_ID` is configured if embeds should render
- `npm run test`
- `npm run build`

## Current Limitations

- No reels UX yet
- No autoplay or visibility observers
- No analytics or A/B testing
- No pagination or infinite feed
- No runtime thumbnail health checks
