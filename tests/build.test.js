// Runs against dist/: `npm run build` first.
import { describe, it, expect } from "vitest";
import fs from "node:fs";

const SITE = "https://geopet.adiez.dev";
const read = (p) => fs.readFileSync(new URL(`../dist/${p}`, import.meta.url), "utf8");
const pages = { en: { file: "index.html", url: `${SITE}/` }, es: { file: "es/index.html", url: `${SITE}/es/` } };

describe.each(Object.entries(pages))("page %s", (lang, { file, url }) => {
  const html = read(file);

  it("declares its language", () => {
    expect(html).toContain(`<html lang="${lang}"`);
  });

  it("has canonical and hreflang alternates", () => {
    expect(html).toMatch(new RegExp(`<link rel="canonical" href="${url}"`));
    expect(html).toContain(`hreflang="en" href="${SITE}/"`);
    expect(html).toContain(`hreflang="es" href="${SITE}/es/"`);
    expect(html).toContain(`hreflang="x-default" href="${SITE}/"`);
  });

  it("has an absolute og:image per language", () => {
    expect(html).toContain(`property="og:image" content="${SITE}/og-${lang}.png"`);
  });

  it("has JSON-LD with the CC BY 4.0 license", () => {
    expect(html).toContain('type="application/ld+json"');
    expect(html).toContain('"license":"https://creativecommons.org/licenses/by/4.0/"');
  });

  it("keeps english anchors and the footer credit", () => {
    for (const id of ["gallery", "create", "license"]) expect(html).toContain(`id="${id}"`);
    expect(html).toContain('href="https://adiez.dev"');
  });

  it("links every static svg in the html (crawlable)", () => {
    expect(html).toContain('href="/pets/geopet-hexagon-503.svg"');
    expect(html.match(/href="\/pets\/geopet-[^"]+\.svg"/g).length).toBe(145);
  });

  it("links to the twin language", () => {
    expect(html).toContain(lang === "en" ? 'href="/es/"' : 'href="/"');
  });
});

describe("static pets", () => {
  it("publishes 145 english-named svgs", () => {
    const files = fs.readdirSync(new URL("../dist/pets/", import.meta.url)).filter((f) => f.endsWith(".svg"));
    expect(files.length).toBe(145);
    expect(files.every((f) => /^geopet-(cube|triangle|circle|diamond|hexagon)-[a-z0-9]+\.svg$/.test(f))).toBe(true);
  });

  it("serves standalone files with attribution", () => {
    const svg = read("pets/geopet-cube-404.svg");
    expect(svg.startsWith("<?xml")).toBe(true);
    expect(svg).toContain("CC BY 4.0");
  });
});

describe("assets", () => {
  it("points robots.txt at the sitemap", () => {
    expect(read("robots.txt")).toContain(`Sitemap: ${SITE}/sitemap-index.xml`);
  });

  it.each(["en", "es"])("has a 1200×630 og image for %s", (lang) => {
    const png = fs.readFileSync(new URL(`../dist/og-${lang}.png`, import.meta.url));
    expect(png.subarray(1, 4).toString()).toBe("PNG");
    expect(png.readUInt32BE(16)).toBe(1200);
    expect(png.readUInt32BE(20)).toBe(630);
  });

  it("uses a geopet as favicon", () => {
    expect(read("favicon.svg")).toContain("Geopets by Adiezdev");
  });
});

it("ships a sitemap", () => {
  expect(read("sitemap-index.xml")).toContain("<sitemapindex");
});
