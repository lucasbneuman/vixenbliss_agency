export const CONTENT_SOURCES = ["directus"] as const;

export type ContentSource = (typeof CONTENT_SOURCES)[number];

const OPTIONAL_ENV_KEYS = [
  "DIRECTUS_URL",
  "BUNNY_LIBRARY_ID",
  "SITE_URL",
] as const;

export type OptionalEnvKey = (typeof OPTIONAL_ENV_KEYS)[number];

export interface AppEnv {
  CONTENT_SOURCE: string;
  DIRECTUS_URL: string;
  BUNNY_LIBRARY_ID: string;
  SITE_URL: string;
}

const runtimeEnv = (import.meta as ImportMeta & { env?: Partial<AppEnv> }).env ?? {};

const rawEnv = {
  CONTENT_SOURCE: runtimeEnv.CONTENT_SOURCE ?? "directus",
  DIRECTUS_URL: runtimeEnv.DIRECTUS_URL ?? "",
  BUNNY_LIBRARY_ID: runtimeEnv.BUNNY_LIBRARY_ID ?? "",
  SITE_URL: runtimeEnv.SITE_URL ?? "",
} satisfies AppEnv;

export const env: AppEnv = rawEnv;

export function getOptionalEnvValue(key: OptionalEnvKey): string {
  return env[key].trim();
}

export function getMissingOptionalEnvKeys(keys: readonly OptionalEnvKey[]): OptionalEnvKey[] {
  return keys.filter((key) => getOptionalEnvValue(key).length === 0);
}

export function getContentSource(): ContentSource {
  const value = env.CONTENT_SOURCE.trim().toLowerCase();

  if (CONTENT_SOURCES.includes(value as ContentSource)) {
    return value as ContentSource;
  }

  if (value === "mock") {
    throw new Error("[config] Only CONTENT_SOURCE=directus is supported in Phase 2B runtime.");
  }

  throw new Error(
    `[config] Invalid CONTENT_SOURCE "${env.CONTENT_SOURCE}". Expected one of: ${CONTENT_SOURCES.join(", ")}.`,
  );
}

export function assertDirectusEnv(): void {
  const missing = getMissingOptionalEnvKeys(["DIRECTUS_URL"]);

  if (missing.length === 0) {
    return;
  }

  const lines = [
    "[config] CONTENT_SOURCE=directus requires a Directus base URL.",
    ...missing.map((key) => `- ${key}`),
    "Add the missing values to your local .env before enabling the Directus provider.",
  ];

  throw new Error(lines.join("\n"));
}

export function hasBunnyLibraryId(): boolean {
  return getOptionalEnvValue("BUNNY_LIBRARY_ID").length > 0;
}
