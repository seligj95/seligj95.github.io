import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import pagefind from "astro-pagefind";
import { createBuilderBlogViewFetcher, builderBlogViewResponse } from "./api/src/builder-blog.ts";
import {
  createTechCommunityViewFetcher,
  techCommunityViewResponse,
} from "./api/src/tech-community.ts";

const readTechCommunityViews = createTechCommunityViewFetcher();
const readBuilderBlogViews = createBuilderBlogViewFetcher();

const externalViewsDev = {
  name: "external-views-dev",
  configureServer(server) {
    server.middlewares.use(async (request, response, next) => {
      const requestUrl = new URL(request.url ?? "/", "http://localhost");
      const match = requestUrl.pathname.match(
        /^\/api\/views\/tech-community\/(\d+)$/
      );
      const builderMatch = requestUrl.pathname.match(/^\/api\/views\/builder-blog\/([^/]+)$/);
      if (!match && !builderMatch) return next();

      const result = builderMatch
        ? await builderBlogViewResponse(builderMatch[1], readBuilderBlogViews)
        : await techCommunityViewResponse(
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
    plugins: [externalViewsDev],
  },
  markdown: {
    shikiConfig: {
      theme: "github-dark",
    },
  },
});
