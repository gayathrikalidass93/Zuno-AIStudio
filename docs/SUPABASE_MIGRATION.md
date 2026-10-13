# Supabase integration — staged migration

This branch introduces the Supabase client configuration without changing the existing marketplace data flow yet. The app currently uses browser localStorage; switching reads/writes before the database schema, authentication, and row-level security are ready could lose or expose booking data.

## Configure environment variables

Set these variables in Vercel for the **Preview** deployment of `production/supabase-integration`:

- `VITE_SUPABASE_URL`: the Project URL from Supabase.
- `VITE_SUPABASE_PUBLISHABLE_KEY`: the project's publishable key.

Then redeploy the Preview. These are browser-visible project settings, not secrets. Never set a database password, Supabase secret key, or `service_role` key under a `VITE_*` name or commit them to Git.

For local development, copy `.env.example` to `.env.local` and replace the two Supabase placeholders. Do not commit `.env.local`.

## Current status

- [x] Add the Supabase JavaScript SDK.
- [x] Add an optional browser client in `src/services/supabase.ts`.
- [x] Document the required environment variables.
- [ ] Design and apply the database schema for the existing Zuno types.
- [ ] Add Supabase Auth and role provisioning.
- [ ] Configure and verify row-level security policies.
- [ ] Migrate booking, helper, customer, quote, support, and audit data access.
- [ ] Test existing flows before any production deployment.

The Supabase client is deliberately optional while the migration is staged. The existing localStorage app remains the active data path until the remaining checklist is implemented and tested.
