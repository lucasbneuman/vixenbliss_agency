export interface ResolvedCta {
  href: string;
  isDisabled: boolean;
  isExternal: boolean;
}

const SAFE_CTA_FALLBACK = "#";

export function resolveCta(rawHref: string, campaignTag: string, slug: string): ResolvedCta {
  const safeHref = getSafeCtaHref(rawHref);

  if (safeHref === SAFE_CTA_FALLBACK) {
    return {
      href: SAFE_CTA_FALLBACK,
      isDisabled: true,
      isExternal: false,
    };
  }

  const isExternal = isExternalUrl(safeHref);

  return {
    href: isExternal ? withAgencyUtmParams(safeHref, campaignTag, slug) : safeHref,
    isDisabled: false,
    isExternal,
  };
}

export function getSafeCtaHref(rawHref: string): string {
  const href = rawHref.trim();

  if (!href) {
    return SAFE_CTA_FALLBACK;
  }

  if (href.startsWith("/") || href.startsWith("#")) {
    return href;
  }

  if (isExternalUrl(href)) {
    return href;
  }

  return SAFE_CTA_FALLBACK;
}

export function withAgencyUtmParams(rawHref: string, campaignTag: string, slug: string): string {
  try {
    const url = new URL(rawHref);
    setMissingParam(url, "utm_source", "agency");
    setMissingParam(url, "utm_medium", "reels");
    setMissingParam(url, "utm_campaign", campaignTag.trim());
    setMissingParam(url, "utm_content", slug.trim());

    return url.toString();
  } catch {
    return SAFE_CTA_FALLBACK;
  }
}

function isExternalUrl(href: string): boolean {
  try {
    const url = new URL(href);

    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function setMissingParam(url: URL, key: string, value: string): void {
  if (!value || url.searchParams.has(key)) {
    return;
  }

  url.searchParams.set(key, value);
}
