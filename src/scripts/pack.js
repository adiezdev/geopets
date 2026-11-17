import JSZip from "jszip";
import { SHAPES, ALL_STATES, maskFrom, standalone, fileName } from "../lib/geopets.js";

const petOpts = (s) => ({ color: s.color, legs: s.legs, shade: s.shade });

// [folder, mask, opts] for the gallery pack; "all" or one shape key
export const packEntries = (filter) =>
  Object.entries(SHAPES).filter(([k]) => filter === "all" || filter === k).map(([k, s]) => [k, maskFrom(s.fn), petOpts(s)]);

// format: "svg" | "gif" (transparent) | "gifw" (white background)
export const extFor = (format) => (format === "svg" ? "svg" : "gif");

// Binds the format once, so a pack keeps one format even if the page's format chip changes mid-export.
// gif(mask, opts, bg) -> Uint8Array is injected (it needs the DOM).
export const fileForFormat = (format, gif) => async (mask, opts) =>
  format === "svg" ? standalone(mask, opts) : new Blob([await gif(mask, opts, format === "gifw" ? "#FFFFFF" : null)], { type: "image/gif" });

export const packName = (filter) => (filter === "all" ? "geopets-pack.zip" : `geopets-${filter}.zip`);

// fileFor(mask, opts) -> string | Blob | Promise of either; defaults to the standalone SVG
export async function buildPack(entries, { ext, licenseTxt, onProgress, fileFor = (m, o) => standalone(m, o) }) {
  const zip = new JSZip();
  const total = entries.length * ALL_STATES.length;
  let i = 0;
  for (const [folder, mask, opts] of entries) {
    for (const state of ALL_STATES) {
      zip.file(`geopets/${folder}/${fileName(folder, state, ext)}`, await fileFor(mask, { ...opts, state }));
      onProgress?.(++i, total);
    }
  }
  zip.file("geopets/LICENSE.txt", licenseTxt);
  return zip.generateAsync({ type: "blob" });
}
