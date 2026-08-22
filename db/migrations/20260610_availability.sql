-- Staff availability per date (used by Schema & Planering smart match).
create table if not exists public.availability (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  status text not null default 'available' check (status in ('available','unavailable')),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, date)
);

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
