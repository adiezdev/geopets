import { describe, it, expect } from "vitest";
import { LANGS, getDict, t } from "../src/lib/i18n/index.js";
import { ALL_STATES } from "../src/lib/geopets.js";

const keys = (o, p = "") => Object.entries(o).flatMap(([k, v]) =>
  v && typeof v === "object" ? keys(v, p + k + ".") : [p + k]).sort();

describe("i18n", () => {
  it("has english and spanish", () => {
    expect(LANGS).toEqual(["en", "es"]);
  });

  it("has the same keys in every language", () => {
    expect(keys(getDict("es"))).toEqual(keys(getDict("en")));
  });

  it("labels every state in every language", () => {
    for (const lang of LANGS) for (const st of ALL_STATES)
      expect(getDict(lang).state[st], `${lang} state.${st}`).toBeTruthy();
  });

  it("interpolates placeholders", () => {
    expect(t({ a: { b: "Hi {name}, {n}" } }, "a.b", { name: "Cubo", n: 3 })).toBe("Hi Cubo, 3");
  });

  it("returns the key when missing", () => {
    expect(t({}, "nope.x")).toBe("nope.x");
  });

  it("license text names CC BY 4.0 and adiez.dev in both", () => {
    for (const lang of LANGS) {
      expect(getDict(lang).licenseTxt).toContain("CC BY 4.0");
      expect(getDict(lang).licenseTxt).toContain("adiez.dev");
    }
  });

  it("names presets per language", () => {
    expect(t(getDict("en"), "create.presetName", { shape: "cube" })).toBe("my-cube");
    expect(t(getDict("es"), "create.presetName", { shape: "cube" })).toBe("mi-cube");
  });

  it("spanish strings are spanish", () => {
    expect(getDict("es").gallery.title).toBe("Galería");
    expect(getDict("en").gallery.title).toBe("Gallery");
  });
});
