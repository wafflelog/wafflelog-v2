drop extension if exists "pg_net";

create schema if not exists "private";


  create table "public"."app_notification" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "actor_user_id" uuid,
    "trip_id" uuid,
    "trip_invitation_id" uuid,
    "type" text not null,
    "title" text not null,
    "body" text not null,
    "read_at" timestamp with time zone,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."app_notification" enable row level security;


  create table "public"."checklist_item" (
    "id" uuid not null,
    "trip_id" uuid not null,
    "user_id" uuid not null,
    "title" text not null,
    "completed" boolean not null default false,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "deleted_at" timestamp with time zone
      );


alter table "public"."checklist_item" enable row level security;


  create table "public"."document" (
    "id" uuid not null,
    "trip_id" uuid not null,
    "pin_id" uuid,
    "user_id" uuid not null,
    "file_name" text not null,
    "mime_type" text not null,
    "storage_bucket" text not null,
    "storage_path" text not null,
    "caption" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "deleted_at" timestamp with time zone
      );


alter table "public"."document" enable row level security;


  create table "public"."expense" (
    "id" uuid not null,
    "pin_id" uuid,
    "trip_id" uuid not null,
    "user_id" uuid not null,
    "description" text not null,
    "amount" double precision not null,
    "currency" text not null,
    "paid_by_user_id" uuid not null,
    "paid_by_name" text not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "deleted_at" timestamp with time zone
      );


alter table "public"."expense" enable row level security;


  create table "public"."image" (
    "id" uuid not null,
    "pin_id" uuid,
    "trip_id" uuid not null,
    "user_id" uuid not null,
    "storage_bucket" text not null,
    "storage_path" text not null,
    "mime_type" text not null,
    "width" integer not null,
    "height" integer not null,
    "caption" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "deleted_at" timestamp with time zone
      );


alter table "public"."image" enable row level security;


  create table "public"."note" (
    "id" uuid not null,
    "pin_id" uuid,
    "user_id" uuid not null,
    "text" text not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "deleted_at" timestamp with time zone,
    "trip_id" uuid not null
      );


alter table "public"."note" enable row level security;


  create table "public"."pin" (
    "id" uuid not null default gen_random_uuid(),
    "trip_id" uuid not null,
    "user_id" uuid not null,
    "name" text,
    "start_date" date not null,
    "time" text,
    "category_id" text not null,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "deleted_at" timestamp with time zone,
    "end_date" date,
    "metadata_json" jsonb not null default '{"version": 1}'::jsonb,
    "end_time" text
      );


alter table "public"."pin" enable row level security;


  create table "public"."reference_link" (
    "id" uuid not null,
    "pin_id" uuid,
    "user_id" uuid not null,
    "title" text,
    "url" text not null,
    "caption" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "deleted_at" timestamp with time zone,
    "trip_id" uuid not null
      );


alter table "public"."reference_link" enable row level security;


  create table "public"."trip" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null default auth.uid(),
    "title" text not null,
    "start_date" date not null,
    "end_date" date not null,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "deleted_at" timestamp with time zone
      );


alter table "public"."trip" enable row level security;


  create table "public"."trip_invitation" (
    "id" uuid not null default gen_random_uuid(),
    "trip_id" uuid not null,
    "inviter_user_id" uuid not null,
    "invitee_user_id" uuid not null,
    "status" text not null default 'pending'::text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "responded_at" timestamp with time zone
      );


