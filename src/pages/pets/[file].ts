import type { APIRoute } from "astro";
import { SHAPES, ALL_STATES, maskFrom, standalone, fileName } from "../../lib/geopets.js";

// one static file per shape × state, stable URLs for <img src> embeds
export function getStaticPaths() {
  return Object.entries(SHAPES).flatMap(([shape, s]) =>
    ALL_STATES.map((state) => ({
      params: { file: fileName(shape, state, "svg") },
      props: { svg: standalone(maskFrom(s.fn), { color: s.color, legs: s.legs, shade: s.shade, state }) },
    })));
}

export const GET: APIRoute = ({ props }) =>
  new Response(props.svg, { headers: { "Content-Type": "image/svg+xml; charset=utf-8" } });
