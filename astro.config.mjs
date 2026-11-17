// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

// The one place the domain lives: canonical, hreflang, sitemap, og:image, JSON-LD and embed URLs derive from it.
const SITE = "https://geopet.adiez.dev";

export default defineConfig({
  site: SITE,
  output: "static",
  trailingSlash: "ignore",
  i18n: {
    defaultLocale: "en",
    locales: ["en", "es"],
    routing: { prefixDefaultLocale: false },
  },
  integrations: [
    sitemap({ i18n: { defaultLocale: "en", locales: { en: "en", es: "es" } } }),
  ],
});
