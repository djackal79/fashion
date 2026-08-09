# Nocturnal Series — deploy mirror

This repo exists to serve the Cloudflare Pages/Workers build connected to it.
It is a **deploy target, not the source of truth** — development, review
tooling and history live at
[`djackal79/luciole-website`](https://github.com/djackal79/luciole-website),
in `fashion-site/`, tracked via PR #2. Bring changes here from there; don't
develop against this repo directly.

**Draft, not launched.** `noindex` is set and `robots.txt` disallows
everything, on purpose — see PLACEHOLDERS.md before treating anything here as
final. Same rule as the source repo: nothing in `{{ }}` is real yet.

## Cloudflare build settings

| Setting | Value |
|---|---|
| Root directory | *(repo root — blank)* |
| Build command | `npm run build` |
| Build output directory | `dist` |

## Environment variables

Not yet configured on this project. Until they are:

- `VITE_SITE_ORIGIN` unset → canonical/`og:url` tags and `sitemap.xml` are
  omitted rather than guessed
- `VITE_ENQUIRY_EMAIL` unset → the enquiry form's failure state shows a draft
  placeholder instead of a mailto link
- `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` / `ENQUIRY_IP_SALT` unset →
  `/api/enquiry` returns a clean 503 rather than erroring; the form still
  degrades gracefully to its failure state

See `.env.example` for the full list and PLACEHOLDERS.md in the source repo
for what's still open.
