-- The app is not live yet, so existing expenses have no trustworthy split
-- history and are deliberately removed instead of being backfilled.
delete from public.expense;

alter table public.expense
alter column amount type numeric(14, 2)
using amount::numeric(14, 2);

create table public.expense_participant (
  expense_id uuid not null references public.expense (id) on delete cascade,
  user_id uuid not null references public."user" (id),
  split_amount numeric(14, 2) not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  primary key (expense_id, user_id),
  check (split_amount >= 0)
);

create index expense_participant_user_id_idx
on public.expense_participant (user_id);

alter table public.expense_participant enable row level security;

grant select, insert, delete on table public.expense_participant to authenticated;

create policy "Active trip members can read expense participants"
on public.expense_participant
for select
to authenticated
using (
  exists (
    select 1
    from public.expense e
    join public.trip t on t.id = e.trip_id
    where e.id = expense_participant.expense_id
      and (
        t.user_id = auth.uid()
        or exists (
          select 1
          from public.trip_member tm
          where tm.trip_id = t.id
            and tm.user_id = auth.uid()
            and tm.status = 'active'
        )
      )
  )
);

create policy "Expense creators can add active trip participants"
on public.expense_participant
for insert
to authenticated
with check (
  exists (
    select 1
    from public.expense e
    join public.trip t on t.id = e.trip_id
    where e.id = expense_participant.expense_id
      and e.user_id = auth.uid()
      and (
        t.user_id = expense_participant.user_id
        or exists (
          select 1
          from public.trip_member tm
          where tm.trip_id = t.id
            and tm.user_id = expense_participant.user_id
            and tm.status = 'active'
        )
      )
  )
);

create policy "Expense creators can remove expense participants"
on public.expense_participant
for delete
to authenticated
using (
  exists (
    select 1
    from public.expense e
    where e.id = expense_participant.expense_id
      and e.user_id = auth.uid()
  )
);
