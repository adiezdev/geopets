import { describe, it, expect } from "vitest";
import fs from "node:fs";
import { SHAPES, STATE_KEYS, HTTP, ALL_STATES, maskFrom, layout, svgPet, standalone, fileName, slugify } from "../src/lib/geopets.js";

const opts = (k, state) => ({ color: SHAPES[k].color, legs: SHAPES[k].legs, shade: SHAPES[k].shade, state });

describe("generator", () => {
  it("uses english keys", () => {
    expect(Object.keys(SHAPES)).toEqual(["cube", "triangle", "circle", "diamond", "hexagon"]);
    expect(STATE_KEYS).toEqual(["idle","happy","sad","angry","love","sleeping","surprised","typing","thinking","dizzy","waving","celebrating","idea","music","coffee","loading","error"]);
    expect(Object.keys(HTTP)).toEqual(["200","201","204","301","400","401","403","404","418","429","500","503"]);
    expect(ALL_STATES.length).toBe(29);
  });

  it("shades every shape (right edge and bottom row)", () => {
    for (const k in SHAPES) {
      expect(SHAPES[k].shade, k).toBe(true);
      expect(svgPet(maskFrom(SHAPES[k].fn), opts(k, "idle"), "t-"), k).toContain('fill="#000" opacity=".2"');
    }
  });

  it("draws a santa hat only when asked", () => {
    for (const k in SHAPES) {
      const m = maskFrom(SHAPES[k].fn);
      expect(svgPet(m, opts(k, "idle"), "t-"), k).not.toContain('class="t-hat"');
      expect(svgPet(m, { ...opts(k, "idle"), hat: true }, "t-"), k).toContain('class="t-hat"');
    }
  });

  it("keeps the hat on http pets and empty masks don't crash", () => {
    expect(svgPet(maskFrom(SHAPES.cube.fn), { ...opts("cube", "404"), hat: true }, "t-")).toContain('class="t-hat"');
    expect(svgPet(maskFrom(() => 0), { color: "#000", hat: true }).endsWith("</svg>")).toBe(true);
  });

  it("keeps character names", () => {
    expect(Object.values(SHAPES).map(s => s.name)).toEqual(["Cubo", "Tri", "Bola", "Rombi", "Hexa"]);
  });

  it("every shape × state yields a closed svg (145)", () => {
    let n = 0;
    for (const k in SHAPES) for (const st of ALL_STATES) {
      const s = svgPet(maskFrom(SHAPES[k].fn), opts(k, st), "t-");
      expect(s.startsWith("<svg")).toBe(true);
      expect(s.endsWith("</svg>")).toBe(true);
      n++;
    }
    expect(n).toBe(145);
  });

  it("is byte-identical to the legacy generator", () => {
    const legacy = JSON.parse(fs.readFileSync(new URL("./fixtures/legacy.json", import.meta.url)));
    const shapeMap = { cubo: "cube", tri: "triangle", bola: "circle", rombi: "diamond", hexa: "hexagon" };
    const stateMap = { reposo: "idle", feliz: "happy", http404: "404", saludando: "waving" };
    for (const [key, svg] of Object.entries(legacy)) {
      const [s, st] = key.split("|");
      const k = shapeMap[s];
      // legacy only shaded the cube; compare the rest unshaded so this still proves the geometry
      expect(svgPet(maskFrom(SHAPES[k].fn), { ...opts(k, stateMap[st]), shade: k === "cube" }, "gp-"), key).toBe(svg);
    }
  });

  it("handles an empty mask", () => {
    const m = maskFrom(() => 0);
    expect(layout(m)).toBeNull();
    expect(svgPet(m, { color: "#000" }).endsWith("</svg>")).toBe(true);
  });

  it("labels an empty mask in the page language", () => {
    const m = maskFrom(() => 0);
    expect(svgPet(m, { color: "#000" })).toContain(">empty<");
    expect(svgPet(m, { color: "#000", emptyLabel: "vacío" })).toContain(">vacío<");
  });
});

describe("files", () => {
  it("builds english file names", () => {
    expect(fileName("cube", "happy", "svg")).toBe("geopet-cube-happy.svg");
    expect(fileName("cube", "404", "gif")).toBe("geopet-cube-404.gif");
  });

  it("slugifies pet names to ascii", () => {
    expect(slugify("Mi Pétit 🐱")).toBe("mi-petit");
    expect(slugify("   ")).toBe("geopet");
    expect(slugify("Hexa__2")).toBe("hexa__2");
  });

  it("adds english attribution to standalone files", () => {
    const s = standalone(maskFrom(SHAPES.cube.fn), opts("cube", "idle"));
    expect(s.startsWith("<?xml")).toBe(true);
    expect(s).toContain("Geopets by Adiezdev (https://adiez.dev)");
    expect(s).toContain("CC BY 4.0");
  });
});
