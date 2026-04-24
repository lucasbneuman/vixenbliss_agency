import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function readProjectFile(path: string) {
  return readFileSync(join(root, path), "utf8");
}

test("homepage renders context sections before the existing reel feed", () => {
  const homepage = readProjectFile("src/pages/index.astro");

  const headerIndex = homepage.indexOf("<ConditionalHeader");
  const heroIndex = homepage.indexOf("<HeroSection");
  const aboutIndex = homepage.indexOf("<AboutSection");
  const feedIndex = homepage.indexOf("<VideoReelFeed");

  assert.ok(headerIndex > -1, "homepage should render ConditionalHeader");
  assert.ok(heroIndex > -1, "homepage should render HeroSection");
  assert.ok(aboutIndex > -1, "homepage should render AboutSection");
  assert.ok(feedIndex > -1, "homepage should keep rendering VideoReelFeed");
  assert.ok(headerIndex < heroIndex, "header should be declared before hero");
  assert.ok(heroIndex < aboutIndex, "hero should appear before about");
  assert.ok(aboutIndex < feedIndex, "about should appear before the reel feed");
});

test("hero and about use safe AI creative platform language without CTAs", () => {
  const hero = readProjectFile("src/components/HeroSection.astro");
  const about = readProjectFile("src/components/AboutSection.astro");
  const combined = `${hero}\n${about}`;
  const lower = combined.toLowerCase();

  assert.match(hero, /Experiencias visuales impulsadas por IA/);
  assert.match(hero, /avatares creativos/);
  assert.match(about, /plataforma creativa/);
  assert.match(about, /inteligencia artificial/);

  ["<button", "cta", "unlock", "adult", "nsfw", "18+", "explicit", "sexual"].forEach((term) => {
    assert.equal(lower.includes(term), false, `context sections should not include "${term}"`);
  });
});

test("conditional header hides after the first viewport", () => {
  const header = readProjectFile("src/components/ConditionalHeader.astro");

  assert.match(header, /data-conditional-header/);
  assert.match(header, /data-hero-section/);
  assert.match(header, /IntersectionObserver/);
  assert.match(header, /Inicio/);
  assert.match(header, /About/);
  assert.match(header, /Contacto/);
  assert.match(header, /Legal/);
});
