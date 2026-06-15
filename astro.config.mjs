import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import pagefind from "astro-pagefind";

export default defineConfig({
  site: "https://jordanselig.com",
  integrations: [sitemap(), pagefind()],
  markdown: {
    shikiConfig: {
      theme: "github-dark",
    },
  },
});
