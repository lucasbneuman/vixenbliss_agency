# VixenBliss Agency

Astro SSR frontend for `agency.vixenbliss.com`, running a mobile-first reels feed from public Directus content and Bunny Stream embeds.

Primary source of truth:

- `docs/TECHNICAL_SPEC.md`
- `docs/BUSINESS_SPEC.md`

Operational documentation:

- `docs/PHASE_1_FOUNDATION.md`
- `docs/PHASE_3_REELS_EXPERIENCE.md`
- `docs/PHASE_4_TRACKING_AND_CONVERSION.md`
- `docs/PHASE_5_DEPLOY_AND_GO_LIVE.md`

## Commands

- `npm install`
- `npm run dev`
- `npm run build`
- `npm run preview`
- `npm run start`
- `npm test`

## Local Development

1. Copy `.env.example` to `.env`
2. Set `DIRECTUS_URL` to the public Directus base URL
3. Set `BUNNY_LIBRARY_ID` when Bunny embeds should render
4. Keep `SITE_URL=https://agency.vixenbliss.com` for production parity
5. Do not configure `DIRECTUS_TOKEN`; the frontend uses Directus public read access
3. `npm run dev`

If Directus is unavailable, the app still boots and shows a temporary unavailable state instead of crashing.

## Production

Deploy with the repository `Dockerfile` in Coolify. The container exposes port `4321` and starts with `npm run start`.

Required environment variables are documented in `docs/PHASE_5_DEPLOY_AND_GO_LIVE.md`.
