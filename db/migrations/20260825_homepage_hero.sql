-- Allo Event homepage hero settings ------------------------------------------
-- Adds a safe, explicit homepage hero configuration. The homepage no longer
-- needs to derive its hero from the newest operational project.

-- Case-level opt-in used by the slideshow mode.
alter table public.projects
  add column if not exists case_show_in_hero boolean not null default false,
  add column if not exists case_hero_priority integer not null default 100;

create index if not exists projects_case_hero_idx
  on public.projects (case_published, case_show_in_hero, case_hero_priority);

-- Singleton settings table. More site settings can safely be added here later.
create table if not exists public.site_settings (
  id text primary key,
  hero_mode text not null default 'fixed' check (hero_mode in ('fixed', 'cases')),
  hero_image_url text,
  hero_mobile_image_url text,
  hero_image_position text not null default 'center center',
  hero_overlay smallint not null default 66 check (hero_overlay between 0 and 90),
  hero_slide_seconds smallint not null default 7 check (hero_slide_seconds between 3 and 30),
  hero_slow_zoom boolean not null default true,
  hero_show_case_meta boolean not null default true,
  updated_at timestamptz not null default now()
);

-- Upgrade an older site_settings table if one exists.
alter table public.site_settings
  add column if not exists hero_mode text not null default 'fixed',
  add column if not exists hero_image_url text,
  add column if not exists hero_mobile_image_url text,
  add column if not exists hero_image_position text not null default 'center center',
  add column if not exists hero_overlay smallint not null default 66,
  add column if not exists hero_slide_seconds smallint not null default 7,
  add column if not exists hero_slow_zoom boolean not null default true,
  add column if not exists hero_show_case_meta boolean not null default true,
  add column if not exists updated_at timestamptz not null default now();

insert into public.site_settings (id)
values ('homepage')
on conflict (id) do nothing;

alter table public.site_settings enable row level security;

drop policy if exists "Public reads site settings" on public.site_settings;
create policy "Public reads site settings"
  on public.site_settings for select
  to anon, authenticated
  using (id = 'homepage');

drop policy if exists "Admins manage site settings" on public.site_settings;
create policy "Admins manage site settings"
  on public.site_settings for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- Dedicated public media bucket for homepage assets.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'site-media',
  'site-media',
  true,
  52428800,
  array['image/jpeg','image/png','image/webp','image/avif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can read site media" on storage.objects;
create policy "Public can read site media"
  on storage.objects for select
  to public
  using (bucket_id = 'site-media');

drop policy if exists "Admins upload site media" on storage.objects;
create policy "Admins upload site media"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'site-media' and public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins update site media" on storage.objects;
create policy "Admins update site media"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'site-media' and public.has_role(auth.uid(), 'admin'))
  with check (bucket_id = 'site-media' and public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins delete site media" on storage.objects;
create policy "Admins delete site media"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'site-media' and public.has_role(auth.uid(), 'admin'));
