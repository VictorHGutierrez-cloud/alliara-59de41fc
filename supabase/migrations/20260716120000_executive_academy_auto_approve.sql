-- Executive Academy: new signups are approved immediately (no admin waiting room).
-- First user in an empty project also becomes admin.

ALTER TABLE public.profiles
  ALTER COLUMN access_status SET DEFAULT 'approved';

UPDATE public.profiles
SET access_status = 'approved'
WHERE access_status = 'pending';

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare
  admin_count integer;
begin
  insert into public.profiles (id, display_name, access_status)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    'approved'
  );

  select count(*) into admin_count
  from public.user_roles
  where role = 'admin';

  if admin_count = 0 then
    insert into public.user_roles (user_id, role)
    values (new.id, 'admin')
    on conflict do nothing;
  end if;

  return new;
end;
$function$;