alter table "public"."trip_invitation" enable row level security;


  create table "public"."trip_member" (
    "id" uuid not null default gen_random_uuid(),
    "trip_id" uuid not null,
    "user_id" uuid not null,
    "role" text not null default 'companion'::text,
    "status" text not null default 'active'::text,
    "disabled_reason" text,
    "created_from_invitation_id" uuid,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."trip_member" enable row level security;


  create table "public"."user" (
    "id" uuid not null,
    "username" text not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."user" enable row level security;

CREATE UNIQUE INDEX app_notification_pkey ON public.app_notification USING btree (id);

CREATE UNIQUE INDEX checklist_item_pkey ON public.checklist_item USING btree (id);

CREATE UNIQUE INDEX document_pkey ON public.document USING btree (id);

CREATE UNIQUE INDEX expense_pkey ON public.expense USING btree (id);

CREATE UNIQUE INDEX image_pkey ON public.image USING btree (id);

CREATE UNIQUE INDEX note_pkey ON public.note USING btree (id);

CREATE UNIQUE INDEX pin_pkey ON public.pin USING btree (id);

CREATE UNIQUE INDEX reference_link_pkey ON public.reference_link USING btree (id);

CREATE UNIQUE INDEX trip_invitation_pkey ON public.trip_invitation USING btree (id);

CREATE UNIQUE INDEX trip_invitation_unique_active_trip_invitee ON public.trip_invitation USING btree (trip_id, invitee_user_id) WHERE (status = ANY (ARRAY['pending'::text, 'accepted'::text]));

CREATE INDEX trip_member_active_trip_user_idx ON public.trip_member USING btree (trip_id, user_id) WHERE (status = 'active'::text);

CREATE INDEX trip_member_created_from_invitation_id_idx ON public.trip_member USING btree (created_from_invitation_id);

CREATE UNIQUE INDEX trip_member_pkey ON public.trip_member USING btree (id);

CREATE INDEX trip_member_trip_id_idx ON public.trip_member USING btree (trip_id);

CREATE UNIQUE INDEX trip_member_unique_trip_user ON public.trip_member USING btree (trip_id, user_id);

CREATE INDEX trip_member_user_id_idx ON public.trip_member USING btree (user_id);

CREATE UNIQUE INDEX trip_pkey ON public.trip USING btree (id);

CREATE UNIQUE INDEX user_pkey ON public."user" USING btree (id);

CREATE UNIQUE INDEX user_username_key ON public."user" USING btree (username);

alter table "public"."app_notification" add constraint "app_notification_pkey" PRIMARY KEY using index "app_notification_pkey";

alter table "public"."checklist_item" add constraint "checklist_item_pkey" PRIMARY KEY using index "checklist_item_pkey";

alter table "public"."document" add constraint "document_pkey" PRIMARY KEY using index "document_pkey";

alter table "public"."expense" add constraint "expense_pkey" PRIMARY KEY using index "expense_pkey";

alter table "public"."image" add constraint "image_pkey" PRIMARY KEY using index "image_pkey";

alter table "public"."note" add constraint "note_pkey" PRIMARY KEY using index "note_pkey";

alter table "public"."pin" add constraint "pin_pkey" PRIMARY KEY using index "pin_pkey";

alter table "public"."reference_link" add constraint "reference_link_pkey" PRIMARY KEY using index "reference_link_pkey";

alter table "public"."trip" add constraint "trip_pkey" PRIMARY KEY using index "trip_pkey";

alter table "public"."trip_invitation" add constraint "trip_invitation_pkey" PRIMARY KEY using index "trip_invitation_pkey";

alter table "public"."trip_member" add constraint "trip_member_pkey" PRIMARY KEY using index "trip_member_pkey";

alter table "public"."user" add constraint "user_pkey" PRIMARY KEY using index "user_pkey";

alter table "public"."app_notification" add constraint "app_notification_actor_user_id_fkey" FOREIGN KEY (actor_user_id) REFERENCES public."user"(id) ON DELETE SET NULL not valid;

alter table "public"."app_notification" validate constraint "app_notification_actor_user_id_fkey";

alter table "public"."app_notification" add constraint "app_notification_trip_id_fkey" FOREIGN KEY (trip_id) REFERENCES public.trip(id) ON DELETE CASCADE not valid;

alter table "public"."app_notification" validate constraint "app_notification_trip_id_fkey";

alter table "public"."app_notification" add constraint "app_notification_trip_invitation_id_fkey" FOREIGN KEY (trip_invitation_id) REFERENCES public.trip_invitation(id) ON DELETE CASCADE not valid;

alter table "public"."app_notification" validate constraint "app_notification_trip_invitation_id_fkey";

alter table "public"."app_notification" add constraint "app_notification_type_check" CHECK ((type = ANY (ARRAY['trip_invited'::text, 'trip_invite_accepted'::text, 'trip_invite_rejected'::text]))) not valid;

alter table "public"."app_notification" validate constraint "app_notification_type_check";

alter table "public"."app_notification" add constraint "app_notification_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE not valid;

alter table "public"."app_notification" validate constraint "app_notification_user_id_fkey";

alter table "public"."checklist_item" add constraint "checklist_item_trip_id_fkey" FOREIGN KEY (trip_id) REFERENCES public.trip(id) ON DELETE CASCADE not valid;

alter table "public"."checklist_item" validate constraint "checklist_item_trip_id_fkey";

alter table "public"."checklist_item" add constraint "checklist_item_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE not valid;

alter table "public"."checklist_item" validate constraint "checklist_item_user_id_fkey";

alter table "public"."document" add constraint "document_pin_id_fkey" FOREIGN KEY (pin_id) REFERENCES public.pin(id) ON DELETE CASCADE not valid;

alter table "public"."document" validate constraint "document_pin_id_fkey";

alter table "public"."document" add constraint "document_trip_id_fkey" FOREIGN KEY (trip_id) REFERENCES public.trip(id) ON DELETE CASCADE not valid;

alter table "public"."document" validate constraint "document_trip_id_fkey";

alter table "public"."document" add constraint "document_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE not valid;

alter table "public"."document" validate constraint "document_user_id_fkey";

alter table "public"."expense" add constraint "expense_paid_by_user_id_fkey" FOREIGN KEY (paid_by_user_id) REFERENCES public."user"(id) ON DELETE RESTRICT not valid;

alter table "public"."expense" validate constraint "expense_paid_by_user_id_fkey";

alter table "public"."expense" add constraint "expense_pin_id_fkey" FOREIGN KEY (pin_id) REFERENCES public.pin(id) ON DELETE CASCADE not valid;

alter table "public"."expense" validate constraint "expense_pin_id_fkey";

alter table "public"."expense" add constraint "expense_trip_id_fkey" FOREIGN KEY (trip_id) REFERENCES public.trip(id) ON DELETE CASCADE not valid;

alter table "public"."expense" validate constraint "expense_trip_id_fkey";

alter table "public"."expense" add constraint "expense_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE not valid;

alter table "public"."expense" validate constraint "expense_user_id_fkey";

alter table "public"."image" add constraint "image_pin_id_fkey" FOREIGN KEY (pin_id) REFERENCES public.pin(id) ON DELETE CASCADE not valid;

alter table "public"."image" validate constraint "image_pin_id_fkey";

alter table "public"."image" add constraint "image_trip_id_fkey" FOREIGN KEY (trip_id) REFERENCES public.trip(id) ON DELETE CASCADE not valid;

alter table "public"."image" validate constraint "image_trip_id_fkey";

alter table "public"."image" add constraint "image_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE not valid;

alter table "public"."image" validate constraint "image_user_id_fkey";

alter table "public"."note" add constraint "note_pin_id_fkey" FOREIGN KEY (pin_id) REFERENCES public.pin(id) ON DELETE CASCADE not valid;

alter table "public"."note" validate constraint "note_pin_id_fkey";

alter table "public"."note" add constraint "note_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE not valid;

alter table "public"."note" validate constraint "note_user_id_fkey";

alter table "public"."pin" add constraint "pin_category_id_check" CHECK ((char_length(TRIM(BOTH FROM category_id)) > 0)) not valid;

alter table "public"."pin" validate constraint "pin_category_id_check";

alter table "public"."pin" add constraint "pin_name_check" CHECK ((char_length(TRIM(BOTH FROM name)) > 0)) not valid;

alter table "public"."pin" validate constraint "pin_name_check";

alter table "public"."pin" add constraint "pin_time_check" CHECK ((char_length(TRIM(BOTH FROM "time")) > 0)) not valid;

alter table "public"."pin" validate constraint "pin_time_check";

alter table "public"."pin" add constraint "pin_trip_id_fkey" FOREIGN KEY (trip_id) REFERENCES public.trip(id) ON DELETE CASCADE not valid;

alter table "public"."pin" validate constraint "pin_trip_id_fkey";

alter table "public"."pin" add constraint "pin_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."pin" validate constraint "pin_user_id_fkey";

alter table "public"."reference_link" add constraint "reference_link_pin_id_fkey" FOREIGN KEY (pin_id) REFERENCES public.pin(id) ON DELETE CASCADE not valid;

alter table "public"."reference_link" validate constraint "reference_link_pin_id_fkey";

alter table "public"."reference_link" add constraint "reference_link_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE not valid;

alter table "public"."reference_link" validate constraint "reference_link_user_id_fkey";

alter table "public"."trip" add constraint "trip_date_order" CHECK ((end_date >= start_date)) not valid;

alter table "public"."trip" validate constraint "trip_date_order";

alter table "public"."trip" add constraint "trip_title_check" CHECK ((char_length(TRIM(BOTH FROM title)) > 0)) not valid;

alter table "public"."trip" validate constraint "trip_title_check";

alter table "public"."trip" add constraint "trip_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."trip" validate constraint "trip_user_id_fkey";

alter table "public"."trip_invitation" add constraint "trip_invitation_invitee_user_id_fkey" FOREIGN KEY (invitee_user_id) REFERENCES public."user"(id) ON DELETE CASCADE not valid;

alter table "public"."trip_invitation" validate constraint "trip_invitation_invitee_user_id_fkey";

alter table "public"."trip_invitation" add constraint "trip_invitation_inviter_user_id_fkey" FOREIGN KEY (inviter_user_id) REFERENCES public."user"(id) ON DELETE CASCADE not valid;

alter table "public"."trip_invitation" validate constraint "trip_invitation_inviter_user_id_fkey";

alter table "public"."trip_invitation" add constraint "trip_invitation_not_self_check" CHECK ((inviter_user_id <> invitee_user_id)) not valid;

alter table "public"."trip_invitation" validate constraint "trip_invitation_not_self_check";

alter table "public"."trip_invitation" add constraint "trip_invitation_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'accepted'::text, 'rejected'::text, 'withdrawn'::text]))) not valid;

alter table "public"."trip_invitation" validate constraint "trip_invitation_status_check";

alter table "public"."trip_invitation" add constraint "trip_invitation_trip_id_fkey" FOREIGN KEY (trip_id) REFERENCES public.trip(id) ON DELETE CASCADE not valid;

alter table "public"."trip_invitation" validate constraint "trip_invitation_trip_id_fkey";

alter table "public"."trip_member" add constraint "trip_member_created_from_invitation_id_fkey" FOREIGN KEY (created_from_invitation_id) REFERENCES public.trip_invitation(id) ON DELETE SET NULL not valid;

alter table "public"."trip_member" validate constraint "trip_member_created_from_invitation_id_fkey";

alter table "public"."trip_member" add constraint "trip_member_disabled_reason_check" CHECK ((((status = 'disabled'::text) AND (disabled_reason = ANY (ARRAY['owner_disabled'::text, 'user_left'::text]))) OR ((status = 'active'::text) AND (disabled_reason IS NULL)))) not valid;

alter table "public"."trip_member" validate constraint "trip_member_disabled_reason_check";

alter table "public"."trip_member" add constraint "trip_member_role_check" CHECK ((role = 'companion'::text)) not valid;

alter table "public"."trip_member" validate constraint "trip_member_role_check";

alter table "public"."trip_member" add constraint "trip_member_status_check" CHECK ((status = ANY (ARRAY['active'::text, 'disabled'::text]))) not valid;

alter table "public"."trip_member" validate constraint "trip_member_status_check";

alter table "public"."trip_member" add constraint "trip_member_trip_id_fkey" FOREIGN KEY (trip_id) REFERENCES public.trip(id) ON DELETE CASCADE not valid;

alter table "public"."trip_member" validate constraint "trip_member_trip_id_fkey";

alter table "public"."trip_member" add constraint "trip_member_unique_trip_user" UNIQUE using index "trip_member_unique_trip_user";

alter table "public"."trip_member" add constraint "trip_member_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE not valid;

alter table "public"."trip_member" validate constraint "trip_member_user_id_fkey";

alter table "public"."user" add constraint "user_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user" validate constraint "user_id_fkey";

alter table "public"."user" add constraint "user_username_format_check" CHECK ((username ~ '^[a-z0-9_]+$'::text)) not valid;

alter table "public"."user" validate constraint "user_username_format_check";

alter table "public"."user" add constraint "user_username_key" UNIQUE using index "user_username_key";

alter table "public"."user" add constraint "user_username_length_check" CHECK (((char_length(username) >= 3) AND (char_length(username) <= 30))) not valid;

alter table "public"."user" validate constraint "user_username_length_check";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION private.create_trip_invitation_notification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  inviter_username text;
  trip_title text;
begin
  select username into inviter_username
  from public."user"
  where id = new.inviter_user_id;

  select title into trip_title
  from public.trip
  where id = new.trip_id;

  insert into public.app_notification (
    user_id,
    actor_user_id,
    trip_id,
    trip_invitation_id,
    type,
    title,
    body
  ) values (
    new.invitee_user_id,
    new.inviter_user_id,
    new.trip_id,
    new.id,
    'trip_invited',
    'Trip invitation',
    coalesce(inviter_username, 'Someone') || ' invited you to co-edit ' || coalesce(trip_title, 'a trip') || '.'
  );

  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION private.create_trip_invitation_response_notification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  invitee_username text;
  trip_title text;
  notification_type text;
  notification_title text;
  notification_body text;
begin
  if old.status <> 'pending' or new.status not in ('accepted', 'rejected') then
    return new;
  end if;

  select username into invitee_username
  from public."user"
  where id = new.invitee_user_id;

  select title into trip_title
  from public.trip
  where id = new.trip_id;

  notification_type := case
    when new.status = 'accepted' then 'trip_invite_accepted'
    else 'trip_invite_rejected'
  end;

  notification_title := case
    when new.status = 'accepted' then 'Invite accepted'
    else 'Invite declined'
  end;

  notification_body := coalesce(invitee_username, 'Someone') || case
    when new.status = 'accepted' then ' joined '
    else ' declined your invite to '
  end || coalesce(trip_title, 'your trip') || case
    when new.status = 'accepted' then ' as a companion.'
    else '.'
  end;

  insert into public.app_notification (
    user_id,
    actor_user_id,
    trip_id,
    trip_invitation_id,
    type,
    title,
    body
  ) values (
    new.inviter_user_id,
    new.invitee_user_id,
    new.trip_id,
    new.id,
    notification_type,
    notification_title,
    notification_body
  );

  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION private.current_user_owns_trip(target_trip_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1
    from public.trip
    where trip.id = target_trip_id
      and trip.user_id = auth.uid()
      and trip.deleted_at is null
  );
$function$
;

CREATE OR REPLACE FUNCTION private.sync_trip_member_from_invitation()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
      created_from_invitation_id = coalesce(public.trip_member.created_from_invitation_id, excluded.created_from_invitation_id),
      updated_at = now();
  end if;

  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.enforce_trip_invitation_lifecycle()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
begin
  if new.id <> old.id
    or new.trip_id <> old.trip_id
    or new.inviter_user_id <> old.inviter_user_id
    or new.invitee_user_id <> old.invitee_user_id
    or new.created_at <> old.created_at then
    raise exception 'Trip invitation identity fields cannot be changed';
  end if;

  if old.status = 'pending' and new.status not in ('pending', 'accepted', 'rejected', 'withdrawn') then
    raise exception 'Invalid trip invitation transition from pending to %', new.status;
  elsif old.status in ('accepted', 'rejected', 'withdrawn') and new.status <> old.status then
    raise exception 'Trip invitation status % is final', old.status;
  end if;

  if new.status <> old.status and new.responded_at is null then
    new.responded_at = now();
  end if;

  new.updated_at = now();
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  new_username text;
begin
  new_username := lower(trim(coalesce(new.raw_user_meta_data->>'username', '')));

  if new_username = '' then
    raise exception 'username is required';
  end if;

  if new_username !~ '^[a-z0-9_]+$' then
    raise exception 'username must contain only lowercase letters, numbers, and underscores';
  end if;

  insert into public."user" (id, username)
  values (new.id, new_username);

  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.set_trip_invitation_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at = now();

  if new.status in ('accepted', 'rejected') and new.responded_at is null then
    new.responded_at = now();
  end if;

  if new.status = 'pending' then
    new.responded_at = null;
  end if;

  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.set_user_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$
;

grant delete on table "public"."app_notification" to "anon";

grant insert on table "public"."app_notification" to "anon";

grant references on table "public"."app_notification" to "anon";

grant select on table "public"."app_notification" to "anon";

grant trigger on table "public"."app_notification" to "anon";

grant truncate on table "public"."app_notification" to "anon";

grant update on table "public"."app_notification" to "anon";

grant delete on table "public"."app_notification" to "authenticated";

grant insert on table "public"."app_notification" to "authenticated";

grant references on table "public"."app_notification" to "authenticated";

grant select on table "public"."app_notification" to "authenticated";

grant trigger on table "public"."app_notification" to "authenticated";

grant truncate on table "public"."app_notification" to "authenticated";

grant update on table "public"."app_notification" to "authenticated";

grant delete on table "public"."app_notification" to "service_role";

grant insert on table "public"."app_notification" to "service_role";

grant references on table "public"."app_notification" to "service_role";

grant select on table "public"."app_notification" to "service_role";

grant trigger on table "public"."app_notification" to "service_role";

grant truncate on table "public"."app_notification" to "service_role";

grant update on table "public"."app_notification" to "service_role";

grant delete on table "public"."checklist_item" to "anon";

grant insert on table "public"."checklist_item" to "anon";

grant references on table "public"."checklist_item" to "anon";

grant select on table "public"."checklist_item" to "anon";

grant trigger on table "public"."checklist_item" to "anon";

grant truncate on table "public"."checklist_item" to "anon";

grant update on table "public"."checklist_item" to "anon";

grant delete on table "public"."checklist_item" to "authenticated";

grant insert on table "public"."checklist_item" to "authenticated";

grant references on table "public"."checklist_item" to "authenticated";

grant select on table "public"."checklist_item" to "authenticated";

grant trigger on table "public"."checklist_item" to "authenticated";

grant truncate on table "public"."checklist_item" to "authenticated";

grant update on table "public"."checklist_item" to "authenticated";

grant delete on table "public"."checklist_item" to "service_role";

grant insert on table "public"."checklist_item" to "service_role";

grant references on table "public"."checklist_item" to "service_role";

grant select on table "public"."checklist_item" to "service_role";

grant trigger on table "public"."checklist_item" to "service_role";

grant truncate on table "public"."checklist_item" to "service_role";

grant update on table "public"."checklist_item" to "service_role";

grant delete on table "public"."document" to "anon";

grant insert on table "public"."document" to "anon";

grant references on table "public"."document" to "anon";

grant select on table "public"."document" to "anon";

grant trigger on table "public"."document" to "anon";

grant truncate on table "public"."document" to "anon";

grant update on table "public"."document" to "anon";

grant delete on table "public"."document" to "authenticated";

grant insert on table "public"."document" to "authenticated";

grant references on table "public"."document" to "authenticated";

grant select on table "public"."document" to "authenticated";

grant trigger on table "public"."document" to "authenticated";

grant truncate on table "public"."document" to "authenticated";

grant update on table "public"."document" to "authenticated";

grant delete on table "public"."document" to "service_role";

grant insert on table "public"."document" to "service_role";

grant references on table "public"."document" to "service_role";

grant select on table "public"."document" to "service_role";

grant trigger on table "public"."document" to "service_role";

grant truncate on table "public"."document" to "service_role";

grant update on table "public"."document" to "service_role";

grant delete on table "public"."expense" to "anon";

grant insert on table "public"."expense" to "anon";

grant references on table "public"."expense" to "anon";

grant select on table "public"."expense" to "anon";

grant trigger on table "public"."expense" to "anon";

grant truncate on table "public"."expense" to "anon";

grant update on table "public"."expense" to "anon";

grant delete on table "public"."expense" to "authenticated";

grant insert on table "public"."expense" to "authenticated";

grant references on table "public"."expense" to "authenticated";

grant select on table "public"."expense" to "authenticated";

grant trigger on table "public"."expense" to "authenticated";

grant truncate on table "public"."expense" to "authenticated";

grant update on table "public"."expense" to "authenticated";

grant delete on table "public"."expense" to "service_role";

grant insert on table "public"."expense" to "service_role";

grant references on table "public"."expense" to "service_role";

grant select on table "public"."expense" to "service_role";

grant trigger on table "public"."expense" to "service_role";

grant truncate on table "public"."expense" to "service_role";

grant update on table "public"."expense" to "service_role";

grant delete on table "public"."image" to "anon";

grant insert on table "public"."image" to "anon";

grant references on table "public"."image" to "anon";

grant select on table "public"."image" to "anon";

grant trigger on table "public"."image" to "anon";

grant truncate on table "public"."image" to "anon";

grant update on table "public"."image" to "anon";

grant delete on table "public"."image" to "authenticated";

grant insert on table "public"."image" to "authenticated";

grant references on table "public"."image" to "authenticated";

grant select on table "public"."image" to "authenticated";

grant trigger on table "public"."image" to "authenticated";

grant truncate on table "public"."image" to "authenticated";

grant update on table "public"."image" to "authenticated";

grant delete on table "public"."image" to "service_role";

grant insert on table "public"."image" to "service_role";

grant references on table "public"."image" to "service_role";

grant select on table "public"."image" to "service_role";

grant trigger on table "public"."image" to "service_role";

grant truncate on table "public"."image" to "service_role";

grant update on table "public"."image" to "service_role";

grant delete on table "public"."note" to "anon";

grant insert on table "public"."note" to "anon";

grant references on table "public"."note" to "anon";

grant select on table "public"."note" to "anon";

grant trigger on table "public"."note" to "anon";

grant truncate on table "public"."note" to "anon";

grant update on table "public"."note" to "anon";

grant delete on table "public"."note" to "authenticated";

grant insert on table "public"."note" to "authenticated";

grant references on table "public"."note" to "authenticated";

grant select on table "public"."note" to "authenticated";

grant trigger on table "public"."note" to "authenticated";

grant truncate on table "public"."note" to "authenticated";

grant update on table "public"."note" to "authenticated";

grant delete on table "public"."note" to "service_role";

grant insert on table "public"."note" to "service_role";

grant references on table "public"."note" to "service_role";

grant select on table "public"."note" to "service_role";

grant trigger on table "public"."note" to "service_role";

grant truncate on table "public"."note" to "service_role";

grant update on table "public"."note" to "service_role";

grant delete on table "public"."pin" to "anon";

grant insert on table "public"."pin" to "anon";

grant references on table "public"."pin" to "anon";

grant select on table "public"."pin" to "anon";

grant trigger on table "public"."pin" to "anon";

grant truncate on table "public"."pin" to "anon";

grant update on table "public"."pin" to "anon";

grant delete on table "public"."pin" to "authenticated";

grant insert on table "public"."pin" to "authenticated";

grant references on table "public"."pin" to "authenticated";

grant select on table "public"."pin" to "authenticated";

grant trigger on table "public"."pin" to "authenticated";

grant truncate on table "public"."pin" to "authenticated";

grant update on table "public"."pin" to "authenticated";

grant delete on table "public"."pin" to "service_role";

grant insert on table "public"."pin" to "service_role";

grant references on table "public"."pin" to "service_role";

grant select on table "public"."pin" to "service_role";

grant trigger on table "public"."pin" to "service_role";

grant truncate on table "public"."pin" to "service_role";

grant update on table "public"."pin" to "service_role";

grant delete on table "public"."reference_link" to "anon";

grant insert on table "public"."reference_link" to "anon";

grant references on table "public"."reference_link" to "anon";

grant select on table "public"."reference_link" to "anon";

grant trigger on table "public"."reference_link" to "anon";

grant truncate on table "public"."reference_link" to "anon";

grant update on table "public"."reference_link" to "anon";

grant delete on table "public"."reference_link" to "authenticated";

grant insert on table "public"."reference_link" to "authenticated";

grant references on table "public"."reference_link" to "authenticated";

grant select on table "public"."reference_link" to "authenticated";

grant trigger on table "public"."reference_link" to "authenticated";

grant truncate on table "public"."reference_link" to "authenticated";

grant update on table "public"."reference_link" to "authenticated";

grant delete on table "public"."reference_link" to "service_role";

grant insert on table "public"."reference_link" to "service_role";

grant references on table "public"."reference_link" to "service_role";

grant select on table "public"."reference_link" to "service_role";

grant trigger on table "public"."reference_link" to "service_role";

grant truncate on table "public"."reference_link" to "service_role";

grant update on table "public"."reference_link" to "service_role";

grant delete on table "public"."trip" to "anon";

grant insert on table "public"."trip" to "anon";

grant references on table "public"."trip" to "anon";

grant select on table "public"."trip" to "anon";

grant trigger on table "public"."trip" to "anon";

grant truncate on table "public"."trip" to "anon";

grant update on table "public"."trip" to "anon";

grant delete on table "public"."trip" to "authenticated";

grant insert on table "public"."trip" to "authenticated";

grant references on table "public"."trip" to "authenticated";

grant select on table "public"."trip" to "authenticated";

grant trigger on table "public"."trip" to "authenticated";

grant truncate on table "public"."trip" to "authenticated";

grant update on table "public"."trip" to "authenticated";

grant delete on table "public"."trip" to "service_role";

grant insert on table "public"."trip" to "service_role";

grant references on table "public"."trip" to "service_role";

grant select on table "public"."trip" to "service_role";

grant trigger on table "public"."trip" to "service_role";

grant truncate on table "public"."trip" to "service_role";

grant update on table "public"."trip" to "service_role";

grant delete on table "public"."trip_invitation" to "anon";

grant insert on table "public"."trip_invitation" to "anon";

grant references on table "public"."trip_invitation" to "anon";

grant select on table "public"."trip_invitation" to "anon";

grant trigger on table "public"."trip_invitation" to "anon";

grant truncate on table "public"."trip_invitation" to "anon";

grant update on table "public"."trip_invitation" to "anon";

grant delete on table "public"."trip_invitation" to "authenticated";

grant insert on table "public"."trip_invitation" to "authenticated";

grant references on table "public"."trip_invitation" to "authenticated";

grant select on table "public"."trip_invitation" to "authenticated";

grant trigger on table "public"."trip_invitation" to "authenticated";

grant truncate on table "public"."trip_invitation" to "authenticated";

grant update on table "public"."trip_invitation" to "authenticated";

grant delete on table "public"."trip_invitation" to "service_role";

grant insert on table "public"."trip_invitation" to "service_role";

grant references on table "public"."trip_invitation" to "service_role";

grant select on table "public"."trip_invitation" to "service_role";

grant trigger on table "public"."trip_invitation" to "service_role";

grant truncate on table "public"."trip_invitation" to "service_role";

grant update on table "public"."trip_invitation" to "service_role";

grant delete on table "public"."trip_member" to "anon";

grant insert on table "public"."trip_member" to "anon";

grant references on table "public"."trip_member" to "anon";

grant select on table "public"."trip_member" to "anon";

grant trigger on table "public"."trip_member" to "anon";

grant truncate on table "public"."trip_member" to "anon";

grant update on table "public"."trip_member" to "anon";

grant delete on table "public"."trip_member" to "authenticated";

grant insert on table "public"."trip_member" to "authenticated";

grant references on table "public"."trip_member" to "authenticated";

grant select on table "public"."trip_member" to "authenticated";

grant trigger on table "public"."trip_member" to "authenticated";

grant truncate on table "public"."trip_member" to "authenticated";

grant update on table "public"."trip_member" to "authenticated";

grant delete on table "public"."trip_member" to "service_role";

grant insert on table "public"."trip_member" to "service_role";

grant references on table "public"."trip_member" to "service_role";

grant select on table "public"."trip_member" to "service_role";

grant trigger on table "public"."trip_member" to "service_role";

grant truncate on table "public"."trip_member" to "service_role";

grant update on table "public"."trip_member" to "service_role";

grant delete on table "public"."user" to "anon";

grant insert on table "public"."user" to "anon";

grant references on table "public"."user" to "anon";

grant select on table "public"."user" to "anon";

grant trigger on table "public"."user" to "anon";

grant truncate on table "public"."user" to "anon";

grant update on table "public"."user" to "anon";

grant delete on table "public"."user" to "authenticated";

grant insert on table "public"."user" to "authenticated";

grant references on table "public"."user" to "authenticated";

grant select on table "public"."user" to "authenticated";

grant trigger on table "public"."user" to "authenticated";

grant truncate on table "public"."user" to "authenticated";

grant update on table "public"."user" to "authenticated";

grant delete on table "public"."user" to "service_role";

grant insert on table "public"."user" to "service_role";

grant references on table "public"."user" to "service_role";

grant select on table "public"."user" to "service_role";

grant trigger on table "public"."user" to "service_role";

grant truncate on table "public"."user" to "service_role";

grant update on table "public"."user" to "service_role";


  create policy "Users can read their own notifications"
  on "public"."app_notification"
  as permissive
  for select
  to authenticated
using ((auth.uid() = user_id));



  create policy "Users can update their own notifications"
  on "public"."app_notification"
  as permissive
  for update
  to authenticated
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));



  create policy "Trip members can read checklist items"
  on "public"."checklist_item"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.trip t
  WHERE ((t.id = checklist_item.trip_id) AND ((t.user_id = auth.uid()) OR (EXISTS ( SELECT 1
           FROM public.trip_invitation ti
          WHERE ((ti.trip_id = t.id) AND (ti.invitee_user_id = auth.uid()) AND (ti.status = 'accepted'::text)))))))));



  create policy "Users can delete their own checklist items"
  on "public"."checklist_item"
  as permissive
  for delete
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.trip t
  WHERE ((t.id = checklist_item.trip_id) AND ((t.user_id = auth.uid()) OR (EXISTS ( SELECT 1
           FROM public.trip_member tm
          WHERE ((tm.trip_id = checklist_item.trip_id) AND (tm.user_id = auth.uid()) AND (tm.status = 'active'::text)))))))));



  create policy "Users can insert their own checklist items"
  on "public"."checklist_item"
  as permissive
  for insert
  to authenticated
