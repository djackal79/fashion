# fashion: deploy mirror (read this first)

This repo only serves the Cloudflare Worker connected to it. It is a deploy target, not the source of truth. Develop in `djackal79/luciole-website` under `fashion-site/` (PR #2), then copy changes here. Don't develop against this repo directly.

## What this is

The Nocturnal Series site (Vite + React) plus `worker/index.js`, a Worker that handles `POST /api/enquiry` and serves everything else from the `ASSETS` binding. It deploys with `npx wrangler deploy` (a Worker with static assets, not Cloudflare Pages). There is no `functions/` auto-routing here.

## Build settings

The Cloudflare project needs **Build command = `npm run build`**. It was `None` on 09/08/2026, so nothing compiles `dist/` before deploy. Whether it has been changed is unconfirmed. Check the dashboard and load the deployed URL before claiming this is live. `dist/` is not committed.

## Session start

1. Check the Obsidian vault through the Google Drive connector: `20_Areas/01_Luciole_Designs/AGENTS.md` and `_status.md`. Vault wins over this repo if they disagree.
2. Verify live state (deployed URL, Supabase) before reporting it.
3. Don't read the credential notes in `20_Areas/03_Technical_Infrastructure/` unless Carl names the note in the current message. No secrets in files, commits or chat.

## Session end

Write back what changed. The Drive connector cannot edit file contents, so leave a dated note in the vault's `00_Inbox/` named `luciole-code-session-update-DD-MM-YYYY.md` with ready-to-paste blocks for `_status.md` and `_decisions.md`.

## Rules

- **Invent nothing.** Unconfirmed values are `{{ }}` placeholders in the violet draft style. No generated garment images, no stock photography, nothing in Provenance.
- Pris signs off voice and visual direction before this is called done. It is `noindex` on purpose.
- **Open conflict:** the vault says the main site uses the Atelier identity. This draft's palette matches neither Atelier nor Nocturne. Don't restyle or polish it until Carl decides.
- Enquiry secrets (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ENQUIRY_IP_SALT`, `ENQUIRY_PROJECT_ID`) are Worker secrets set with `npx wrangler secret put`. They are not configured yet, so `/api/enquiry` returns 503 and the form falls back to its mailto state. That is expected.
- Never put the service-role key in client code, `wrangler.toml` or the repo.

## Session naming

Name sessions `<Area> · <MODE> · <topic>`, where MODE is BUILD, PLAN, REVIEW or RESEARCH.
