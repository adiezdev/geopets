import en from "./en.json" with { type: "json" };
import es from "./es.json" with { type: "json" };

// adding a language = a new JSON file + an entry here
const DICTS = { en, es };
export const LANGS = Object.keys(DICTS);
export const DEFAULT_LANG = "en";
export const getDict = (lang) => DICTS[lang] ?? DICTS[DEFAULT_LANG];

// t(dict, "a.b", {name}) -> string; returns the key itself when missing so gaps are visible
export function t(dict, key, vars = {}) {
  const v = key.split(".").reduce((o, k) => (o == null ? o : o[k]), dict);
  if (typeof v !== "string") return key;
  return v.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
}

// path of a language's home page: "/" for the default, "/es/" for the rest
export const langPath = (lang) => (lang === DEFAULT_LANG ? "/" : `/${lang}/`);
