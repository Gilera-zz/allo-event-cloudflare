-- Allo Event Case CMS ---------------------------------------------------------
-- Adds public case-study fields to the existing `projects` table without
-- replacing the operational project model. Existing staffing/project flows
-- continue to use the original columns.

alter table public.projects
  -- Core presentation fields used by the existing public project component.
  -- These are no-ops when the columns already exist.
  add column if not exists category text,
  add column if not exists location text,
  add column if not exists starts_at timestamptz,
  add column if not exists ends_at timestamptz,
  add column if not exists positions_needed integer,
  add column if not exists image_url text,
  add column if not exists description text,
  add column if not exists status text,
  -- Case CMS fields.
  add column if not exists slug text,
  add column if not exists case_published boolean not null default false,
  add column if not exists case_featured boolean not null default false,
  add column if not exists case_sort_order integer not null default 100,
  add column if not exists case_client_name text,
  add column if not exists case_venue text,
  add column if not exists case_year integer,
  add column if not exists case_subtitle text,
  add column if not exists case_excerpt text,
  add column if not exists case_hero_image_url text,
  add column if not exists case_hero_video_url text,
  add column if not exists case_intro_title text,
  add column if not exists case_intro_body text,
  add column if not exists case_challenge_title text,
  add column if not exists case_challenge_body text,
  add column if not exists case_solution_title text,
  add column if not exists case_solution_body text,
  add column if not exists case_result_title text,
  add column if not exists case_result_body text,
  add column if not exists case_services jsonb not null default '[]'::jsonb,
  add column if not exists case_facts jsonb not null default '[]'::jsonb,
  add column if not exists case_timeline jsonb not null default '[]'::jsonb,
  add column if not exists case_gallery jsonb not null default '[]'::jsonb,
  add column if not exists case_credits jsonb not null default '[]'::jsonb,
  add column if not exists case_quote text,
  add column if not exists case_quote_author text,
  add column if not exists case_quote_role text,
  add column if not exists case_cta_title text,
  add column if not exists case_cta_body text,
  add column if not exists seo_title text,
  add column if not exists seo_description text,
  add column if not exists og_image_url text,
  add column if not exists case_published_at timestamptz;

create unique index if not exists projects_case_slug_unique
  on public.projects (slug)
  where slug is not null;

create index if not exists projects_case_public_idx
  on public.projects (case_published, case_featured, case_sort_order);

-- Project access --------------------------------------------------------------
-- The landing page already reads `projects` publicly and the admin already
-- authenticates against the same table. This migration deliberately does NOT
-- enable/disable RLS or replace the existing public-read policy, because doing
-- so could change the current project/staffing flow.
--
-- If RLS is already enabled, this extra permissive admin policy ensures admins
-- can edit the new case fields without weakening public access rules.
drop policy if exists "Admins manage project case content" on public.projects;
create policy "Admins manage project case content"
  on public.projects for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- Public media bucket used by case hero images, galleries and optional videos.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'case-media',
  'case-media',
  true,
  52428800,
  array['image/jpeg','image/png','image/webp','image/avif','video/mp4','video/webm']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can read case media" on storage.objects;
create policy "Public can read case media"
  on storage.objects for select
  to public
  using (bucket_id = 'case-media');

drop policy if exists "Admins upload case media" on storage.objects;
create policy "Admins upload case media"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'case-media' and public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins update case media" on storage.objects;
create policy "Admins update case media"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'case-media' and public.has_role(auth.uid(), 'admin'))
  with check (bucket_id = 'case-media' and public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins delete case media" on storage.objects;
create policy "Admins delete case media"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'case-media' and public.has_role(auth.uid(), 'admin'));
