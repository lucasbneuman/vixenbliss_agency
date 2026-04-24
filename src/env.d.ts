/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly CONTENT_SOURCE?: string;
  readonly DIRECTUS_URL?: string;
  readonly BUNNY_LIBRARY_ID?: string;
  readonly SITE_URL?: string;
  readonly PUBLIC_ANALYTICS_ENABLED?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
