import { describe, it, expect } from "vitest";
import JSZip from "jszip";
import { packEntries, packName, buildPack, fileForFormat, extFor } from "../src/scripts/pack.js";
import { frameCount, serial } from "../src/scripts/gif.js";
import { maskFrom } from "../src/lib/geopets.js";

describe("packs", () => {
  it("follows the shape filter", () => {
    expect(packEntries("cube").map((e) => e[0])).toEqual(["cube"]);
    expect(packEntries("all").length).toBe(5);
  });

  it("names packs in english", () => {
    expect(packName("all")).toBe("geopets-pack.zip");
    expect(packName("cube")).toBe("geopets-cube.zip");
  });

  it("zips 29 english-named svgs per pet plus the license", async () => {
    const blob = await buildPack(packEntries("cube"), { ext: "svg", licenseTxt: "LICENSE BODY" });
    const zip = await JSZip.loadAsync(await blob.arrayBuffer());
    const files = Object.keys(zip.files).filter((f) => !zip.files[f].dir);
    expect(files.filter((f) => f.startsWith("geopets/cube/geopet-cube-") && f.endsWith(".svg")).length).toBe(29);
    expect(files).toContain("geopets/cube/geopet-cube-404.svg");
    expect(await zip.file("geopets/LICENSE.txt").async("string")).toBe("LICENSE BODY");
    expect(files.length).toBe(30);
  });

  it("reports progress", async () => {
    const seen = [];
    await buildPack(packEntries("cube"), { ext: "svg", licenseTxt: "x", onProgress: (i, n) => seen.push([i, n]) });
    expect(seen.at(-1)).toEqual([29, 29]);
  });
});

describe("santa hat packs", () => {
  it("marks hat packs in folder and zip names", () => {
    const [folder, , o] = packEntries("cube", true)[0];
    expect(folder).toBe("cube-santa");
    expect(o.hat).toBe(true);
    expect(packEntries("cube")[0][0]).toBe("cube");
    expect(packName("cube", true)).toBe("geopets-cube-santa.zip");
    expect(packName("all", true)).toBe("geopets-santa-pack.zip");
  });
});

describe("format is fixed when a pack starts", () => {
  it("keeps producing the starting format even if the page format changes", async () => {
    let pageFmt = "gifw";
    const gifCalls = [];
    const fileFor = fileForFormat(pageFmt, async (m, o, bg) => { gifCalls.push(bg); return new Uint8Array([71, 73, 70]); });
    pageFmt = "svg"; // user clicks another chip mid-pack
    const out = await fileFor(maskFrom(() => 1), { color: "#000", state: "idle" });
    expect(out).toBeInstanceOf(Blob);
    expect(gifCalls).toEqual(["#FFFFFF"]);
    expect(extFor(pageFmt)).toBe("svg");
    expect(extFor("gif")).toBe("gif");
  });

  it("returns standalone svg text for svg", async () => {
    const out = await fileForFormat("svg", () => { throw new Error("no gif"); })(maskFrom(() => 1), { color: "#000", state: "idle" });
    expect(out.startsWith("<?xml")).toBe(true);
  });
});

describe("gif exports never overlap", () => {
  it("runs concurrent calls one after another", async () => {
    const log = [];
    const job = serial(async (id) => { log.push(`start ${id}`); await new Promise((r) => setTimeout(r, 10)); log.push(`end ${id}`); return id; });
    const results = await Promise.all([job("a"), job("b")]);
    expect(results).toEqual(["a", "b"]);
    expect(log).toEqual(["start a", "end a", "start b", "end b"]);
  });

  it("keeps going after a failed call", async () => {
    const job = serial(async (x) => { if (x === "bad") throw new Error("boom"); return x; });
    await expect(job("bad")).rejects.toThrow("boom");
    await expect(job("ok")).resolves.toBe("ok");
  });
});

describe("gif loop length", () => {
  it("is one frame without animations (reduced motion)", () => {
    expect(frameCount([])).toBe(1);
  });
  it("covers the LCM of periods", () => {
    expect(frameCount([700, 1400])).toBe(28);
  });
  it("falls back to the longest period when the LCM exceeds 4 s", () => {
    expect(frameCount([1800, 3500])).toBe(70);
  });
});
