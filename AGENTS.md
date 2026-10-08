# AGENTS.md — ZUNO (Base44 dev environment)

## What this app is
ZUNO is a pure client-side Vite + React 19 + TypeScript + Tailwind CSS v4 MVP.
State is persisted in browser localStorage via a reactive store (`src/services/db.ts`).
There is **no backend server, no database, and no external API calls** at runtime —
the `@google/genai`, `express`, and `dotenv` entries in `package.json` are unused by the source.

## Running it
- `docker compose -f docker-compose.base44.yml up -d` starts the Vite dev server on port 3000.
- The compose service runs `npm install` then `npm run dev` (vite --port=3000 --host=0.0.0.0).
- Source is bind-mounted; edits hot-reload without a rebuild.
- No secrets or credentials are required to boot.

## Verification
- `curl -s http://localhost:3000/` returns the index HTML with Vite dev client injected.
- `curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/src/main.tsx` → 200.
- Container healthcheck uses Node's built-in `fetch` against localhost:3000.

## Notes
- `vite.config.ts` gates HMR on `DISABLE_HMR`; it is left unset in compose so live reload works.
- `__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS` is passed bare from the platform env for Vite host allowlisting.
- `schema.sql` and `requirements.txt` are reference artifacts for a future Python/PostgreSQL backend; not used by the current app.