with check (((auth.uid() = user_id) AND (EXISTS ( SELECT 1
   FROM public.trip t
  WHERE ((t.id = checklist_item.trip_id) AND ((t.user_id = auth.uid()) OR (EXISTS ( SELECT 1
           FROM public.trip_member tm
          WHERE ((tm.trip_id = checklist_item.trip_id) AND (tm.user_id = auth.uid()) AND (tm.status = 'active'::text))))))))));



  create policy "Users can update their own checklist items"
  on "public"."checklist_item"
  as permissive
  for update
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.trip t
  WHERE ((t.id = checklist_item.trip_id) AND ((t.user_id = auth.uid()) OR (EXISTS ( SELECT 1
           FROM public.trip_member tm
          WHERE ((tm.trip_id = checklist_item.trip_id) AND (tm.user_id = auth.uid()) AND (tm.status = 'active'::text)))))))))
with check ((EXISTS ( SELECT 1
   FROM public.trip t
  WHERE ((t.id = checklist_item.trip_id) AND ((t.user_id = auth.uid()) OR (EXISTS ( SELECT 1
           FROM public.trip_member tm
          WHERE ((tm.trip_id = checklist_item.trip_id) AND (tm.user_id = auth.uid()) AND (tm.status = 'active'::text)))))))));



  create policy "Trip members can read documents"
  on "public"."document"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.trip t
  WHERE ((t.id = document.trip_id) AND ((t.user_id = auth.uid()) OR (EXISTS ( SELECT 1
           FROM public.trip_invitation ti
          WHERE ((ti.trip_id = t.id) AND (ti.invitee_user_id = auth.uid()) AND (ti.status = 'accepted'::text)))))))));



  create policy "Users can delete their own documents"
  on "public"."document"
  as permissive
  for delete
  to authenticated
