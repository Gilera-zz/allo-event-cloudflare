-- Staff availability per date (used by Schema & Planering smart match).
-- Upgrade-safe: works both when the availability table is new and when an
-- older version of the table already exists.

create table if not exists public.availability (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  status text not null default 'available',
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Existing Allo databases may already have an older availability table.
-- CREATE TABLE IF NOT EXISTS does not add new columns, so ensure every field
-- required by the current UI exists explicitly.
alter table public.availability
  add column if not exists status text,
  add column if not exists note text,
  add column if not exists created_at timestamptz,
  add column if not exists updated_at timestamptz;

update public.availability
set status = 'available'
where status is null;

update public.availability
set created_at = now()
where created_at is null;

update public.availability
set updated_at = now()
where updated_at is null;

alter table public.availability
  alter column status set default 'available',
  alter column status set not null,
  alter column created_at set default now(),
  alter column created_at set not null,
  alter column updated_at set default now(),
  alter column updated_at set not null;

-- Add/restore the status validation without failing when the constraint
-- already exists.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'availability_status_check'
      and conrelid = 'public.availability'::regclass
  ) then
    alter table public.availability
      add constraint availability_status_check
      check (status in ('available', 'unavailable'));
  end if;
end $$;

-- Ensure one availability state per user and date. If an older table already
-- contains duplicate rows, leave them untouched instead of failing the whole
-- migration; the admin can clean them before adding the uniqueness constraint.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'availability_user_id_date_key'
      and conrelid = 'public.availability'::regclass
  ) and not exists (
    select 1
    from public.availability
    group by user_id, date
    having count(*) > 1
  ) then
    alter table public.availability
      add constraint availability_user_id_date_key unique (user_id, date);
  end if;
end $$;

create index if not exists availability_date_idx on public.availability(date);
create index if not exists availability_user_idx on public.availability(user_id);

grant select, insert, update, delete on public.availability to authenticated;
grant all on public.availability to service_role;

alter table public.availability enable row level security;

drop policy if exists "Users manage own availability" on public.availability;
create policy "Users manage own availability"
  on public.availability for all to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'))
  with check (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));
