/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />
/// <reference types="@cloudflare/workers-types" />

/**
 * The Cloudflare bindings declared in wrangler.jsonc, as seen from Astro.
 *
 * `DB`            D1, holds the `leads` table (see migrations/).
 * `ASSETS_BUCKET` R2, for anything we later need to store as a file.
 *
 * Both are optional here on purpose: a plain `astro dev` or a static preview
 * runs without a Worker, so route code must check before using them.
 */
interface CloudflareEnv {
  DB?: D1Database;
  ASSETS_BUCKET?: R2Bucket;
}

type CloudflareRuntime = import("@astrojs/cloudflare").Runtime<CloudflareEnv>;

declare namespace App {
  interface Locals extends CloudflareRuntime {}
}
