-- Allow the public landing-page form to submit leads.
-- The `leads` table already exists; this migration only ensures
-- the schema is correct and adds a public INSERT RLS policy.

-- Make sure all booking-form columns exist (no-ops if already present).
alter table public.leads
  add column if not exists first_name        text,
  add column if not exists last_name         text,
  add column if not exists org_number        text,
  add column if not exists city              text,
  add column if not exists start_date        date,
  add column if not exists end_date          date,
  add column if not exists staff_count       integer,
  add column if not exists consent_marketing boolean default false,
  add column if not exists category          text,
  add column if not exists description       text;

-- Grants: anon may INSERT only; reading/updating stays admin-only.
grant insert on public.leads to anon;
grant select, insert, update, delete on public.leads to authenticated;
grant all    on public.leads to service_role;

-- Enable RLS (idempotent).
alter table public.leads enable row level security;

-- Public insert policy for the landing-page form.
drop policy if exists "Public can submit booking requests" on public.leads;
create policy "Public can submit booking requests"
  on public.leads
  for insert
  to anon, authenticated
  with check (true);
