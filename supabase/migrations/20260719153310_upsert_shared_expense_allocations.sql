create function public.upsert_expense_with_participants(
  p_id uuid,
  p_trip_id uuid,
  p_description text,
  p_amount numeric(14, 2),
  p_currency text,
  p_paid_by_user_id uuid,
  p_paid_by_name text,
  p_participants jsonb,
  p_pin_id uuid default null
)
returns setof public.expense
language plpgsql
security invoker
set search_path = ''
as $$
declare
  participant_count integer;
  distinct_participant_count integer;
  participant_total numeric(14, 2);
  saved_expense public.expense;
begin
  if (select auth.uid()) is null then
    raise exception 'You must be signed in to sync an expense';
  end if;

  if p_amount <= 0 then
    raise exception 'Expense amount must be greater than zero';
  end if;

  if jsonb_typeof(p_participants) <> 'array' then
    raise exception 'Expense participants must be an array';
  end if;

  select
    count(*),
    count(distinct participant.user_id),
    coalesce(sum(participant.split_amount), 0)
  into participant_count, distinct_participant_count, participant_total
  from jsonb_to_recordset(p_participants) as participant(
    user_id uuid,
    split_amount numeric(14, 2)
  );

  if participant_count = 0 then
    raise exception 'An expense must have at least one participant';
  end if;

  if participant_count <> distinct_participant_count then
    raise exception 'Expense participants must be unique';
  end if;

  if participant_total <> p_amount then
    raise exception 'Participant split amounts must equal the expense amount';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(p_participants) as participant(
      user_id uuid,
      split_amount numeric(14, 2)
    )
    where participant.user_id is null
      or participant.split_amount is null
      or participant.split_amount < 0
  ) then
    raise exception 'Expense participants must have a user and non-negative split amount';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(p_participants) as participant(
      user_id uuid,
      split_amount numeric(14, 2)
    )
    where not exists (
      select 1
      from public.trip t
      where t.id = p_trip_id
        and (
          t.user_id = participant.user_id
          or exists (
            select 1
            from public.trip_member tm
            where tm.trip_id = t.id
              and tm.user_id = participant.user_id
              and tm.status = 'active'
          )
        )
    )
  ) then
    raise exception 'Expense participants must be active trip members';
  end if;

  insert into public.expense (
    id,
    pin_id,
    trip_id,
    user_id,
    description,
    amount,
    currency,
    paid_by_user_id,
    paid_by_name
  ) values (
    p_id,
    p_pin_id,
    p_trip_id,
    (select auth.uid()),
    btrim(p_description),
    p_amount,
    btrim(p_currency),
    p_paid_by_user_id,
    btrim(p_paid_by_name)
  )
  on conflict (id) do update set
    pin_id = excluded.pin_id,
    trip_id = excluded.trip_id,
    description = excluded.description,
    amount = excluded.amount,
    currency = excluded.currency,
    paid_by_user_id = excluded.paid_by_user_id,
    paid_by_name = excluded.paid_by_name,
    updated_at = now(),
    deleted_at = null
  returning * into saved_expense;

  if not found then
    raise exception 'Expense could not be created or updated';
  end if;

  delete from public.expense_participant
  where expense_id = saved_expense.id;

  insert into public.expense_participant (expense_id, user_id, split_amount)
  select saved_expense.id, participant.user_id, participant.split_amount
  from jsonb_to_recordset(p_participants) as participant(
    user_id uuid,
    split_amount numeric(14, 2)
  );

  return next saved_expense;
end;
$$;

revoke execute on function public.upsert_expense_with_participants(
  uuid, uuid, text, numeric, text, uuid, text, jsonb, uuid
) from public;

grant execute on function public.upsert_expense_with_participants(
  uuid, uuid, text, numeric, text, uuid, text, jsonb, uuid
) to authenticated;
