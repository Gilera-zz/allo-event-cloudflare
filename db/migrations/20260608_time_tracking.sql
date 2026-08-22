-- Time Tracking & Client Billing schema
-- Run this once in the Supabase SQL editor.

-- 1. Clients table -----------------------------------------------------------
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  org_number text,
  billing_email text,
  created_at timestamptz not null default now()
);

grant select, insert, update, delete on public.clients to authenticated;
grant all on public.clients to service_role;

alter table public.clients enable row level security;

drop policy if exists "Admins manage clients" on public.clients;
create policy "Admins manage clients"
  on public.clients for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Authenticated can read clients" on public.clients;
create policy "Authenticated can read clients"
  on public.clients for select to authenticated
  using (true);

-- 2. Time sheet status enum --------------------------------------------------
do $$ begin
  create type public.time_sheet_status as enum (
    'Väntar på godkännande',
    'Verifierad med kund',
    'Fakturerad'
  );
exception when duplicate_object then null; end $$;

-- 3. Time sheets / shifts ----------------------------------------------------
create table if not exists public.time_sheets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  date date not null,
  start_time time not null,
  end_time time not null,
  role text not null,
  total_on_site_hours numeric(5,2) not null default 0,
  paid_hours numeric(5,2) not null default 0,
  status public.time_sheet_status not null default 'Väntar på godkännande',
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists time_sheets_user_idx on public.time_sheets(user_id);
create index if not exists time_sheets_client_idx on public.time_sheets(client_id);
create index if not exists time_sheets_date_idx on public.time_sheets(date);
create index if not exists time_sheets_status_idx on public.time_sheets(status);

grant select, insert, update, delete on public.time_sheets to authenticated;
grant all on public.time_sheets to service_role;

alter table public.time_sheets enable row level security;

drop policy if exists "Users see own time sheets" on public.time_sheets;
create policy "Users see own time sheets"
  on public.time_sheets for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

drop policy if exists "Users insert own time sheets" on public.time_sheets;
create policy "Users insert own time sheets"
  on public.time_sheets for insert to authenticated
  with check (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins manage time sheets" on public.time_sheets;
create policy "Admins manage time sheets"
  on public.time_sheets for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- 4. Automatic break + hours calculation -------------------------------------
-- Rule: if on-site >= 8h subtract 1h (15+30+15 breaks);
--       if 6-8h subtract 30 min lunch;
--       if < 6h no deduction.
-- Admin override: setting paid_hours to a value other than the previously
-- auto-calculated one keeps the manual value.
create or replace function public.calc_time_sheet_hours()
returns trigger language plpgsql as $$
declare
  total numeric(6,3);
  auto_paid numeric(6,3);
begin
  total := extract(epoch from (new.end_time - new.start_time)) / 3600.0;
  if total < 0 then total := total + 24; end if; -- overnight

  if total >= 8 then
    auto_paid := total - 1;
  elsif total >= 6 then
    auto_paid := total - 0.5;
  else
    auto_paid := total;
  end if;

  new.total_on_site_hours := round(total::numeric, 2);

  if tg_op = 'INSERT' then
    if new.paid_hours is null or new.paid_hours = 0 then
      new.paid_hours := round(auto_paid::numeric, 2);
    end if;
  else
    -- Update: only recompute when admin did not manually change paid_hours
    if new.paid_hours is null or new.paid_hours = old.paid_hours then
      new.paid_hours := round(auto_paid::numeric, 2);
    end if;
  end if;

  new.updated_at := now();
  return new;
end $$;

drop trigger if exists time_sheets_calc_hours on public.time_sheets;
create trigger time_sheets_calc_hours
  before insert or update on public.time_sheets
  for each row execute function public.calc_time_sheet_hours();
