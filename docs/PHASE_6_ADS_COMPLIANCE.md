# Phase 6 Ads Compliance

Phase 6 adds legal and trust pages for VixenBliss Agency before paid social campaigns. The implementation keeps the landing experience focused on AI-driven visual content, creative digital experiences, and avatar-based media.

No feed ordering, CTA behavior, analytics provider, consent flow, or reel interaction changes are introduced in this phase.

## Pages Created

- `/privacy` - explains basic technical data, site interaction events, navigation events, use of information, service providers, external links, contact, and last update date.
- `/terms` - defines acceptable site use, acceptance of terms, limited responsibility, external links, service availability, and site modifications.
- `/cookies` - explains technical cookies, interaction events, experience improvements, possible future measurement tools, and browser controls.
- `/contact` - provides a simple contact path for inquiries, support, and legal requests.
- `/about` - positions VixenBliss Agency as a digital platform focused on AI-generated visual content and creative media experiences.

## Global Footer

The shared layout now includes a compact footer with:

- Privacy
- Terms
- Cookies
- Contact
- About
- Copyright text for the current year

The footer is fixed and compact so the links remain discoverable without changing the reel feed height, scroll snap behavior, or CTA placement.

## Ads Review Support

These pages help campaign readiness by making the public landing page more transparent and trustworthy:

- visitors can find privacy, terms, cookie, contact, and company information from every route;
- service providers are described in neutral operational terms;
- external links are disclosed without heavy friction;
- the brand positioning stays aligned with creative technology and visual media;
- the contact channel is visible for support and legal requests.

## Pre-Campaign Checklist

- Site language is professional, creative, and technology-focused.
- Ad creative and landing page messaging are aligned.
- Legal and trust pages are visible from the global footer.
- Contact email is available.
- Branding is clear on legal, trust, and feed states.
- Homepage remains fast and mobile optimized.
- Reel feed scroll, snap behavior, and CTA placement still work.
- No age verification flow is present.
- No complex consent flow is present.
- No new external analytics provider is added.

## Validation

Run before campaign launch:

```bash
npm test
npm run build
```

Then manually verify:

- `/privacy`
- `/terms`
- `/cookies`
- `/contact`
- `/about`
- `/`
- `/health.json`