using ((auth.uid() = user_id));



  create policy "Users can insert their own documents"
  on "public"."document"
  as permissive
  for insert
  to public
with check (((auth.uid() = user_id) AND (EXISTS ( SELECT 1
   FROM public.trip t
  WHERE ((t.id = document.trip_id) AND ((t.user_id = auth.uid()) OR (EXISTS ( SELECT 1
           FROM public.trip_member tm
          WHERE ((tm.trip_id = document.trip_id) AND (tm.user_id = auth.uid()) AND (tm.status = 'active'::text)))))))) AND ((pin_id IS NULL) OR (EXISTS ( SELECT 1
   FROM public.pin p
  WHERE ((p.id = document.pin_id) AND (p.trip_id = document.trip_id)))))));



  create policy "Users can update their own documents"
  on "public"."document"
  as permissive
  for update
  to authenticated
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));



  create policy "Trip members can read expenses"
  on "public"."expense"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.trip t
  WHERE ((t.id = expense.trip_id) AND ((t.user_id = auth.uid()) OR (EXISTS ( SELECT 1
           FROM public.trip_invitation ti
          WHERE ((ti.trip_id = t.id) AND (ti.invitee_user_id = auth.uid()) AND (ti.status = 'accepted'::text)))))))));



  create policy "Users can delete their own expenses"
  on "public"."expense"
  as permissive
  for delete
  to authenticated
