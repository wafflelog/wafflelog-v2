-- An accepted invitation creates a trip_member row. Access is governed by that
-- membership so an owner can later disable access without mutating invitation
-- history.

drop policy if exists "Trip members can read checklist items" on public.checklist_item;

create policy "Trip members can read checklist items"
on public.checklist_item
for select
to authenticated
using (
  exists (
    select 1
    from public.trip t
    where t.id = checklist_item.trip_id
      and (
        t.user_id = auth.uid()
        or exists (
          select 1
          from public.trip_member tm
          where tm.trip_id = checklist_item.trip_id
            and tm.user_id = auth.uid()
            and tm.status = 'active'
        )
      )
  )
);

drop policy if exists "Trip members can read documents" on public.document;

create policy "Trip members can read documents"
on public.document
for select
to authenticated
using (
  exists (
    select 1
    from public.trip t
    where t.id = document.trip_id
      and (
        t.user_id = auth.uid()
        or exists (
          select 1
          from public.trip_member tm
          where tm.trip_id = document.trip_id
            and tm.user_id = auth.uid()
            and tm.status = 'active'
        )
      )
  )
);

drop policy if exists "Trip members can read expenses" on public.expense;

create policy "Trip members can read expenses"
on public.expense
for select
to authenticated
using (
  exists (
    select 1
    from public.trip t
    where t.id = expense.trip_id
      and (
        t.user_id = auth.uid()
        or exists (
          select 1
          from public.trip_member tm
          where tm.trip_id = expense.trip_id
            and tm.user_id = auth.uid()
            and tm.status = 'active'
        )
      )
  )
);

drop policy if exists "Trip members can read images" on public.image;

create policy "Trip members can read images"
on public.image
for select
to authenticated
using (
  exists (
    select 1
    from public.trip t
    where t.id = image.trip_id
      and (
        t.user_id = auth.uid()
        or exists (
          select 1
          from public.trip_member tm
          where tm.trip_id = image.trip_id
            and tm.user_id = auth.uid()
            and tm.status = 'active'
        )
      )
  )
);

drop policy if exists "Trip members can read notes" on public.note;

create policy "Trip members can read notes"
on public.note
for select
to authenticated
using (
  exists (
    select 1
    from public.trip t
    where t.id = note.trip_id
      and (
        t.user_id = auth.uid()
        or exists (
          select 1
          from public.trip_member tm
          where tm.trip_id = note.trip_id
            and tm.user_id = auth.uid()
            and tm.status = 'active'
        )
      )
  )
);

drop policy if exists "Trip members can read pins" on public.pin;

create policy "Trip members can read pins"
on public.pin
for select
to authenticated
using (
  exists (
    select 1
    from public.trip t
    where t.id = pin.trip_id
      and (
        t.user_id = auth.uid()
        or exists (
          select 1
          from public.trip_member tm
          where tm.trip_id = pin.trip_id
            and tm.user_id = auth.uid()
            and tm.status = 'active'
        )
      )
  )
);

drop policy if exists "Trip members can read reference links" on public.reference_link;

create policy "Trip members can read reference links"
on public.reference_link
for select
to authenticated
using (
  exists (
    select 1
    from public.trip t
    where t.id = reference_link.trip_id
      and (
        t.user_id = auth.uid()
        or exists (
          select 1
          from public.trip_member tm
          where tm.trip_id = reference_link.trip_id
            and tm.user_id = auth.uid()
            and tm.status = 'active'
        )
      )
  )
);
