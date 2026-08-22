-- Adds dual-mode support to time_sheets so admins can backfill historical
-- weeks / months without per-day start/end times.
--
-- Run this AFTER 20260608_time_tracking.sql.

alter table public.time_sheets
  add column if not exists entry_type text not null default 'shift'
    check (entry_type in ('shift', 'historical')),
  add column if not exists iso_year int,
  add column if not exists iso_week int,
  add column if not exists period_label text;

-- Historical entries don't need real times; relax the constraint and
-- skip the auto-paid calculation for them.
alter table public.time_sheets alter column start_time drop not null;
alter table public.time_sheets alter column end_time drop not null;

create or replace function public.calc_time_sheet_hours()
returns trigger language plpgsql as $$
declare
  total numeric(6,3);
  auto_paid numeric(6,3);
begin
  new.updated_at := now();

  -- Historical (week/month) backfill — trust the admin's paid_hours value.
  if new.entry_type = 'historical' then
    new.total_on_site_hours := coalesce(new.paid_hours, 0);
    return new;
  end if;

  if new.start_time is null or new.end_time is null then
    return new;
  end if;

  total := extract(epoch from (new.end_time - new.start_time)) / 3600.0;
  if total < 0 then total := total + 24; end if;

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
    if new.paid_hours is null or new.paid_hours = old.paid_hours then
      new.paid_hours := round(auto_paid::numeric, 2);
    end if;
  end if;

  return new;
end $$;
