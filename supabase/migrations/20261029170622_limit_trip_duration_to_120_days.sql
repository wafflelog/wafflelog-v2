alter table public.trip
add constraint trip_duration_max_120_days
check (end_date <= start_date + 119)
not valid;

alter table public.trip
validate constraint trip_duration_max_120_days;
