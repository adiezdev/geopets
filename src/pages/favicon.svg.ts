import type { APIRoute } from "astro";
import { SHAPES, maskFrom, standalone } from "../lib/geopets.js";

const s = SHAPES.cube;
export const GET: APIRoute = () =>
  new Response(standalone(maskFrom(s.fn), { color: s.color, legs: s.legs, shade: s.shade, state: "idle" }), {
    headers: { "Content-Type": "image/svg+xml; charset=utf-8" },
  });
