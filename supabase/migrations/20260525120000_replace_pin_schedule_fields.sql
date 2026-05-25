truncate table public.pin cascade;

alter table public.pin
  drop column if exists date,
  drop column if exists time,
  add column if not exists start_date date,
  add column if not exists start_time time,
  add column if not exists end_date date,
  add column if not exists end_time time,
  add column if not exists all_day boolean not null default false,
  add column if not exists metadata_json jsonb not null default '{"version":1}'::jsonb;

alter table public.pin
  alter column start_date set not null,
  alter column end_date set not null;
