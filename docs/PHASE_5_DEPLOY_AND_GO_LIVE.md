# Phase 5 Deploy And Go Live

Phase 5 prepares VixenBliss Agency for production deployment on Coolify at:

```text
https://agency.vixenbliss.com
```

No product behavior, feed ordering, reels UX, CTA logic, or analytics behavior changes are introduced in this phase.

## Production Runtime

- Framework: Astro SSR with `@astrojs/node` standalone adapter
- Runtime: Node `22.12.0` LTS Alpine image
- Container port: `4321`
- Start command: `npm run start`
- Health endpoint: `/health.json`
- Deployment mode: Dockerfile build in Coolify

## Dockerfile

The production Dockerfile is multi-stage:

1. `base`: pins Node LTS and `/app`
2. `deps`: installs dependencies with `npm ci`
3. `build`: runs `npm run build`
4. `runtime`: installs production dependencies, copies `dist`, drops to the `node` user, exposes `4321`, and starts with `npm run start`

The app binds to:

```text
HOST=0.0.0.0
PORT=4321
```

## Docker Ignore

The Docker context excludes local and non-runtime files:

- `node_modules`
- `dist`
- `.astro`
- `.git`
- editor files
- `.env` and `.env.*`
- logs
- tests
- coverage
- docs

`.env.example` is intentionally allowed as a harmless template.

## Required Environment Variables

Configure these in Coolify:

```text
CONTENT_SOURCE=directus
DIRECTUS_URL=https://your-public-directus-domain.example
BUNNY_LIBRARY_ID=your_bunny_stream_library_id
SITE_URL=https://agency.vixenbliss.com
PUBLIC_ANALYTICS_ENABLED=true
```

Rules:

- Do not set `DIRECTUS_TOKEN`; the frontend reads the public Directus API only.
- Do not set Bunny API keys; only `BUNNY_LIBRARY_ID` is needed for public embed URLs.
- Do not commit real `.env` values.
- `DIRECTUS_URL` must be reachable from the Coolify server.

## Exact Coolify Setup

1. Open Coolify.
2. Select the target project and environment.
3. Click **New Resource**.
4. Choose **Application**.
5. Select the Git repository for `vixenbliss_agency`.
6. Set the build pack/deployment type to **Dockerfile**.
7. Set Dockerfile path to:

   ```text
   Dockerfile
   ```

8. Set the exposed port to:

   ```text
   4321
   ```

9. Add environment variables:

   ```text
   CONTENT_SOURCE=directus
   DIRECTUS_URL=https://your-public-directus-domain.example
   BUNNY_LIBRARY_ID=your_bunny_stream_library_id
   SITE_URL=https://agency.vixenbliss.com
   PUBLIC_ANALYTICS_ENABLED=true
   ```

10. Do not add `DIRECTUS_TOKEN`.
11. In **Domains**, add:

    ```text
    agency.vixenbliss.com
    ```

12. Ensure the DNS record points to the Coolify server.
13. Enable HTTPS / SSL certificate generation in Coolify.
14. Deploy the application.
15. Wait until Coolify reports the deployment as healthy.

## DNS

Create or verify this DNS record before final go-live:

```text
agency.vixenbliss.com -> Coolify server IP or configured CNAME target
```

Use the DNS mode expected by the hosting provider. Coolify must receive requests for `agency.vixenbliss.com` before HTTPS issuance can succeed.

## Health Check

Use:

```text
GET https://agency.vixenbliss.com/health.json
```

Expected response:

```json
{
  "status": "ok",
  "service": "vixenbliss-agency"
}
```

This verifies that the Node SSR server is running. Use the homepage validation below to verify Directus, Bunny, CTA, and tracking behavior end-to-end.

## Post-Deploy Validation Checklist

