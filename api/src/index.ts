import { serve } from "@hono/node-server";
import { createApp } from "./app.ts";
import { memoryStore } from "./store.ts";
import { tableStore } from "./table-store.ts";

/**
 * Binds 0.0.0.0:$PORT and reads its config from the environment, which is all
 * Container Apps, App Service and Embr have in common. Nothing here knows which
 * of the three it is running on.
 */
const port = Number(process.env.PORT ?? 8080);

const account = process.env.SCORES_STORAGE_ACCOUNT;
const origins = (process.env.ALLOWED_ORIGINS ?? "http://localhost:4321")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

// Without an account this runs on memory, which makes `npm start` useful
// locally and makes a misconfigured deploy obvious rather than silent.
const store = account ? tableStore({ account }) : memoryStore();
if (!account) {
  console.warn("SCORES_STORAGE_ACCOUNT is not set — scores will not survive a restart.");
}

serve({ fetch: createApp({ store, origins }).fetch, port, hostname: "0.0.0.0" }, (info) => {
  console.log(`daily scores api listening on 0.0.0.0:${info.port}`);
});
