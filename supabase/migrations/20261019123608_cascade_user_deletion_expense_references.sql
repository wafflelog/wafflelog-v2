alter table public.expense
drop constraint expense_paid_by_user_id_fkey;

alter table public.expense
add constraint expense_paid_by_user_id_fkey
foreign key (paid_by_user_id)
references public."user" (id)
on delete cascade;

alter table public.expense_participant
drop constraint expense_participant_user_id_fkey;

alter table public.expense_participant
add constraint expense_participant_user_id_fkey
foreign key (user_id)
references public."user" (id)
on delete cascade;
