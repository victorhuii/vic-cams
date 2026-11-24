-- Only server-side code may reserve password attempts. Nothing is publicly writable.
create table if not exists public.film_preset_login_attempts (
 bucket text primary key,
 window_started timestamptz not null default now(),
 attempts integer not null default 0
);
alter table public.film_preset_login_attempts enable row level security;
revoke all on public.film_preset_login_attempts from public, anon, authenticated;
create or replace function public.reserve_film_preset_login(login_bucket text) returns boolean
language plpgsql security definer set search_path = '' as $$
declare reserved integer;
begin
 if login_bucket !~ '^[a-f0-9]{64}$' then return false; end if;
 insert into public.film_preset_login_attempts(bucket,window_started,attempts) values (login_bucket,now(),1)
 on conflict(bucket) do update set
 attempts = case when public.film_preset_login_attempts.window_started <= now()-interval '15 minutes' then 1 else public.film_preset_login_attempts.attempts+1 end,
 window_started = case when public.film_preset_login_attempts.window_started <= now()-interval '15 minutes' then now() else public.film_preset_login_attempts.window_started end
 where public.film_preset_login_attempts.window_started <= now()-interval '15 minutes' or public.film_preset_login_attempts.attempts < 5
 returning attempts into reserved;
 return reserved is not null;
end;
$$;
revoke all on function public.reserve_film_preset_login(text) from public, anon, authenticated;
grant execute on function public.reserve_film_preset_login(text) to service_role;
