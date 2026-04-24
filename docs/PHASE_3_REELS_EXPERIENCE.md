# Phase 3 Reels Experience

Phase 3 turns the basic Directus feed into a mobile-first vertical video web app focused on fast content consumption and CTA conversion.

## What Was Implemented

- New feed component structure:
  - `VideoReelFeed`
  - `VideoReelItem`
  - `VideoMedia`
  - `ReelCTA`
- Full-screen dark reel feed on mobile
- One item per viewport with vertical scroll snap
- Centered desktop fallback with a constrained reel width
- CTA overlay on every item
- SSR data loading from the existing public Directus provider
- Media fallback resolution for Bunny embeds, thumbnails, and placeholders
- Client-side lazy loading and visibility handling with `IntersectionObserver`

## Data Flow

The homepage still fetches `feed_items` server-side through the existing provider:

1. `src/pages/index.astro` calls `getFeedItemsProvider()`
2. The provider reads published content from public Directus
3. The page passes the real `FeedItem[]` into `VideoReelFeed`
4. Components render the reel UI without changing the Directus schema

No mocks were reintroduced.

## Scroll Snap

`VideoReelFeed` owns a full viewport scroll container:

- `height: 100vh`
- `overflow-y: auto`
- `scroll-snap-type: y mandatory`

Each `VideoReelItem` uses:

- `min-height: 100vh`
- `scroll-snap-align: start`
- `scroll-snap-stop: always`

This keeps natural browser scrolling and touch interaction while making each item settle into a full-screen reel.

## Autoplay And Lazy Loading

The feed includes a small client script scoped to `[data-reel-feed]`.

Behavior:

- a preload `IntersectionObserver` watches near-viewport items and assigns iframe `src` from `data-src`
- an active `IntersectionObserver` watches the real viewport of the feed scroller
- if an item becomes the active visible item, native videos are asked to play muted
- if an item leaves the feed viewport, native videos are paused and Bunny iframes are unloaded by removing `src`

This keeps SSR for content data while avoiding a heavy client app.

## Bunny Iframe Limitation

Bunny iframe playback cannot be paused with the same reliability as a native `<video>` element from plain browser APIs.

Fallback implemented:

- Bunny embeds are not loaded immediately
- only near-viewport iframes receive a `src`
- off-screen iframes are unloaded to stop playback and reduce active players
- autoplay-friendly query params are appended when possible

If Bunny exposes a stable player SDK/API in a later phase, direct play/pause control can be added without changing the feed component contract.

## Media Fallback Rules

Media is resolved in `src/lib/reel-media.ts`:

1. use `bunny_embed_url` when present
2. otherwise use `bunny_video_id + BUNNY_LIBRARY_ID`
3. otherwise use `thumbnail_url`
4. otherwise render a dark branded placeholder

Missing `BUNNY_LIBRARY_ID` does not break rendering. Items fall back to thumbnail or placeholder.

## Mobile Validation

Run locally:

```bash
npm run dev
```

Open the local URL on a mobile viewport or device.

Validate:

- published Directus content appears
- each reel fills the screen
- vertical touch scrolling works naturally
- snap scrolling settles on one reel at a time
- CTA is visible and tappable
- thumbnails render when Bunny embeds are unavailable
- the page still renders if `BUNNY_LIBRARY_ID` is empty

## Validation Commands

```bash
npm test
npm run build
```

## Known Limitations

- Bunny iframe playback pause is handled by unloading the iframe, not by direct player control
- no analytics or conversion tracking yet
- no infinite scroll
- no social interactions
- no admin features

## Phase 4 Candidates

- analytics events for impressions, scroll depth, and CTA clicks
- deeper Bunny player integration if needed
- pagination or simple incremental feed loading
- content performance ranking once data exists
- conversion experiments and campaign reporting
