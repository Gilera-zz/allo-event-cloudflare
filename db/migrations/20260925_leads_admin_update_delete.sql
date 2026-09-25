-- Körs manuellt i Supabase SQL Editor.
--
-- Ger admins rätt att ändra och ta bort kundförfrågningar i public.leads.
-- Används av /admin/leads (statusändring och "Ta bort").
-- Förutsätter 20260925_leads_close_public_read.sql ("Admins read leads"), eftersom
-- update/delete med .select("id") också kräver läsrätt.
-- "Allow anon insert" och "Admins read leads" rörs inte.

-- 1. Admins får uppdatera leads.
drop policy if exists "Admins update leads" on public.leads;
create policy "Admins update leads"
  on public.leads
  for update
  to authenticated
  using (public.has_role(auth.uid(), 'admin'::app_role))
  with check (public.has_role(auth.uid(), 'admin'::app_role));

-- 2. Admins får ta bort leads.
drop policy if exists "Admins delete leads" on public.leads;
create policy "Admins delete leads"
  on public.leads
  for delete
  to authenticated
  using (public.has_role(auth.uid(), 'admin'::app_role));

-- Kontrollfråga efteråt:
-- select policyname, cmd, roles, qual, with_check
--   from pg_policies
--  where schemaname = 'public' and tablename = 'leads'
--  order by policyname;
