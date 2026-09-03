import { defineConfig } from 'astro/config';

import tailwind from "@astrojs/tailwind";
import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
  // Canonical origin. `base` stays unset: on Cloudflare the site is served from
  // the root, not a /astro-agency-template/ subpath as it was on GitHub Pages.
  // Without `site`, Astro stamps canonical and og:image as http://localhost:4321.
  // Override per environment with PUBLIC_SITE_URL.
  site: process.env.PUBLIC_SITE_URL || 'https://intentshark.com',

  integrations: [tailwind()],

  // Astro 5 hybrid rendering: every page stays prerendered to static HTML by
  // default, and only the routes that opt out with `export const prerender =
  // false` are handed to the Worker at runtime. Today that is just
  // `src/pages/api/lead.ts`, which needs the D1 binding.
  output: 'static',

  adapter: cloudflare({
    // Serve the prerendered HTML straight from Cloudflare's asset store and
    // only fall through to the Worker for the server-rendered API route.
    imageService: 'compile',
    platformProxy: {
      // `astro dev` gets real local D1/R2 bindings from wrangler.jsonc via
      // Miniflare, so `locals.runtime.env.DB` works in development too.
      enabled: true,
    },
  }),
});
