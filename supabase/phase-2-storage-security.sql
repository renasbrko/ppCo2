-- Phase 2: secure storage and content protection policies.
-- Run this in Supabase SQL editor after phase-1-schema.sql.

-- 1) Force private bucket for protected files.
insert into storage.buckets (id, name, public)
values ('alend-files-private', 'alend-files-private', false)
on conflict (id) do update set public = false;

-- Optional: lock old public bucket by forcing private.
update storage.buckets
set public = false
where id = 'alend-files';

-- 2) Ensure files table uses private bucket by default.
alter table if exists public.files
  alter column storage_bucket set default 'alend-files-private';

-- 3) Storage RLS: authenticated users cannot directly list/download files.
--    Access should happen via signed URLs from Edge Function.
drop policy if exists "private bucket deny select to direct clients" on storage.objects;
create policy "private bucket deny select to direct clients"
on storage.objects
for select
to authenticated
using (false);

drop policy if exists "private bucket deny anon select" on storage.objects;
create policy "private bucket deny anon select"
on storage.objects
for select
to anon
using (false);

-- 4) Only admins can create/update/delete objects in private bucket.
drop policy if exists "admins insert private objects" on storage.objects;
create policy "admins insert private objects"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'alend-files-private'
  and public.is_admin()
);

drop policy if exists "admins update private objects" on storage.objects;
create policy "admins update private objects"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'alend-files-private'
  and public.is_admin()
)
with check (
  bucket_id = 'alend-files-private'
  and public.is_admin()
);

drop policy if exists "admins delete private objects" on storage.objects;
create policy "admins delete private objects"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'alend-files-private'
  and public.is_admin()
);

-- 5) Tighten file metadata access in DB.
drop policy if exists "authenticated can read files" on public.files;
create policy "authenticated can read files metadata"
on public.files
for select
to authenticated
using (true);

drop policy if exists "admins manage files" on public.files;
create policy "admins manage files"
on public.files
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- 6) Add index for signed-url lookups.
create index if not exists idx_files_lesson_created_at on public.files (lesson_id, created_at desc);

