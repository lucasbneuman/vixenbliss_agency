import { trackEvent } from "./ga.ts";

export type AnalyticsEventName = "reel_impression" | "reel_active" | "cta_click" | "scroll_depth";

export interface BaseAnalyticsPayload {
  campaign_tag: string;
  feed_item_id: string;
  index: number;
  slug: string;
}

export interface CtaClickPayload extends BaseAnalyticsPayload {
  cta_url: string;
}

export interface ScrollDepthPayload {
  depth_percent: number;
  max_index: number;
  total_items: number;
}

export type AnalyticsPayloadByName = {
  cta_click: CtaClickPayload;
  reel_active: BaseAnalyticsPayload;
  reel_impression: BaseAnalyticsPayload;
  scroll_depth: ScrollDepthPayload;
};

export type AnalyticsEvent = {
  [Name in AnalyticsEventName]: {
    name: Name;
    payload: AnalyticsPayloadByName[Name];
  };
}[AnalyticsEventName];

export interface AnalyticsAdapter {
  track(event: AnalyticsEvent): void;
}

interface CreateAnalyticsAdapterOptions {
  enabled?: boolean;
  isDev?: boolean;
  logger?: (...data: unknown[]) => void;
}

const noopAnalyticsAdapter: AnalyticsAdapter = {
  track() {
    return undefined;
  },
};

const runtimeEnv =
  (import.meta as ImportMeta & { env?: { DEV?: boolean; PUBLIC_ANALYTICS_ENABLED?: string } }).env ?? {};

export function isAnalyticsEnabled(value: string | boolean | undefined): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  return value?.trim().toLowerCase() !== "false";
}

export function createAnalyticsAdapter(options: CreateAnalyticsAdapterOptions = {}): AnalyticsAdapter {
  const enabled = options.enabled ?? isAnalyticsEnabled(runtimeEnv.PUBLIC_ANALYTICS_ENABLED);

  if (!enabled) {
    return noopAnalyticsAdapter;
  }

  const isDev = options.isDev ?? runtimeEnv.DEV === true;

  if (isDev) {
    const logger = options.logger ?? console.info;

    return {
      track(event) {
        logger("[analytics]", event.name, event.payload);
      },
    };
  }

  return noopAnalyticsAdapter;
}

export function trackAnalyticsEvent<Name extends AnalyticsEventName>(
  name: Name,
  payload: AnalyticsPayloadByName[Name],
  adapter: AnalyticsAdapter = createAnalyticsAdapter(),
): void {
  try {
    adapter.track({ name, payload } as AnalyticsEvent);
  } catch (error) {
    if (runtimeEnv.DEV === true) {
      console.warn("[analytics] Event dropped", error);
    }
  }

  trackEvent(name, payload);
}
