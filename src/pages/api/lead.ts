import type { APIRoute } from "astro";

/**
 * POST /api/lead
 *
 * The one server-rendered route on the site. Everything else is prerendered
 * static HTML, so this file opts out of prerendering explicitly and runs in the
 * Cloudflare Worker where the D1 binding lives.
 */
export const prerender = false;

/* ------------------------------------------------------------------ limits */

/** Length caps, applied to every field before anything touches the database. */
const MAX = {
  email: 254, // RFC 5321 maximum for a forward path
  site: 255,
  name: 120,
  company: 160,
} as const;

/** The only two values `intent` is allowed to take. */
const INTENTS = ["consultation", "engagement"] as const;
type Intent = (typeof INTENTS)[number];

/**
 * Deliberately conservative: one @, no whitespace, a dot-something TLD. This
 * mirrors the client-side check in get-started.astro so the two agree.
 */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

/* ------------------------------------------------------------- responses */

const json = (body: unknown, status: number): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });

const badRequest = (error: string): Response => json({ ok: false, error }, 400);

/* ------------------------------------------------------------ validation */

/**
 * Normalise one optional free-text field. Returns `null` when absent/blank so
 * the column stores NULL rather than an empty string, or `false` when the value
 * is the wrong type or too long.
 */
function optionalText(
  value: unknown,
  max: number,
): string | null | false {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  if (trimmed === "") return null;
  if (trimmed.length > max) return false;
  return trimmed;
}

/* ----------------------------------------------------------------- route */

export const POST: APIRoute = async ({ request, locals }) => {
  /* ---- body must be JSON --------------------------------------------- */

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return badRequest("Send a JSON body.");
  }

  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
    return badRequest("Send a JSON object.");
  }

  const body = payload as Record<string, unknown>;

  /* ---- email (required) ---------------------------------------------- */

  const rawEmail = body.email;
  if (typeof rawEmail !== "string") {
    return badRequest("An email address is required.");
  }
  const email = rawEmail.trim();
  if (email === "") {
    return badRequest("An email address is required.");
  }
  if (email.length > MAX.email) {
    return badRequest("That email address is too long.");
  }
  if (!EMAIL_RE.test(email)) {
    return badRequest("That email address does not look right.");
  }

  /* ---- intent (required, closed set) --------------------------------- */

  const rawIntent = body.intent;
  if (typeof rawIntent !== "string" || !INTENTS.includes(rawIntent as Intent)) {
    return badRequest(
      `intent must be one of: ${INTENTS.join(", ")}.`,
    );
  }
  const intent = rawIntent as Intent;

  /* ---- optional fields ----------------------------------------------- */

  const site = optionalText(body.site, MAX.site);
  if (site === false) return badRequest("That website value is not valid.");

  const name = optionalText(body.name, MAX.name);
  if (name === false) return badRequest("That name is not valid.");

  const company = optionalText(body.company, MAX.company);
  if (company === false) return badRequest("That company name is not valid.");

  /* ---- binding must exist -------------------------------------------- */

  // In a plain `astro dev` without wrangler bindings, or in a static build
  // served without the Worker, `DB` simply is not there. Say so plainly rather
  // than throwing an opaque TypeError; the browser falls back to mailto.
  const db = locals?.runtime?.env?.DB;
  if (!db) {
    return json(
      {
        ok: false,
        error:
          "The lead database is not available in this environment. Run with wrangler bindings, or use the email fallback.",
      },
      503,
    );
  }

  /* ---- insert -------------------------------------------------------- */

  try {
    // Prepared statement with bound parameters. No SQL is ever built by
    // concatenating user input.
    await db
      .prepare(
        "INSERT INTO leads (email, site, name, company, intent) VALUES (?, ?, ?, ?, ?)",
      )
      .bind(email, site, name, company, intent)
      .run();
  } catch (error) {
    // Log for the Worker tail; return nothing specific to the caller.
    console.error("lead insert failed", error);
    return json(
      { ok: false, error: "Could not save that right now. Please try again." },
      500,
    );
  }

  return json({ ok: true }, 200);
};

/** Anything that is not a POST gets a clear 405 rather than a 404. */
export const ALL: APIRoute = () =>
  new Response(JSON.stringify({ ok: false, error: "Use POST." }), {
    status: 405,
    headers: {
      "content-type": "application/json; charset=utf-8",
      allow: "POST",
    },
  });
