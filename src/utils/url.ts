/**
 * Join a path onto the configured Astro `base`.
 *
 * Astro rewrites imported assets and bundled CSS/JS for you, but it does not
 * touch hand-written hrefs or `public/` references. Every internal link in this
 * site must go through this helper or it will 404 under `/astro-agency-template/`.
 */
export const withBase = (p: string): string =>
  `${import.meta.env.BASE_URL.replace(/\/$/, "")}/${p.replace(/^\//, "")}`;

export default withBase;