using ((auth.uid() = user_id));



  create policy "Users can insert their own expenses"
  on "public"."expense"
  as permissive
  for insert
  to public
with check (((auth.uid() = user_id) AND (EXISTS ( SELECT 1
   FROM public.trip t
  WHERE ((t.id = expense.trip_id) AND ((t.user_id = auth.uid()) OR (EXISTS ( SELECT 1
           FROM public.trip_member tm
          WHERE ((tm.trip_id = expense.trip_id) AND (tm.user_id = auth.uid()) AND (tm.status = 'active'::text)))))))) AND ((pin_id IS NULL) OR (EXISTS ( SELECT 1
   FROM public.pin p
  WHERE ((p.id = expense.pin_id) AND (p.trip_id = expense.trip_id)))))));



  create policy "Users can update their own expenses"
  on "public"."expense"
  as permissive
  for update
  to authenticated
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));



  create policy "Trip members can read images"
  on "public"."image"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.trip t
  WHERE ((t.id = image.trip_id) AND ((t.user_id = auth.uid()) OR (EXISTS ( SELECT 1
           FROM public.trip_invitation ti
          WHERE ((ti.trip_id = t.id) AND (ti.invitee_user_id = auth.uid()) AND (ti.status = 'accepted'::text)))))))));



  create policy "Users can delete their own images"
  on "public"."image"
  as permissive
  for delete
  to authenticated
