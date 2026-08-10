import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import pagefind from "astro-pagefind";
import {
  createTechCommunityViewFetcher,
  techCommunityViewResponse,
} from "./api/src/tech-community.ts";

const readTechCommunityViews = createTechCommunityViewFetcher();

const techCommunityViewsDev = {
  name: "tech-community-views-dev",
  configureServer(server) {
    server.middlewares.use(async (request, response, next) => {
      const requestUrl = new URL(request.url ?? "/", "http://localhost");
      const match = requestUrl.pathname.match(
        /^\/api\/views\/tech-community\/(\d+)$/
      );
      if (!match) return next();

      const result = await techCommunityViewResponse(
        requestUrl.searchParams.get("url") ?? "",
        match[1],
        readTechCommunityViews
      );
      response.statusCode = result.status;
      result.headers.forEach((value, name) => response.setHeader(name, value));
      response.end(await result.text());
    });
  },
};

export default defineConfig({
  site: "https://jordanselig.com",
  integrations: [sitemap(), pagefind()],
  vite: {
    plugins: [techCommunityViewsDev],
  },
  markdown: {
    shikiConfig: {
      theme: "github-dark",
    },
  },
});
