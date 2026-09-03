alter table public.projects add column if not exists credit_reference text;
update public.projects set credit_reference = id::text where credit_reference is null;
alter table public.projects alter column credit_reference set not null;
alter table public.projects add constraint projects_credit_reference_len_chk check (length(credit_reference) between 1 and 128);