- `https://agency.vixenbliss.com/health.json` returns `200`.
- `https://agency.vixenbliss.com` returns `200`.
- HTTPS is active and the browser shows a valid certificate.
- Initial page load is fast on mobile data or throttled mobile simulation.
- Published feed items load from Directus.
- No `DIRECTUS_TOKEN` is present in Coolify env.
- Reel scroll works vertically with snap behavior.
- First reel and subsequent reels render without layout breakage.
- Bunny videos load when `bunny_embed_url` or `bunny_video_id` is present.
- Thumbnail or branded fallback appears when Bunny data is missing.
- CTA is visible, tappable, and opens the expected destination.
- External CTA URLs include the expected UTM parameters.
- Tracking does not throw console errors.
- `PUBLIC_ANALYTICS_ENABLED=true` is set.
- Mobile viewport has no overlapping controls or broken safe-area spacing.
- Browser console has no critical errors.
- Coolify logs have no repeated Directus fetch failures.

## Production Error Handling

If Directus is unavailable:

- the server logs a clear `[directus]` or `[feed]` error
- the homepage renders a temporary unavailable state
- the UI does not expose raw stack traces or sensitive details
- the process keeps running

If Bunny embed data is incomplete:

- the reel uses `thumbnail_url`
- if no thumbnail exists, it renders the branded dark placeholder
- CTA rendering remains independent from video rendering

## Basic Security

Production responses include:

- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `X-Frame-Options: DENY`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`

Security rules:

- no frontend write access to Directus
- no Directus token in production env
- no Bunny API key in production env
- no extra public API endpoints beyond Astro routes and `/health.json`

## Basic Performance Checks

Run before deploy:

```bash
npm test
npm run build
```

After deploy:

- verify the homepage loads in a mobile browser quickly
- verify only near-viewport Bunny iframes are loaded
- confirm off-screen reels unload iframe `src`
- check Network tab for repeated failed Directus requests
- check that build output is generated under `dist`

## Troubleshooting

### Health Check Fails

- Confirm Coolify exposed port is `4321`.
- Confirm the container command is using the Dockerfile default.
- Check Coolify container logs for startup errors.
- Confirm `npm run build` passed during deployment.

### HTTPS Fails

- Confirm DNS for `agency.vixenbliss.com` points to Coolify.
- Confirm the domain is attached to the Coolify app.
- Reissue the SSL certificate from Coolify after DNS propagation.

### Homepage Shows Temporarily Unavailable

- Confirm `DIRECTUS_URL` is set and reachable from the Coolify host.
- Confirm Directus public permissions allow reading `feed_items`.
- Confirm at least one item has `status=published`.
- Confirm Directus returns `data` as an array.
- Check Coolify logs for `[directus]` and `[feed]` entries.

### Videos Do Not Render

- Confirm `BUNNY_LIBRARY_ID` is set.
- Confirm each Directus item has `bunny_embed_url` or `bunny_video_id`.
- Confirm Bunny videos are publicly embeddable.
- Confirm thumbnails exist for fallback rendering.

### CTA Does Not Navigate

- Confirm Directus item has a valid `cta_url`.
- Confirm the URL uses `http` or `https`.
- Confirm unsafe schemes are not being used.

### Tracking Is Silent

- Confirm `PUBLIC_ANALYTICS_ENABLED=true`.
- In production, the current adapter is intentionally no-op unless a provider is added.
- Confirm no analytics errors appear in the browser console.

## Rollback

Preferred Coolify rollback:

1. Open the application in Coolify.
2. Go to deployments.
3. Select the last known good deployment.
4. Trigger rollback/redeploy for that version.
5. Re-run `/health.json` and homepage validation.

Git rollback fallback:

1. Revert the bad commit in Git.
2. Push the revert.
3. Redeploy from Coolify.
4. Validate health, homepage, feed, CTA, and tracking.

## Go-Live Criteria

Go live only when all are true:

- app is accessible at `https://agency.vixenbliss.com`
- HTTPS certificate is valid
- real Directus content is visible
- reels scroll UX works on mobile
- CTA links work
- tracking code runs without errors
- thumbnails and placeholders cover missing video data
- no critical browser console errors
- no repeated server errors in Coolify logs
