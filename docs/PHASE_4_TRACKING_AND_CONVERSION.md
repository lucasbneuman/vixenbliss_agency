# Phase 4 Tracking And Conversion

Phase 4 adds lightweight client-side conversion measurement and CTA hardening without introducing GA4, Meta Pixel, a backend, or a dashboard.

## Events Implemented

All events go through `src/lib/analytics.ts`.

- `reel_impression`: emitted once per reel when it first enters the feed preload/active viewport.
- `reel_active`: emitted when a reel becomes the current visible reel at 60% visibility.
- `cta_click`: emitted when a valid CTA link is clicked.
- `scroll_depth`: emitted once per session threshold at 25%, 50%, 75%, and 100% feed depth.

## Expected Payloads

`reel_impression` and `reel_active`:

```json
{
  "feed_item_id": "uuid",
  "campaign_tag": "campaign",
  "slug": "content-slug",
  "index": 0
}
```

`cta_click`:

```json
{
  "feed_item_id": "uuid",
  "campaign_tag": "campaign",
  "slug": "content-slug",
  "index": 0,
  "cta_url": "https://destination.example/path?utm_source=agency&utm_medium=reels"
}
```

`scroll_depth`:

```json
{
  "depth_percent": 25,
  "max_index": 1,
  "total_items": 6
}
```

## Data Attributes

Each reel item renders:

- `data-feed-item-id`
- `data-campaign-tag`
- `data-slug`
- `data-cta-url`
- `data-index`

The CTA element also renders the campaign, slug, feed item ID, and final CTA URL so click tracking can use the clicked element directly.

## UTM Handling

External `http` and `https` CTA URLs receive missing agency params:

- `utm_source=agency`
- `utm_medium=reels`
- `utm_campaign={campaign_tag}`
- `utm_content={slug}`

Existing UTM parameters are preserved and not duplicated. Internal URLs and hash links do not receive UTM parameters.

## CTA Hardening

- External links render with `target="_blank"` and `rel="noopener noreferrer"`.
- Empty or invalid CTA URLs fall back to `#` and render as disabled text instead of a clickable link.
- Unsafe schemes such as `javascript:` are rejected by `resolveCta()`.

## Analytics Adapter

`PUBLIC_ANALYTICS_ENABLED=false` disables analytics.

When enabled:

- Development uses a console adapter and logs `[analytics]` messages.
- Production uses a no-op adapter until a real provider is configured.
- Tracking errors are caught and never break the UI.

## How To Validate Locally

Run:

```bash
npm run dev
```

Open the local URL and the browser console.

Validate:

- `[analytics] reel_impression` appears when reels enter view.
- `[analytics] reel_active` appears when a reel becomes active.
- `[analytics] scroll_depth` appears at 25%, 50%, 75%, and 100% depth thresholds.
- `[analytics] cta_click` appears when clicking a valid CTA.
- External CTA URLs include missing UTM params and preserve existing UTMs.
- Invalid CTA URLs render disabled and do not navigate.

To disable locally:

```bash
PUBLIC_ANALYTICS_ENABLED=false npm run dev
```

## Validation Commands

```bash
npm test
npm run build
```

## Limitations

- Events are client-side only.
- Production has no external analytics provider yet.
- There is no backend event collection, attribution storage, dashboard, or conversion reporting.
- Scroll depth measures feed depth, not watched seconds.
- Bunny iframe playback state is still handled by lazy loading/unloading as in Phase 3.

## Phase 5 Candidates

- Add a real analytics provider adapter.
- Define event delivery guarantees and consent requirements.
- Add server-side event ingestion only if needed.
- Add campaign performance reporting outside the frontend.
- Add experimentation infrastructure after baseline tracking data exists.
