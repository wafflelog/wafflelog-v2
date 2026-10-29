create or replace function public.is_username_available(p_username text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when normalized_username is null
      or char_length(normalized_username) not between 3 and 30
      or normalized_username !~ '^[a-z0-9_]+$'
    then false
    else not exists (
      select 1
      from public."user"
      where username = normalized_username
    )
  end
  from (
    select lower(trim(p_username)) as normalized_username
  ) normalized;
$$;

revoke all on function public.is_username_available(text) from public;
grant execute on function public.is_username_available(text) to anon;
grant execute on function public.is_username_available(text) to authenticated;

comment on function public.is_username_available(text) is
  'Returns whether a normalized public username is available during registration.';
