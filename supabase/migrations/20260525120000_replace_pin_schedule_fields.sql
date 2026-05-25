truncate table public.pin cascade;

alter table public.pin
  drop column if exists date,
  drop column if exists time,
  drop column if exists start_time,
  drop column if exists end_time,
  drop column if exists all_day;

alter table public.pin
  alter column name drop not null,
  add column if not exists start_date date,
  add column if not exists end_date date,
  add column if not exists time time,
  add column if not exists metadata_json jsonb not null default '{"version":1}'::jsonb;

alter table public.pin
  alter column start_date set not null;
