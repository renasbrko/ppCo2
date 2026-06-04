-- Phase 2 (Lockdown): RLS + Storage protection
-- Goal:
-- - Anonymous users must NEVER insert/update/delete or upload.
-- - Public users may ONLY read allowed educational content.
-- - Admin-only operations (upload/delete/edit) require authenticated admin role.
-- - Storage bucket rejects executable/html/js/php and only allows: pdf, mp4, mov, webm, mkv with MIME validation.
--
-- Run in Supabase SQL Editor AFTER:
-- - supabase/phase-1-schema.sql
-- - supabase/phase-3-user-profile.sql (optional columns)
-- - supabase/phase-2-security-hardening.sql (admin trigger, is_admin())

begin;

-- =========================
-- 0) Hardening helpers
-- =========================

create or replace function public.allowed_upload_mime(mime text)
returns boolean
language sql
stable
as $$
  select lower(coalesce(mime, '')) in (
    'application/pdf',
    'video/mp4',
    'video/quicktime',   -- .mov
    'video/webm',
    'video/x-matroska'   -- .mkv
  );
$$;

create or replace function public.allowed_upload_extension(object_name text)
returns boolean
language sql
stable
as $$
  select lower(coalesce(object_name, '')) ~ '\\.(pdf|mp4|mov|webm|mkv)$'
    and not (lower(coalesce(object_name, '')) ~ '\\.(exe|msi|bat|cmd|com|dll|scr|ps1|sh|php|phtml|js|mjs|cjs|html?|htm|svg)$');
$$;

create or replace function public.safe_storage_path(object_name text)
returns boolean
language sql
stable
as $$
  -- Basic traversal/hidden file guard for object names
  select object_name is not null
    and position('..' in object_name) = 0
    and object_name !~ '(^|/)[.]'
    and object_name !~ '[\\x00-\\x1f]';
$$;

-- =========================
-- 1) PROFILES: fix security_invoker view
-- =========================
-- Views can bypass RLS unless created with security_invoker=true (Postgres 15+).
-- Supabase is Postgres 15+, so we enforce it here.

drop view if exists public.profiles;
create view public.profiles
with (security_invoker = true)
as
select
  id,
  email,
  role,
  created_at,
  updated_at,
  full_name,
  phone
from public.users;

-- =========================
-- 2) DATABASE GRANTS (minimize anon key blast radius)
-- =========================
-- RLS is the main guard, but explicit grants ensure anon key can't do damage
-- even if a policy is accidentally added later.

-- Revoke everything first (safe baseline)
revoke all on table public.users from anon, authenticated;
revoke all on table public.security_logs from anon, authenticated;
revoke all on table public.admin_logs from anon, authenticated;

revoke all on table public.curriculums from anon, authenticated;
revoke all on table public.lessons from anon, authenticated;
revoke all on table public.files from anon, authenticated;
revoke all on table public.video_links from anon, authenticated;

-- Public educational content: allow read-only.
grant select on table public.curriculums to anon, authenticated;
grant select on table public.lessons to anon, authenticated;
grant select on table public.files to anon, authenticated;
grant select on table public.video_links to anon, authenticated;

-- Profiles: allow authenticated users to read their own row (via RLS) and update their own profile fields.
grant select, insert, update on table public.users to authenticated;

-- Admin-only tables: read only for admin via RLS (grant select to authenticated; RLS restricts).
grant select on table public.security_logs to authenticated;
grant select, insert on table public.admin_logs to authenticated;

-- =========================
-- 3) FIX/REPLACE insecure policies (explicit roles + least privilege)
-- =========================

-- ---- public.users (profiles) ----
drop policy if exists "users can read own profile" on public.users;
create policy "users can read own profile"
on public.users
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "users can insert own profile" on public.users;
create policy "users can insert own profile"
on public.users
for insert
to authenticated
with check (auth.uid() = id);

-- From phase-3-user-profile.sql: users can update own profile
drop policy if exists "users can update own profile" on public.users;
create policy "users can update own profile"
on public.users
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "admins can manage users" on public.users;
create policy "admins can manage users"
on public.users
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- ---- public.curriculums / lessons: allow public read of published only ----
drop policy if exists "authenticated can read curriculums" on public.curriculums;
drop policy if exists "authenticated can read published curriculums" on public.curriculums;
create policy "public can read published curriculums"
on public.curriculums
for select
to anon, authenticated
using (is_published = true);

