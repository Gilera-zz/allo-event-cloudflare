# Massutskick on Cloudflare

`/admin/massutskick` has been restored from the previous personal portal and ported away from Netlify Functions.
It now runs through a TanStack Start server function inside the Cloudflare Worker.

## Database

Run once if the `profiles.mass_email_opt_out` column is not already present:

`db/migrations/20260826_mass_email_opt_out.sql`

The migration is idempotent (`ADD COLUMN IF NOT EXISTS`).

## Cloudflare Worker secret

The Worker needs:

- `RESEND_API_KEY` — required, add it as an encrypted Worker secret.
- `RESEND_FROM_EMAIL` — optional. Defaults to `Allo Event <info@alloevent.se>`.
- `RESEND_REPLY_TO` — optional. Defaults to `info@alloevent.se`.

The Supabase URL and publishable key use the same existing configuration as the web app. No service-role key is required by this implementation.

## Safety

- Only a signed-in Supabase user with `user_roles.role = admin` can send.
- The server re-checks the admin role; the browser state is not trusted.
- Profiles with `mass_email_opt_out = true` are excluded.
- Invalid or duplicate email addresses are excluded.
- Resend is called server-side only; the API key is never sent to the browser.
- The UI asks for confirmation before sending.
- "Administratörer" is available as a test audience before sending to all staff.
