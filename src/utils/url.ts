/**
 * Join a path onto the configured Astro `base`.
 *
 * Astro rewrites imported assets and bundled CSS/JS for you, but it does not
 * touch hand-written hrefs or `public/` references.
 *
 * On Cloudflare `base` is unset, so this is effectively a no-op today. It stays
 * because it is the single place to change if the site is ever mounted on a
 * subpath again.
 */
export const withBase = (p: string): string =>
  `${import.meta.env.BASE_URL.replace(/\/$/, "")}/${p.replace(/^\//, "")}`;

export default withBase;