create policy "admins can read all curriculums"
on public.curriculums
for select
to authenticated
using (public.is_admin());

drop policy if exists "admins manage curriculums" on public.curriculums;
create policy "admins manage curriculums"
on public.curriculums
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "authenticated can read lessons" on public.lessons;
drop policy if exists "authenticated can read published lessons" on public.lessons;
create policy "public can read published lessons"
on public.lessons
for select
to anon, authenticated
using (is_published = true);

create policy "admins can read all lessons"
on public.lessons
for select
to authenticated
using (public.is_admin());

drop policy if exists "admins manage lessons" on public.lessons;
create policy "admins manage lessons"
on public.lessons
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- ---- public.files: public can read files ONLY for published lessons/curriculums ----
drop policy if exists "authenticated can read files" on public.files;
drop policy if exists "authenticated can read files metadata" on public.files;
create policy "public can read files for published lessons"
on public.files
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.lessons l
    join public.curriculums c on c.id = l.curriculum_id
    where l.id = files.lesson_id
      and l.is_published = true
      and c.is_published = true
  )
);

create policy "admins can read all files"
on public.files
for select
to authenticated
using (public.is_admin());

drop policy if exists "admins manage files" on public.files;
create policy "admins manage files"
on public.files
for insert, update, delete
to authenticated
using (public.is_admin())
with check (
  public.is_admin()
  and (mime_type is null or public.allowed_upload_mime(mime_type))
);

-- ---- public.video_links: public read only; admin manage ----
drop policy if exists "authenticated can read video links" on public.video_links;
create policy "public can read video links for published lessons"
on public.video_links
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.lessons l
    join public.curriculums c on c.id = l.curriculum_id
    where l.id = video_links.lesson_id
      and l.is_published = true
      and c.is_published = true
  )
);

create policy "admins can read all video links"
on public.video_links
for select
to authenticated
using (public.is_admin());

drop policy if exists "admins manage video links" on public.video_links;
create policy "admins manage video links"
on public.video_links
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- ---- admin_logs: admin-only ----
drop policy if exists "admins read logs" on public.admin_logs;
create policy "admins read logs"
on public.admin_logs
for select
to authenticated
using (public.is_admin());

drop policy if exists "admins write logs" on public.admin_logs;
create policy "admins write logs"
on public.admin_logs
for insert
to authenticated
with check (public.is_admin());

-- ---- security_logs: admin read only, no client writes (service_role bypasses RLS) ----
drop policy if exists "admins read security_logs" on public.security_logs;
create policy "admins read security_logs"
on public.security_logs
for select
to authenticated
using (public.is_admin());

-- =========================
-- 4) STORAGE: lock bucket + validate extension + MIME
-- =========================

-- Ensure private bucket exists and is private
insert into storage.buckets (id, name, public)
values ('alend-files-private', 'alend-files-private', false)
on conflict (id) do update set public = false;

-- Optional: force old bucket private (defense in depth)
update storage.buckets set public = false where id = 'alend-files';

-- Storage RLS on objects is enabled by default on Supabase projects, but keep explicit.
alter table storage.objects enable row level security;

-- Remove any pre-existing permissive policies for our bucket(s)
drop policy if exists "private bucket deny select to direct clients" on storage.objects;
drop policy if exists "private bucket deny anon select" on storage.objects;
drop policy if exists "admins insert private objects" on storage.objects;
drop policy if exists "admins update private objects" on storage.objects;
drop policy if exists "admins delete private objects" on storage.objects;

-- 4.1) Deny anon/authenticated direct listing/downloading of private bucket objects.
create policy "deny select for private bucket"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'alend-files-private' and false);
-- Note: deny direct SELECT for the private bucket. Access should be via signed URLs (server-side).

-- 4.2) Admin-only uploads/updates/deletes in private bucket, with extension + MIME validation.
create policy "admins insert objects with mime+ext validation"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'alend-files-private'
  and public.is_admin()
  and public.safe_storage_path(name)
  and public.allowed_upload_extension(name)
  and public.allowed_upload_mime(coalesce((metadata->>'mimetype'), (metadata->>'contentType')))
);

create policy "admins update objects with mime+ext validation"
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
  and public.safe_storage_path(name)
  and public.allowed_upload_extension(name)
  and public.allowed_upload_mime(coalesce((metadata->>'mimetype'), (metadata->>'contentType')))
);

create policy "admins delete objects"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'alend-files-private'
  and public.is_admin()
);

commit;

