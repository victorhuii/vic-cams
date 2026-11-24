-- Shared preset SETTINGS only. Reference photos are not stored in this table.
create table if not exists public.film_presets (
 id uuid primary key,
 name text not null check (char_length(name) between 1 and 40),
 settings jsonb not null check (jsonb_typeof(settings) = 'object'),
 created_at timestamptz not null default now()
);
create unique index if not exists film_presets_name_unique on public.film_presets (lower(name));
alter table public.film_presets enable row level security;
revoke all on public.film_presets from anon, authenticated;
grant select on public.film_presets to anon, authenticated;
grant all on public.film_presets to service_role;
drop policy if exists "Anyone can read shared film presets" on public.film_presets;
create policy "Anyone can read shared film presets" on public.film_presets for select to anon, authenticated using (true);
-- Server-only, atomic daily cap on paid analysis calls, shared across all visitors.
create table if not exists public.film_replication_usage (day date primary key, requests integer not null default 0);
alter table public.film_replication_usage enable row level security;
revoke all on public.film_replication_usage from anon, authenticated;
create or replace function public.reserve_film_replication(daily_limit integer) returns boolean
language plpgsql security definer set search_path = '' as $$
declare reserved integer;
begin
 if daily_limit < 1 or daily_limit > 1000 then return false; end if;
 insert into public.film_replication_usage(day,requests) values ((now() at time zone 'UTC')::date,1)
 on conflict(day) do update set requests = public.film_replication_usage.requests + 1
 where public.film_replication_usage.requests < daily_limit returning requests into reserved;
 return reserved is not null;
end;
$$;
revoke all on function public.reserve_film_replication(integer) from public, anon, authenticated;
grant execute on function public.reserve_film_replication(integer) to service_role;
