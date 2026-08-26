-- Allo Event public project visibility safety
-- Explicit opt-in: operational projects stay private unless an admin allows them on alloevent.se.

alter table public.projects
  add column if not exists public_visible boolean not null default false;

create index if not exists projects_public_visible_idx
  on public.projects (public_visible, starts_at);

-- Deliberately no backfill. Existing projects remain private until explicitly approved.
