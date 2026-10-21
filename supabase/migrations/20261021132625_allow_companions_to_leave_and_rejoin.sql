create or replace function private.enforce_trip_member_identity()
returns trigger
language plpgsql
set search_path to ''
as $$
begin
  if new.id is distinct from old.id
    or new.trip_id is distinct from old.trip_id
    or new.user_id is distinct from old.user_id
    or new.role is distinct from old.role
    or new.created_at is distinct from old.created_at then
    raise exception 'Trip member identity fields cannot be changed';
  end if;

  if old.status = 'disabled' and old.disabled_reason = 'user_left' then
    if new.status = 'active'
      and new.disabled_reason is null
      and new.created_from_invitation_id is distinct from old.created_from_invitation_id
      and new.created_from_invitation_id = (
        select trip_invitation.id
        from public.trip_invitation
        where trip_invitation.trip_id = old.trip_id
          and trip_invitation.invitee_user_id = old.user_id
          and trip_invitation.status = 'accepted'
        order by trip_invitation.responded_at desc nulls last,
          trip_invitation.created_at desc
        limit 1
      ) then
      return new;
    end if;

    if new.status is distinct from old.status
      or new.disabled_reason is distinct from old.disabled_reason
      or new.created_from_invitation_id is distinct from old.created_from_invitation_id then
      raise exception 'A companion who left must accept a new invitation to rejoin';
    end if;
  elsif new.created_from_invitation_id is distinct from old.created_from_invitation_id then
    raise exception 'Trip member invitation cannot be changed';
  end if;

  return new;
end;
$$;

revoke all on function private.enforce_trip_member_identity() from public;
revoke all on function private.enforce_trip_member_identity() from anon;
revoke all on function private.enforce_trip_member_identity() from authenticated;

drop trigger if exists enforce_trip_member_identity_before_update
on public.trip_member;

create trigger enforce_trip_member_identity_before_update
before update on public.trip_member
for each row
execute function private.enforce_trip_member_identity();

drop policy if exists "Trip participants can read active trip members"
on public.trip_member;

create policy "Trip participants can read active trip members"
on public.trip_member
for select
to authenticated
using (
  user_id = (select auth.uid())
  or (select private.current_user_owns_trip(trip_id))
  or (
    status = 'active'
    and trip_id in (select private.current_user_active_trip_ids())
  )
);

create policy "Companions can leave active trips"
on public.trip_member
for update
to authenticated
using (
  user_id = (select auth.uid())
  and role = 'companion'
  and status = 'active'
)
with check (
  user_id = (select auth.uid())
  and role = 'companion'
  and status = 'disabled'
  and disabled_reason = 'user_left'
);

drop index if exists public.trip_invitation_unique_active_trip_invitee;

create unique index trip_invitation_unique_pending_trip_invitee
on public.trip_invitation (trip_id, invitee_user_id)
where status = 'pending';

drop policy if exists "Owner can create trip invitations"
on public.trip_invitation;

create policy "Owner can create trip invitations"
on public.trip_invitation
for insert
to authenticated
with check (
  inviter_user_id = (select auth.uid())
  and status = 'pending'
  and (select private.current_user_owns_trip(trip_id))
  and not exists (
    select 1
    from public.trip_member
    where trip_member.trip_id = trip_invitation.trip_id
      and trip_member.user_id = trip_invitation.invitee_user_id
      and trip_member.status = 'active'
  )
);

create or replace function private.sync_trip_member_from_invitation()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if old.status = 'pending' and new.status = 'accepted' then
    insert into public.trip_member (
      trip_id,
      user_id,
      role,
      status,
      disabled_reason,
      created_from_invitation_id
    ) values (
      new.trip_id,
      new.invitee_user_id,
      'companion',
      'active',
      null,
      new.id
    )
    on conflict (trip_id, user_id) do update
    set
      status = 'active',
      disabled_reason = null,
      created_from_invitation_id = excluded.created_from_invitation_id,
      updated_at = now();
  end if;

  return new;
end;
$$;
