alter table public.app_notification
drop constraint app_notification_type_check;

alter table public.app_notification
add constraint app_notification_type_check check (
  type = any (
    array[
      'trip_invited'::text,
      'trip_invite_accepted'::text,
      'trip_invite_rejected'::text,
      'expense_added'::text,
      'note_added'::text,
      'trip_updated'::text
    ]
  )
);

create or replace function private.create_trip_activity_notifications(
  target_trip_id uuid,
  target_actor_user_id uuid,
  target_type text,
  target_title text,
  target_body text
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.app_notification (
    user_id,
    actor_user_id,
    trip_id,
    trip_invitation_id,
    type,
    title,
    body
  )
  select
    recipient.user_id,
    target_actor_user_id,
    target_trip_id,
    null,
    target_type,
    target_title,
    target_body
  from (
    select t.user_id
    from public.trip t
    where t.id = target_trip_id
      and t.deleted_at is null

    union

    select tm.user_id
    from public.trip_member tm
    join public.trip t on t.id = tm.trip_id
    where tm.trip_id = target_trip_id
      and tm.status = 'active'
      and t.deleted_at is null
  ) as recipient
  where recipient.user_id <> target_actor_user_id;
$$;

revoke all on function private.create_trip_activity_notifications(
  uuid,
  uuid,
  text,
  text,
  text
) from public;

create or replace function private.create_expense_added_notification()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_username text;
  trip_title text;
begin
  if new.deleted_at is not null then
    return new;
  end if;

  select u.username
  into actor_username
  from public."user" u
  where u.id = new.user_id;

  select t.title
  into trip_title
  from public.trip t
  where t.id = new.trip_id;

  perform private.create_trip_activity_notifications(
    new.trip_id,
    new.user_id,
    'expense_added',
    'Expense added',
    coalesce(actor_username, 'Someone') || ' added an expense to ' ||
      coalesce(trip_title, 'a trip') || '.'
  );

  return new;
end;
$$;

revoke all on function private.create_expense_added_notification() from public;

create or replace function private.create_note_added_notification()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_username text;
  trip_title text;
begin
  if new.deleted_at is not null then
    return new;
  end if;

  select u.username
  into actor_username
  from public."user" u
  where u.id = new.user_id;

  select t.title
  into trip_title
  from public.trip t
  where t.id = new.trip_id;

  perform private.create_trip_activity_notifications(
    new.trip_id,
    new.user_id,
    'note_added',
    'New trip note',
    coalesce(actor_username, 'Someone') || ' added a note to ' ||
      coalesce(trip_title, 'a trip') || '.'
  );

  return new;
end;
$$;

revoke all on function private.create_note_added_notification() from public;

create or replace function private.create_trip_updated_notification()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_username text;
  notification_body text;
begin
  select u.username
  into actor_username
  from public."user" u
  where u.id = new.user_id;

  if old.title is distinct from new.title
    and (
      old.start_date is distinct from new.start_date
      or old.end_date is distinct from new.end_date
    ) then
    notification_body := coalesce(actor_username, 'Someone') ||
      ' updated the name and dates for ' || new.title || '.';
  elsif old.title is distinct from new.title then
    notification_body := coalesce(actor_username, 'Someone') ||
      ' renamed ' || old.title || ' to ' || new.title || '.';
  else
    notification_body := coalesce(actor_username, 'Someone') ||
      ' changed the dates for ' || new.title || '.';
  end if;

  perform private.create_trip_activity_notifications(
    new.id,
    new.user_id,
    'trip_updated',
    'Trip updated',
    notification_body
  );

  return new;
end;
$$;

revoke all on function private.create_trip_updated_notification() from public;

create trigger create_expense_added_notification_after_insert
after insert on public.expense
for each row
execute function private.create_expense_added_notification();

create trigger create_note_added_notification_after_insert
after insert on public.note
for each row
execute function private.create_note_added_notification();

create trigger create_trip_updated_notification_after_update
after update of title, start_date, end_date on public.trip
for each row
when (
  old.title is distinct from new.title
  or old.start_date is distinct from new.start_date
  or old.end_date is distinct from new.end_date
)
execute function private.create_trip_updated_notification();
