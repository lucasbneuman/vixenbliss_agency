# Phase 1 Foundation

This document describes the production-ready foundation implemented for VixenBliss Agency in Phase 1.

## Technical decisions

- Frontend runtime: Astro SSR with `@astrojs/node` in standalone mode
- Package manager: `npm`
- Node baseline: `22.12.0` LTS for local and Docker parity
- Deployment target: Coolify using Docker
- Integrations: contracts prepared for Directus and Bunny Stream, without production connection

## Project structure

```text
/
|-- docs/
|   |-- BUSINESS_SPEC.md
|   |-- PHASE_1_FOUNDATION.md
|   `-- TECHNICAL_SPEC.md
|-- public/
|   |-- favicon.ico
|   `-- favicon.svg
|-- src/
|   |-- components/
|   |   `-- PlaceholderNotice.astro
|   |-- layouts/
|   |   `-- Layout.astro
|   |-- lib/
|   |   |-- bunny.ts
|   |   `-- env.ts
|   |-- pages/
|   |   `-- index.astro
|   |-- services/
|   |   `-- directus.ts
|   |-- types/
|   |   `-- feed-item.ts
|   `-- env.d.ts
|-- .dockerignore
|-- .env.example
|-- .gitignore
|-- astro.config.mjs
|-- Dockerfile
|-- package-lock.json
|-- package.json
|-- README.md
`-- tsconfig.json
```

## Local setup

Expected time: under 5 minutes on a clean machine with Node `22.12.0` installed.

Optional version pinning:

```bash
nvm use
```

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a local env file from the example:

   ```bash
   cp .env.example .env
   ```

   On Windows PowerShell:

   ```powershell
   Copy-Item .env.example .env
   ```

3. Fill the variables only when you need the external integrations.
   The placeholder page works without production credentials and shows which variables are still missing.

4. Start the dev server:

   ```bash
   npm run dev
   ```

5. Build production output:

   ```bash
   npm run build
   ```

6. Preview or run the built app:

   ```bash
   npm run preview
   npm run start
   ```

## Environment variables

Required variables prepared for future phases:

- `DIRECTUS_URL`
- `DIRECTUS_TOKEN`
- `BUNNY_LIBRARY_ID`
- `SITE_URL`

Rules:

- Never commit real values
- Keep `DIRECTUS_TOKEN` read-only
- Do not expose Bunny API credentials, only the public library ID for embed URLs

## Docker and Coolify

The repository includes a simple multi-stage `Dockerfile` designed for Coolify.

Recommended Coolify setup:

1. Create an application from this repository.
2. Choose Dockerfile-based deployment.
3. Set the exposed port to `4321`.
4. Configure the required environment variables in Coolify.
5. Attach the custom domain `agency.vixenbliss.com`.
6. Ensure HTTPS is enabled at the platform level.

Behavior:

- Build stage runs `npm ci` and `npm run build`
- Runtime stage starts the standalone Astro server with Node
- App binds to `0.0.0.0:4321`

## Validation checklist

- `npm install` finishes without hidden prerequisites
- `npm run dev` serves the placeholder locally
- `npm run build` completes without real service credentials
- `npm run start` serves the built SSR output
- Missing env vars produce clear, actionable messages in the app and integration helpers
- Bunny helper returns the expected public embed URL format
- Docker image builds successfully

## Pending after Phase 1

Not implemented yet by design:

- Final reels-style UI
- Vertical snap feed
- Autoplay and pause-on-visibility behavior
- Real Directus API reads in production
- Real Bunny player integration and runtime fallbacks
- Analytics or A/B testing
- Conversion experiments and content ordering optimizations
- Pagination or infinite feed behavior

## Status after Phase 2A

Phase 1 remains intact at the platform level:

- Astro SSR still builds without a live Directus instance
- Environment handling still protects secrets and missing config
- Bunny integration still uses public embed URLs only

What changed in Phase 2A:

- The placeholder homepage was replaced by a basic feed preview
- Feed data now comes from a provider abstraction instead of directly from a single service
- Mock data is the default source so local development no longer depends on Directus being online

What still remains out of scope:

- Reels-style UX
- autoplay and visibility-based playback
- analytics
- infinite scrolling
