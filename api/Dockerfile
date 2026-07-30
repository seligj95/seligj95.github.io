# Node ships TypeScript stripping now, so there is no build step and no
# transpiled copy to keep in sync — the image runs the same files the tests do.
FROM node:24-alpine

ENV NODE_ENV=production
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY src ./src

# Container Apps sets PORT; this is the fallback for a plain `docker run`.
ENV PORT=8080
EXPOSE 8080

USER node
CMD ["node", "--experimental-strip-types", "src/index.ts"]
