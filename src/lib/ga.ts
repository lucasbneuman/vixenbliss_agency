export type GtagParams = Record<string, unknown>;

export interface GtagWindow extends Window {
  gtag?: (...args: unknown[]) => void;
}

export function trackEvent(name: string, params?: object): void {
  try {
    if (typeof window === "undefined" || typeof (window as GtagWindow).gtag !== "function") {
      return;
    }

    (window as GtagWindow).gtag?.("event", name, params ?? {});
  } catch {
    return;
  }
}
