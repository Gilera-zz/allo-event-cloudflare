-- Körs manuellt i Supabase SQL Editor EFTER att formuläret utan .select() är live och testat.
--
-- Stänger den publika läsrätten på public.leads (kundförfrågningar).
-- I dag kan vem som helst med den publika nyckeln läsa alla leads via
-- policyn "Allow anon select" (SELECT, public, USING true).
--
-- Efter den här migrationen:
--   * Bara admins (public.has_role(auth.uid(), 'admin')) kan läsa leads.
--     Används av /admin/leads och översikten /admin.
--   * "Allow anon insert" ligger kvar, så formuläret på alloevent.se kan fortfarande spara.
--   * Ingen UPDATE- eller DELETE-policy läggs till här (se rapporten, "Öppet").

-- 1. Läsrätt för admins.
drop policy if exists "Admins read leads" on public.leads;
create policy "Admins read leads"
  on public.leads
  for select
  to authenticated
  using (public.has_role(auth.uid(), 'admin'::app_role));

-- 2. Ta bort den öppna läsrätten.
drop policy if exists "Allow anon select" on public.leads;

-- "Allow anon insert" behålls orörd.

-- Kontrollfråga efteråt:
-- select policyname, cmd, roles, qual, with_check
--   from pg_policies
--  where schemaname = 'public' and tablename = 'leads'
--  order by policyname;