using ((auth.uid() = user_id));



  create policy "Users can insert their own images"
  on "public"."image"
  as permissive
  for insert
  to public
with check (((auth.uid() = user_id) AND (EXISTS ( SELECT 1
   FROM public.trip t
  WHERE ((t.id = image.trip_id) AND ((t.user_id = auth.uid()) OR (EXISTS ( SELECT 1
           FROM public.trip_member tm
          WHERE ((tm.trip_id = image.trip_id) AND (tm.user_id = auth.uid()) AND (tm.status = 'active'::text)))))))) AND ((pin_id IS NULL) OR (EXISTS ( SELECT 1
   FROM public.pin p
  WHERE ((p.id = image.pin_id) AND (p.trip_id = image.trip_id)))))));



  create policy "Users can update their own images"
  on "public"."image"
  as permissive
  for update
  to authenticated
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));



  create policy "Trip members can read notes"
  on "public"."note"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.trip t
  WHERE ((t.id = note.trip_id) AND ((t.user_id = auth.uid()) OR (EXISTS ( SELECT 1
           FROM public.trip_invitation ti
          WHERE ((ti.trip_id = t.id) AND (ti.invitee_user_id = auth.uid()) AND (ti.status = 'accepted'::text)))))))));



  create policy "Users can delete their own notes"
  on "public"."note"
  as permissive
  for delete
  to authenticated
