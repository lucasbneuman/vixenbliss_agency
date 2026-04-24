# Bunny -> Directus manual sync

This repo includes a server-side manual script that creates Directus `feed_items` drafts from videos already uploaded to Bunny Stream.

Marketing flow:

1. Upload the video to Bunny Stream.
2. Run the sync script.
3. Open Directus, complete copy/CTA fields, review the draft, and publish when ready.

The frontend UX and visual model do not change. Tokens are only used by the local/server-side script and must never be exposed through public frontend env vars.

## Required variables

Set these in `.env` or in the shell running the script:

```bash
BUNNY_LIBRARY_ID=123456
BUNNY_STREAM_API_KEY=your_bunny_stream_library_api_key
DIRECTUS_URL=https://directus.example.com
DIRECTUS_SYNC_TOKEN=your_directus_sync_token
```

`DIRECTUS_ADMIN_TOKEN` also works, but prefer `DIRECTUS_SYNC_TOKEN` with the minimum permissions needed to read/create `feed_items`.

Optional:

```bash
BUNNY_PULL_ZONE_URL=vz-your-library.b-cdn.net
```

Set `BUNNY_PULL_ZONE_URL` when you want the script to build `thumbnail_url` from Bunny's `thumbnailFileName`. Bunny documents thumbnail files as `https://{pull_zone_url}.b-cdn.net/{video_id}/{thumbnail_file_name}`.

Required Directus permissions for the sync role:

- read `feed_items`, at least `id`, `title`, and `bunny_video_id`
- create `feed_items`

## Get the Bunny Stream API key

In Bunny:

1. Go to **Stream**.
2. Open the target video library.
3. Copy the library ID into `BUNNY_LIBRARY_ID`.
4. Copy the Stream library API key into `BUNNY_STREAM_API_KEY`.

The script calls Bunny's Stream API at `https://video.bunnycdn.com/library/{libraryId}/videos` using the `AccessKey` header.

## Get the Directus sync token

In Directus:

1. Create a dedicated role, for example `bunny_sync`.
2. Grant the role read/create permissions on `feed_items`.
3. Create a dedicated user for the sync.
4. Generate/copy the user's static token.
5. Save it as `DIRECTUS_SYNC_TOKEN`.

Use an admin token only for temporary local testing.

## Dry run

Preview what would be created without writing to Directus:

```bash
npm run sync:bunny -- --dry-run
```

Dry-run still reads Bunny and checks Directus for existing `bunny_video_id` values, but it does not create items.

## Real sync

Create missing Directus drafts:

```bash
npm run sync:bunny
```

For every Bunny video that does not already exist in Directus, the script creates a `feed_items` record with:

- `status=draft`
- `title` from Bunny, or `Untitled Bunny Video`
- `slug` from title plus the short Bunny video ID
- empty `caption_short` and `caption_long`
- `bunny_video_id`
- `bunny_embed_url=https://player.mediadelivery.net/embed/{library_id}/{video_id}`
- `thumbnail_url` when Bunny returns a full thumbnail/poster URL, or when `BUNNY_PULL_ZONE_URL` is set and Bunny returns `thumbnailFileName`
- `cta_text=Ver más`
- `cta_url=#`
- `sort_order=100`
- `is_featured=false`
- `campaign_tag=bunny-sync`
- `published_at=null`

Existing Directus items with the same `bunny_video_id` are skipped, so rerunning the script is safe.

## After sync

Marketing should:

1. Filter Directus `feed_items` by `status=draft` or `campaign_tag=bunny-sync`.
2. Complete `caption_short`, `caption_long`, `cta_text`, and `cta_url`.
3. Adjust `sort_order` or `is_featured` if needed.
4. Publish the item when the copy and CTA are ready.

No cron or admin UI exists yet; this is intentionally a manual operation.
