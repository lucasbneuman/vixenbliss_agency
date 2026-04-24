import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const legalRoutes = [
  "privacy",
  "terms",
  "cookies",
  "contact",
  "about",
] as const;

const disallowedTerms = [
  "adult content",
  "nsfw",
  "18+",
  "explicit",
  "sexual content",
] as const;

function readProjectFile(path: string) {
  return readFileSync(join(root, path), "utf8");
}

test("legal and trust pages exist as Astro routes", () => {
  legalRoutes.forEach((route) => {
    assert.equal(existsSync(join(root, "src", "pages", `${route}.astro`)), true);
  });
});

test("global footer exposes legal and trust links", () => {
  const layout = readProjectFile("src/layouts/Layout.astro");
  const footer = readProjectFile("src/components/Footer.astro");

  assert.match(layout, /<Footer\s*\/>/);

  legalRoutes.forEach((route) => {
    assert.match(footer, new RegExp(`href: "/${route}"`));
  });

  assert.match(footer, /VixenBliss Agency/);
});

test("legal pages use safe creative platform language", () => {
  const sourceFiles = [
    "src/components/Footer.astro",
    "src/layouts/LegalLayout.astro",
    ...legalRoutes.map((route) => `src/pages/${route}.astro`),
  ];

  sourceFiles.forEach((file) => {
    const source = readProjectFile(file).toLowerCase();

    disallowedTerms.forEach((term) => {
      assert.equal(
        source.includes(term),
        false,
        `${file} should not contain "${term}"`,
      );
    });
  });
});
