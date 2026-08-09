# Nocturnal Series — deploy mirror

This repo exists to serve the Cloudflare Worker connected to it. It is a
**deploy target, not the source of truth** — development, review tooling and
history live at
[`djackal79/luciole-website`](https://github.com/djackal79/luciole-website),
in `fashion-site/`, tracked via PR #2. Bring changes here from there; don't
develop against this repo directly.

**Draft, not launched.** `noindex` is set and `robots.txt` disallows
everything, on purpose — see PLACEHOLDERS.md before treating anything here as
final. Same rule as the source repo: nothing in `{{ }}` is real yet.

This deploys as a **Worker with static assets** (`npx wrangler deploy`), not
Cloudflare Pages — there's no `functions/` auto-routing here. `/api/enquiry`
is a real route handled explicitly in `worker/index.js`, which also serves
everything else via the `ASSETS` binding.

## Required Cloudflare project setting

**Build command must be set to `npm run build`.** Nothing else compiles the
JSX — `wrangler deploy` only uploads whatever's already in `dist/`, and
`dist/` isn't committed to this repo (build output doesn't belong in git).
Without this set, the deploy will either fail to find `dist/` or ship stale
assets. This is a dashboard setting; nobody with API access to this session
can set it.

| Setting | Value |
|---|---|
| Root directory | `/` |
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy` *(already set)* |

## Environment variables / secrets

Not yet configured on this project. Until they are:

- `VITE_SITE_ORIGIN` unset (build var) → canonical/`og:url` tags and
  `sitemap.xml` are omitted rather than guessed
- `VITE_ENQUIRY_EMAIL` unset (build var) → the enquiry form's failure state
  shows a draft placeholder instead of a mailto link
- `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` / `ENQUIRY_IP_SALT` unset
  (Worker secrets — `npx wrangler secret put <NAME>`, not build variables)
  → `/api/enquiry` returns a clean 503 rather than erroring; the form still
  degrades gracefully to its failure state

See `.env.example` for the full list and PLACEHOLDERS.md in the source repo
for what's still open.
