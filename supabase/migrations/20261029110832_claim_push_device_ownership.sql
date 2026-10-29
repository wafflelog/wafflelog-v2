create or replace function public.claim_push_device(
  p_expo_push_token text,
  p_platform text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  authenticated_user_id uuid := auth.uid();
  claimed_device_id uuid;
begin
  if authenticated_user_id is null then
    raise exception 'You must be signed in to register a push device'
      using errcode = '42501';
  end if;

  if nullif(trim(p_expo_push_token), '') is null then
    raise exception 'Expo push token is required'
      using errcode = '22023';
  end if;

  if p_platform not in ('ios', 'android') then
    raise exception 'Push device platform must be ios or android'
      using errcode = '22023';
  end if;

  insert into public.user_push_device (
    user_id,
    expo_push_token,
    platform
  )
  values (
    authenticated_user_id,
    trim(p_expo_push_token),
    p_platform
  )
  on conflict (expo_push_token) do update
  set
    user_id = excluded.user_id,
    platform = excluded.platform,
    last_seen_at = now()
  returning id into claimed_device_id;

  return claimed_device_id;
end;
$function$;

revoke all
  on function public.claim_push_device(text, text)
  from public, anon;

grant execute
  on function public.claim_push_device(text, text)
  to authenticated;
