/**
 * Where the site's API lives. Overridable at build time so local and preview
 * site builds can use their matching API deployment.
 */
export const API_BASE: string =
  import.meta.env.PUBLIC_SCORES_API ?? "https://api.jordanselig.com";

/** Astro serves this route itself during development. */
export const VIEW_API_BASE: string =
  import.meta.env.PUBLIC_SCORES_API ?? (import.meta.env.DEV ? "" : API_BASE);
