// Writes public/og-<lang>.png (1200×630) for social cards. Run: npm run og
import sharp from "sharp";
import { SHAPES, maskFrom, svgPet } from "../src/lib/geopets.js";
import { LANGS, getDict } from "../src/lib/i18n/index.js";

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const states = ["waving", "happy", "idle", "love", "thinking"];
const pets = Object.values(SHAPES).map((s, i) => {
  const inner = svgPet(maskFrom(s.fn), { color: s.color, legs: s.legs, shade: s.shade, state: states[i] }, `o${i}-`)
    .replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "");
  return `<svg x="${90 + i * 210}" y="250" width="180" height="197" viewBox="0 -4 21 23" shape-rendering="crispEdges">${inner}</svg>`;
}).join("");

for (const lang of LANGS) {
  const d = getDict(lang);
  const subtitle = d.meta.title.split("·")[1]?.trim() ?? "";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <rect width="1200" height="630" fill="#15131F"/>
  <text x="90" y="150" font-family="Menlo, Courier New, monospace" font-weight="700" font-size="104" fill="#EEECF6">Geopets</text>
  <text x="94" y="210" font-family="Helvetica, Arial, sans-serif" font-size="38" fill="#9D99B3">${esc(subtitle)}</text>
  ${pets}
  <text x="94" y="560" font-family="Menlo, Courier New, monospace" font-size="26" fill="#9B8CFF">CC BY 4.0 · adiez.dev</text>
</svg>`;
  await sharp(Buffer.from(svg)).png().toFile(new URL(`../public/og-${lang}.png`, import.meta.url).pathname);
  console.log(`og-${lang}.png`);
}
