-- Scheduled shifts (forward planning) — separate from time_sheets (historical/billing).
create table if not exists public.scheduled_shifts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  location text,
  date date not null,
  start_time time not null,
  end_time time not null,
  role text not null,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists scheduled_shifts_user_idx on public.scheduled_shifts(user_id);
create index if not exists scheduled_shifts_date_idx on public.scheduled_shifts(date);
create index if not exists scheduled_shifts_client_idx on public.scheduled_shifts(client_id);

grant select, insert, update, delete on public.scheduled_shifts to authenticated;
grant all on public.scheduled_shifts to service_role;

alter table public.scheduled_shifts enable row level security;

drop policy if exists "Users see own scheduled shifts" on public.scheduled_shifts;
create policy "Users see own scheduled shifts"
  on public.scheduled_shifts for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins manage scheduled shifts" on public.scheduled_shifts;
create policy "Admins manage scheduled shifts"
  on public.scheduled_shifts for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create or replace function public.scheduled_shifts_touch()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;

drop trigger if exists scheduled_shifts_touch on public.scheduled_shifts;
create trigger scheduled_shifts_touch
  before update on public.scheduled_shifts
  for each row execute function public.scheduled_shifts_touch();