using ((auth.uid() = user_id));



  create policy "Users can insert their own notes"
  on "public"."note"
  as permissive
  for insert
  to public
with check (((auth.uid() = user_id) AND (EXISTS ( SELECT 1
   FROM public.trip t
  WHERE ((t.id = note.trip_id) AND ((t.user_id = auth.uid()) OR (EXISTS ( SELECT 1
           FROM public.trip_member tm
          WHERE ((tm.trip_id = note.trip_id) AND (tm.user_id = auth.uid()) AND (tm.status = 'active'::text)))))))) AND ((pin_id IS NULL) OR (EXISTS ( SELECT 1
   FROM public.pin p
  WHERE ((p.id = note.pin_id) AND (p.trip_id = note.trip_id)))))));



  create policy "Users can update their own notes"
  on "public"."note"
  as permissive
  for update
  to authenticated
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));



  create policy "Trip members can read pins"
  on "public"."pin"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.trip t
  WHERE ((t.id = pin.trip_id) AND ((t.user_id = auth.uid()) OR (EXISTS ( SELECT 1
           FROM public.trip_invitation ti
          WHERE ((ti.trip_id = t.id) AND (ti.invitee_user_id = auth.uid()) AND (ti.status = 'accepted'::text)))))))));



  create policy "Users can delete their own pins"
  on "public"."pin"
  as permissive
  for delete
  to authenticated
using ((auth.uid() = user_id));



  create policy "Users can insert their own pins"
  on "public"."pin"
  as permissive
  for insert
  to authenticated
