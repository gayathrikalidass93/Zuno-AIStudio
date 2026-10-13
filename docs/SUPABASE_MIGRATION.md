# Supabase integration — staged migration

This branch stages Supabase integration. Customer email/password authentication now uses Supabase Auth and creates/loads the signed-in customer's profile in `public.customers`. The wider marketplace data flow (bookings, helpers, quotes, support, and audit data) still uses browser localStorage; do not treat those records as cloud-synchronised yet.

## Configure environment variables

Set these variables in Vercel for the **Preview** deployment of `production/supabase-integration`:

- `SUPABASE_URL`: the Project URL from Supabase.
- `PUBLISHABLE_KEY`: the project's publishable key.

The Vite configuration passes only these two explicitly named values into browser code. Other environment variables—including Supabase secret keys—are not exposed by this configuration. Never commit a database password, Supabase secret key, or `service_role` key to Git.

For local development, copy `.env.example` to `.env.local` and replace the two Supabase placeholders. Do not commit `.env.local`.

## Current status

- [x] Add the Supabase JavaScript SDK.
- [x] Add an optional browser client in `src/services/supabase.ts`.
- [x] Document the required environment variables.
- [ ] Design and apply the database schema for the existing Zuno types.
- [x] Add customer email/password authentication using Supabase Auth.
- [x] Load/create the signed-in customer's profile in `public.customers` using the authenticated UUID.
- [ ] Replace demo helper/admin sign-in with secure role provisioning.
- [ ] Configure and verify row-level security policies.
- [ ] Migrate booking, helper, customer, quote, support, and audit data access.
- [ ] Test existing flows before any production deployment.

The Supabase client is deliberately optional while the migration is staged. Customer authentication requires valid `SUPABASE_URL` and `PUBLISHABLE_KEY` values. If email confirmation is enabled, new customers must confirm the email first, then sign in so their profile can be created. Existing marketplace bookings and operational data remain localStorage-only until the remaining checklist is implemented and tested.
