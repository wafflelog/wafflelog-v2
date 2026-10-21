delete from public.note as note
where not exists (
  select 1
  from public.trip as trip
  where trip.id = note.trip_id
);

delete from public.reference_link as reference_link
where not exists (
  select 1
  from public.trip as trip
  where trip.id = reference_link.trip_id
);

alter table public.note
add constraint note_trip_id_fkey
foreign key (trip_id)
references public.trip (id)
on delete cascade;

alter table public.reference_link
add constraint reference_link_trip_id_fkey
foreign key (trip_id)
references public.trip (id)
on delete cascade;