with check (((auth.uid() = user_id) AND (EXISTS ( SELECT 1
   FROM public.trip t
  WHERE ((t.id = pin.trip_id) AND ((t.user_id = auth.uid()) OR (EXISTS ( SELECT 1
           FROM public.trip_member tm
          WHERE ((tm.trip_id = pin.trip_id) AND (tm.user_id = auth.uid()) AND (tm.status = 'active'::text))))))))));



  create policy "Users can update their own pins"
  on "public"."pin"
  as permissive
  for update
  to authenticated
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));



  create policy "Trip members can read reference links"
  on "public"."reference_link"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.trip t
  WHERE ((t.id = reference_link.trip_id) AND ((t.user_id = auth.uid()) OR (EXISTS ( SELECT 1
           FROM public.trip_invitation ti
          WHERE ((ti.trip_id = t.id) AND (ti.invitee_user_id = auth.uid()) AND (ti.status = 'accepted'::text)))))))));



  create policy "Users can delete their own reference links"
  on "public"."reference_link"
  as permissive
  for delete
  to authenticated
using ((auth.uid() = user_id));



  create policy "Users can insert their own reference links"
  on "public"."reference_link"
  as permissive
  for insert
  to public
with check (((auth.uid() = user_id) AND (EXISTS ( SELECT 1
   FROM public.trip t
  WHERE ((t.id = reference_link.trip_id) AND ((t.user_id = auth.uid()) OR (EXISTS ( SELECT 1
           FROM public.trip_member tm
          WHERE ((tm.trip_id = reference_link.trip_id) AND (tm.user_id = auth.uid()) AND (tm.status = 'active'::text)))))))) AND ((pin_id IS NULL) OR (EXISTS ( SELECT 1
   FROM public.pin p
  WHERE ((p.id = reference_link.pin_id) AND (p.trip_id = reference_link.trip_id)))))));



  create policy "Users can update their own reference links"
  on "public"."reference_link"
  as permissive
  for update
  to authenticated
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));



  create policy "Owners and active companions can read trips"
  on "public"."trip"
  as permissive
  for select
  to authenticated
using (((( SELECT auth.uid() AS uid) = user_id) OR (EXISTS ( SELECT 1
   FROM public.trip_member tm
  WHERE ((tm.trip_id = trip.id) AND (tm.user_id = ( SELECT auth.uid() AS uid)) AND (tm.status = 'active'::text))))));



  create policy "Users can delete their own trips"
  on "public"."trip"
  as permissive
  for delete
  to authenticated
using ((auth.uid() = user_id));



  create policy "Users can insert their own trips"
  on "public"."trip"
  as permissive
  for insert
  to authenticated
with check ((auth.uid() = user_id));



  create policy "Users can update their own trips"
  on "public"."trip"
  as permissive
  for update
  to authenticated
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));



  create policy "Inviter and invitee can read trip invitations"
  on "public"."trip_invitation"
  as permissive
  for select
  to authenticated
using (((( SELECT auth.uid() AS uid) = inviter_user_id) OR (( SELECT auth.uid() AS uid) = invitee_user_id)));



  create policy "Owner can create trip invitations"
  on "public"."trip_invitation"
  as permissive
  for insert
  to authenticated
with check (((inviter_user_id = ( SELECT auth.uid() AS uid)) AND (status = 'pending'::text) AND private.current_user_owns_trip(trip_id)));



  create policy "Trip invitation lifecycle updates"
  on "public"."trip_invitation"
  as permissive
  for update
  to authenticated
using ((((( SELECT auth.uid() AS uid) = invitee_user_id) AND (status = 'pending'::text)) OR (private.current_user_owns_trip(trip_id) AND (status = 'pending'::text))))
with check ((((( SELECT auth.uid() AS uid) = invitee_user_id) AND (status = ANY (ARRAY['accepted'::text, 'rejected'::text]))) OR (private.current_user_owns_trip(trip_id) AND (status = 'withdrawn'::text))));



  create policy "Owner can update trip member access"
  on "public"."trip_member"
  as permissive
  for update
  to authenticated
using ((private.current_user_owns_trip(trip_id) AND (role = 'companion'::text)))
with check ((private.current_user_owns_trip(trip_id) AND (role = 'companion'::text) AND (((status = 'active'::text) AND (disabled_reason IS NULL)) OR ((status = 'disabled'::text) AND (disabled_reason = 'owner_disabled'::text)))));



  create policy "Trip members can read trip members"
  on "public"."trip_member"
  as permissive
  for select
  to authenticated
using (((( SELECT auth.uid() AS uid) = user_id) OR private.current_user_owns_trip(trip_id)));



  create policy "Users can read public user profiles"
  on "public"."user"
  as permissive
  for select
  to authenticated
using (true);


CREATE TRIGGER create_trip_invitation_notification_after_insert AFTER INSERT ON public.trip_invitation FOR EACH ROW EXECUTE FUNCTION private.create_trip_invitation_notification();

CREATE TRIGGER create_trip_invitation_response_notification_after_update AFTER UPDATE ON public.trip_invitation FOR EACH ROW EXECUTE FUNCTION private.create_trip_invitation_response_notification();

CREATE TRIGGER enforce_trip_invitation_lifecycle_before_update BEFORE UPDATE ON public.trip_invitation FOR EACH ROW EXECUTE FUNCTION public.enforce_trip_invitation_lifecycle();

CREATE TRIGGER on_trip_invitation_updated BEFORE UPDATE ON public.trip_invitation FOR EACH ROW EXECUTE FUNCTION public.set_trip_invitation_updated_at();

CREATE TRIGGER sync_trip_member_from_invitation_after_update AFTER UPDATE ON public.trip_invitation FOR EACH ROW EXECUTE FUNCTION private.sync_trip_member_from_invitation();

CREATE TRIGGER on_user_updated BEFORE UPDATE ON public."user" FOR EACH ROW EXECUTE FUNCTION public.set_user_updated_at();

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


  create policy "Authenticated users can read images"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using ((bucket_id = 'images'::text));



  create policy "Authenticated users can read travel documents"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using ((bucket_id = 'travel-documents'::text));



  create policy "Authenticated users can upload images"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check ((bucket_id = 'images'::text));



  create policy "Authenticated users can upload travel documents"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check ((bucket_id = 'travel-documents'::text));



