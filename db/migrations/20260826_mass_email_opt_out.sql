-- Massutskick / Resend recipient safety.
-- Upgrade-safe: may be run on an existing database.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS mass_email_opt_out boolean NOT NULL DEFAULT false;
