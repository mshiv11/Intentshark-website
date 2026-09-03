# Intent Shark

Marketing site for Intent Shark, a Reddit and AI-search (AEO) visibility programme
for B2B software brands.

Built with Astro 5 and Tailwind CSS 3. Static output, deployed to GitHub Pages.

## Run it

```bash
npm install
npm run dev      # local dev server
npm run build    # astro check + astro build
npm run preview  # serve dist/
```

## Pages

| Route          | File                          | What it does                                                            |
| -------------- | ----------------------------- | ----------------------------------------------------------------------- |
| `/`            | `src/pages/index.astro`       | Hero, the scanner, how it works, why Reddit, the limits, final CTA.     |
| `/get-started` | `src/pages/get-started.astro` | Reads `?site=`, picks a path, composes a prefilled `mailto:`.           |
| `/404`         | `src/pages/404.astro`         | Not found.                                                              |

## The scanner

Entirely client side. It takes a domain and an optional description, matches
them against the topic clusters in `src/data/redditTargets.json`, and builds
**live Reddit search deep links**.

Nothing is crawled, cached, scored, or stored. Every link the scanner produces
runs as a fresh search on reddit.com the moment it is clicked. Keep it that way:
the copy on the page promises exactly this and nothing more.

To widen coverage, add a topic to `src/data/redditTargets.json`:

```json
{
  "id": "cold-email",
  "label": "Cold email and outbound",
  "keywords": ["cold email", "outbound", "deliverability"],
  "subreddits": ["SaaS", "sales"],
  "queries": ["cold email tool", "best outbound software"]
}
```

Only add subreddits you are certain exist.

## Base path

The site is served from the root of its domain on Cloudflare, so `base` is
unset and `withBase()` in `src/utils/url.ts` is a pass-through.

Internal links still go through `withBase()`. It is the one place to change if
the site is ever mounted on a subpath again.

## Deploying

See [DEPLOY.md](./DEPLOY.md) for Cloudflare deployment, the D1 migrations, and
the two GitHub Actions secrets.

## Values to swap before launch

`src/pages/get-started.astro` has a commented constants block at the top:

- `INBOX` the address enquiries are addressed to.
- `BOOKING_URL` a Cal.com or Calendly link. Empty string hides the button.

## Design system

Tokens live in `src/styles/global.css` (`:root`) and are wired into
`tailwind.config.mjs` under `theme.extend.colors`.

- Light editorial base on PAPER, punctuated by full-bleed INK sections.
- Headings in Platypi, body in a Calibri system stack, monospace eyebrow labels.
- Hairline borders. No drop shadows, no glows, no gradients.
