-- Run once in the Supabase SQL Editor. Images are PRIVATE, never public URLs.
begin;
create table if not exists public.photo_creations (
 id uuid primary key,
 owner_id uuid not null default auth.uid() references auth.users(id),
 session_id uuid not null,
 kind text not null check (kind in ('film','booth')),
 title text not null check (char_length(title) <= 200),
 created_at timestamptz not null default now(),
 source_path text not null,
 output_path text,
 metadata jsonb not null default '{}'::jsonb,
 constraint owner_source_path check (split_part(source_path,'/',1)=owner_id::text),
 constraint owner_output_path check (output_path is null or split_part(output_path,'/',1)=owner_id::text)
);
alter table public.photo_creations enable row level security;
revoke all on public.photo_creations from public, anon, authenticated;
grant select,insert,update on public.photo_creations to authenticated;
create policy "creations_read_own" on public.photo_creations for select to authenticated using (owner_id=(select auth.uid()));
create policy "creations_insert_own" on public.photo_creations for insert to authenticated with check (owner_id=(select auth.uid()));
create policy "creations_update_own" on public.photo_creations for update to authenticated using (owner_id=(select auth.uid())) with check (owner_id=(select auth.uid()));
create policy "creations_owner_boundary" on public.photo_creations as restrictive for all to authenticated using (owner_id=(select auth.uid())) with check (owner_id=(select auth.uid()));
create index if not exists photo_creations_session on public.photo_creations(owner_id,session_id,created_at);
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
 values('session-photos','session-photos',false,20971520,array['image/jpeg','image/png','image/webp'])
 on conflict(id) do update set public=false,file_size_limit=20971520,allowed_mime_types=excluded.allowed_mime_types;
create policy "session_photos_insert_own" on storage.objects for insert to authenticated with check(bucket_id='session-photos' and (storage.foldername(name))[1]=(select auth.uid()::text));
create policy "session_photos_read_own" on storage.objects for select to authenticated using(bucket_id='session-photos' and (storage.foldername(name))[1]=(select auth.uid()::text));
create policy "session_photos_update_own" on storage.objects for update to authenticated using(bucket_id='session-photos' and (storage.foldername(name))[1]=(select auth.uid()::text)) with check(bucket_id='session-photos' and (storage.foldername(name))[1]=(select auth.uid()::text));
-- Restrictive boundaries also protect this bucket if a pre-existing permissive
-- storage policy grants access across multiple buckets.
create policy "session_photos_owner_boundary" on storage.objects as restrictive for all to authenticated using (bucket_id<>'session-photos' or (storage.foldername(name))[1]=(select auth.uid()::text)) with check (bucket_id<>'session-photos' or (storage.foldername(name))[1]=(select auth.uid()::text));
create policy "session_photos_anon_boundary" on storage.objects as restrictive for all to anon using (bucket_id<>'session-photos') with check (bucket_id<>'session-photos');
create policy "session_photos_no_visitor_delete" on storage.objects as restrictive for delete to authenticated using (bucket_id<>'session-photos');
-- No visitor DELETE policy. Removing a thumbnail does not delete the owner's backup.
commit;
