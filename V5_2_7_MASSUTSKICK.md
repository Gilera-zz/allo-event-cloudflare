# V5.2.7 — Massutskick restored

The previous `Massutskick` placeholder has been replaced by the working email broadcast flow from the original personnel portal, adapted for the current Operations design and Cloudflare Worker runtime.

## Restored

- Audience: all staff
- Audience: administrators only (safe test mode)
- Audience: staff filtered by city
- Subject + message editor
- Live recipient count
- Confirmation before sending
- Result summary with sent / failed counts
- Respects `profiles.mass_email_opt_out`
- Deduplicates and validates email addresses

## Cloudflare migration

The old portal called `/.netlify/functions/send-mass-email`. V5.2.7 no longer depends on Netlify. Sending now uses a TanStack Start server function executed by the existing Cloudflare Worker.

The Resend key remains server-only and is read per request from the Worker secret `RESEND_API_KEY`.

See `MASSUTSKICK_CLOUDFLARE.md` for the one-time setup.
