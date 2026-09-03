# Deploying Intent Shark to Cloudflare

The site is an Astro 5 project using the Cloudflare adapter in hybrid mode:
every page is prerendered to static HTML, and only `src/pages/api/lead.ts`
(which carries `export const prerender = false`) runs in the Worker.

`dist/_routes.json` is generated at build time and tells Cloudflare to serve
everything from the asset store except `/api/*`, so the Worker is only invoked
for real API traffic.

## Provisioned resources

These already exist in the Cloudflare account and are wired up in
`wrangler.jsonc`:

| Binding         | Kind | Name / ID                              |
| --------------- | ---- | -------------------------------------- |
| `DB`            | D1   | `intentshark` — `2cda3792-1f4d-47d9-b9cd-eb707aa160bb` |
| `ASSETS_BUCKET` | R2   | `intentshark-assets`                   |
| `SESSION`       | KV   | `intentshark-sessions` — `645d14f20a8942d181dbdfcf675c95c3` |

`SESSION` is not used by any page today. The adapter points Astro's session
storage at a KV binding of that name, so it must exist or any future session
read fails at runtime with ``Invalid binding `SESSION` ``.

## Deploy by hand

```sh
npm ci
npm run build          # runs astro check, then astro build
npx wrangler deploy    # reads wrangler.jsonc for name, main, assets, bindings
```

You need to be logged in first (`npx wrangler login`), or have
`CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` set in your shell.

## Deploy from GitHub Actions

`.github/workflows/deploy.yml` builds and deploys on every push to `main`, and
on manual `workflow_dispatch`. It uses `cloudflare/wrangler-action@v3`.

Two repository secrets must be set under
**Settings → Secrets and variables → Actions**:

- **`CLOUDFLARE_API_TOKEN`** — an API token created from the *Edit Cloudflare
  Workers* template, with **D1 Edit** and **Workers R2 Storage Edit** added so
  the `DB` and `ASSETS_BUCKET` bindings resolve at deploy time.
- **`CLOUDFLARE_ACCOUNT_ID`** — the account ID shown in the Cloudflare
  dashboard sidebar.

## Deploy via the Cloudflare dashboard (Git integration)

As an alternative to the Actions workflow, let Cloudflare build on its own:

1. Cloudflare dashboard → **Workers & Pages** → **Create** → **Workers** →
   **Import a repository**.
2. Authorise the GitHub account and pick this repository.
3. Set the build configuration:
   - **Build command:** `npm run build`
   - **Deploy command:** `npx wrangler deploy`
   - **Root directory:** the repository root
4. Cloudflare reads `wrangler.jsonc` for the bindings, so `DB`,
   `ASSETS_BUCKET` and `SESSION` attach automatically. Confirm them under
   **Settings → Bindings** after the first deploy.

Use either this or the Actions workflow, not both — two deploy paths pointing at
the same Worker will race each other.

## Migrations

Schema lives in `migrations/`. Apply the initial one:

```sh
# remote (the real database)
npx wrangler d1 execute intentshark --remote --file=./migrations/0001_create_leads.sql

# local (Miniflare's copy, used by `astro dev`)
npx wrangler d1 execute intentshark --local --file=./migrations/0001_create_leads.sql
```

`0001_create_leads.sql` has already been applied to the remote database. Both
statements are `IF NOT EXISTS`, so re-running it is harmless.

Check what is there:

```sh
npx wrangler d1 execute intentshark --remote \
  --command "SELECT id, email, intent, created_at FROM leads ORDER BY id DESC LIMIT 20;"
```

## Local development

```sh
npm run dev
```

The adapter's `platformProxy` is enabled in `astro.config.mjs`, so `astro dev`
gets real local D1/R2/KV bindings via Miniflare and `locals.runtime.env.DB`
works. Apply the migration with `--local` first or the insert will fail on a
missing table.

If the binding is missing for any reason, `/api/lead` returns a 503 with a clear
message rather than throwing, and the Get started form falls back to opening a
`mailto:` draft to `m@intentshark.com`. No lead is lost either way.

## The lead endpoint

`POST /api/lead`, JSON body:

| Field     | Required | Notes                                     |
| --------- | -------- | ----------------------------------------- |
| `email`   | yes      | validated, max 254 chars                  |
| `intent`  | yes      | exactly `consultation` or `engagement`    |
| `site`    | no       | max 255 chars                             |
| `name`    | no       | max 120 chars                             |
| `company` | no       | max 160 chars                             |

Returns `{ "ok": true }` on success, `400` with `{ ok: false, error }` on
validation failure, `503` if the D1 binding is absent, `500` on a database
error (generic message, no internals leaked). The insert uses a prepared
statement with bound parameters; no SQL is built by string concatenation.

## A note on customer login

Cloudflare has no first-party end-user authentication product. Cloudflare Access
(part of Zero Trust) authenticates *your team* into internal applications; it is
not a consumer signup-and-login system, and licensing it per end user is not the
intended use.

Cloudflare's own developer documentation points at third-party identity
providers for this — **Stytch**, **Auth0** and **WorkOS** are the ones it names.

So if Intent Shark ever needs customer accounts, the options are:

1. **Use a third-party provider** — Stytch, Auth0, WorkOS, Clerk or Supabase
   Auth, called from the Worker. Fastest and least code to own.
2. **Build it on `workers-oauth-provider`** — Cloudflare's own library
   (`@cloudflare/workers-oauth-provider`), which implements an OAuth 2.1
   provider on top of Workers KV. It gives you the token machinery, but you
   still own the user store, password or passkey handling, email verification
   and account recovery.

There is no third option where Cloudflare hands you end-user auth out of the
box. Plan for one of the two above.
