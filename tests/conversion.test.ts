import test from "node:test";
import assert from "node:assert/strict";

import { resolveCta } from "../src/lib/conversion.ts";

test("resolveCta appends missing agency UTM params to external CTA URLs", () => {
  const cta = resolveCta("https://example.com/watch?ref=feed", "launch", "video-one");
  const url = new URL(cta.href);

  assert.equal(cta.href, "https://example.com/watch?ref=feed&utm_source=agency&utm_medium=reels&utm_campaign=launch&utm_content=video-one");
  assert.equal(cta.isDisabled, false);
  assert.equal(cta.isExternal, true);
  assert.equal(url.searchParams.get("ref"), "feed");
});

test("resolveCta does not duplicate or overwrite existing UTM params", () => {
  const cta = resolveCta(
    "https://example.com/watch?utm_source=creator&utm_campaign=existing",
    "launch",
    "video-one",
  );
  const url = new URL(cta.href);

  assert.equal(url.searchParams.get("utm_source"), "creator");
  assert.equal(url.searchParams.get("utm_medium"), "reels");
  assert.equal(url.searchParams.get("utm_campaign"), "existing");
  assert.equal(url.searchParams.get("utm_content"), "video-one");
});

test("resolveCta keeps internal CTA URLs local and without UTM params", () => {
  const cta = resolveCta("/continue", "launch", "video-one");

  assert.deepEqual(cta, {
    href: "/continue",
    isDisabled: false,
    isExternal: false,
  });
});

test("resolveCta falls back safely for invalid CTA URLs", () => {
  const cta = resolveCta("javascript:alert(1)", "launch", "video-one");

  assert.deepEqual(cta, {
    href: "#",
    isDisabled: true,
    isExternal: false,
  });
});
