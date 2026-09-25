-- Körs INTE förrän det är bekräftat att personalportalen inte läser projekt utan inloggning.
--
-- Begränsar anonym läsning av public.projects till projekt med public_visible = true.
-- I dag gör "Allow public read access on projects" och "Public can read projects"
-- (SELECT, anon och authenticated, USING true) alla projekt läsbara utan inloggning.
--
-- Den publika sajten (ProjectsSection, HomepageHeroBackground, case.$slug) filtrerar redan
-- på public_visible = true och påverkas inte.
--
-- Policies för authenticated och admin rörs inte:
--   "public_view_projects" (SELECT, authenticated, true),
--   "master_admin_access" och "Admins manage project case content" ligger kvar.
-- Inloggad personal kan därför fortfarande läsa alla projekt.

-- 1. Ta bort de öppna läsrätterna.
drop policy if exists "Allow public read access on projects" on public.projects;
drop policy if exists "Public can read projects" on public.projects;

-- 2. Anonyma läser bara projekt som är godkända för alloevent.se.
drop policy if exists "Anon reads public projects" on public.projects;
create policy "Anon reads public projects"
  on public.projects
  for select
  to anon
  using (public_visible = true);

-- Kontrollfråga efteråt:
-- select policyname, cmd, roles, qual, with_check
--   from pg_policies
--  where schemaname = 'public' and tablename = 'projects'
--  order by policyname;
