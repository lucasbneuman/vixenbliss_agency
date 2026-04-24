# Technical Specification — VixenBliss Agency

## 1. Overview

This project consists of building a high-performance, content-driven web application deployed on Coolify, using the following stack:

* Frontend: Astro
* CMS / Data Layer: Directus (already deployed separately)
* Video Provider: Bunny Stream
* Infrastructure: Coolify (Docker-based deployment)

The frontend must consume content from Directus and render a mobile-first vertical video experience.

---

## 2. Architecture

### 2.1 High-Level Architecture

* Directus (external service, already deployed via Coolify)
* Astro frontend (this repository)
* Bunny Stream (external video provider)

Flow:

1. Marketing uploads videos to Bunny Stream
2. Marketing creates content entries in Directus
3. Astro fetches content from Directus API
4. Astro renders the video feed using Bunny embeds

---

## 3. Directus Integration

### 3.1 Important Constraint

Directus is NOT part of this repository.
It is deployed manually via Coolify and will be provided via:

* Base URL
* API credentials (read-only)

---

### 3.2 Expected Collection Schema

Collection: `feed_items`

Fields:

* id (uuid)
* status (`draft`, `published`, `archived`)
* title (string)
* slug (string)
* caption_short (string)
* caption_long (text)
* thumbnail_url (string)
* bunny_video_id (string)
* bunny_embed_url (string, optional)
* cta_text (string)
* cta_url (string)
* sort_order (integer)
* published_at (datetime)
* is_featured (boolean)
* campaign_tag (string)
* created_at (datetime)
* updated_at (datetime)

---

### 3.3 API Requirements

* Only `published` items should be fetched

* Sorted by:

  * `is_featured DESC`
  * `sort_order ASC`
  * `published_at DESC`

* API must be consumed server-side (Astro)

* Use caching strategy (short TTL or revalidation)

---

## 4. Bunny Stream Integration

### 4.1 Usage Model

* Videos are hosted in Bunny Stream
* Frontend NEVER uploads videos
* Frontend only renders videos

---

### 4.2 Required Implementation

Create a utility:

```ts
getBunnyEmbedUrl(videoId: string): string
```

Expected format:

```id="bunny-format"
https://iframe.mediadelivery.net/embed/{library_id}/{video_id}
```

---

### 4.3 Rules

* Do NOT expose API keys
* Only use public embed/player URLs
* Support fallback if video fails

---

## 5. Astro Frontend

### 5.1 Requirements

* Mobile-first
* Dark theme
* Ultra-fast load
* Minimal JS

---

### 5.2 Rendering Strategy

* Use server-side rendering or hybrid
* Do NOT rely on full static builds
* Data is fetched at request time or via incremental revalidation

---

### 5.3 Component Structure

* Layout
* VideoFeed
* VideoCard
* VideoPlayer
* CTAButton

---

### 5.4 Video Feed UX

* Vertical scroll
* Snap scrolling (like reels)
* Autoplay when visible
* Pause when out of view

---

### 5.5 Performance Constraints

* Lazy loading videos
* Avoid unnecessary hydration
* Use Astro islands only when needed

---

## 6. Environment Variables

Required:

* DIRECTUS_URL
* DIRECTUS_TOKEN (read-only)
* BUNNY_LIBRARY_ID
* SITE_URL

---

## 7. Deployment (Coolify)

### 7.1 Deployment Type

* Docker-based
* Astro build + Node runtime OR static + server adapter

---

### 7.2 Requirements

* No hardcoded secrets
* Use environment variables
* Must run behind HTTPS
* Must support custom domain: agency.vixenbliss.com

---

## 8. Security

* No Directus write access from frontend
* No Bunny API keys exposed
* Only public read endpoints

---

## 9. Error Handling

* If Directus fails → show fallback UI
* If video fails → show thumbnail + CTA

---

## 10. Future-Proofing

Prepare structure for:

* analytics
* A/B testing
* content tagging
* pagination / infinite feed

Do NOT implement these yet, only structure code to allow it.
