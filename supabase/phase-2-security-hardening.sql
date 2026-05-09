-- Phase 2: Admin security hardening + strict RLS
-- Run after phase-1-schema.sql and phase-3-user-profile.sql.

-- 1) Ensure the required admin email is always admin.
update public.users
set role = 'admin', updated_at = now()
where lower(email) = lower('Renasbrko1@gmail.com');

create or replace function public.assign_admin_role_by_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if lower(new.email) = lower('Renasbrko1@gmail.com') then
    new.role := 'admin';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_assign_admin_role_by_email on public.users;
create trigger trg_assign_admin_role_by_email
before insert or update of email on public.users
for each row
execute function public.assign_admin_role_by_email();

-- 2) Security logs for abuse detection and admin auth monitoring.
create table if not exists public.security_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  event_type text not null,
  success boolean not null default false,
  user_id uuid references auth.users(id) on delete set null,
  email_attempt text,
  ip_address text,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists idx_security_logs_created_at on public.security_logs (created_at desc);
create index if not exists idx_security_logs_type_time on public.security_logs (event_type, created_at desc);
create index if not exists idx_security_logs_ip_time on public.security_logs (ip_address, created_at desc);

alter table public.security_logs enable row level security;

drop policy if exists "admins read security_logs" on public.security_logs;
create policy "admins read security_logs"
on public.security_logs
for select
to authenticated
using (public.is_admin());

-- write access should be server-side (Edge Function with service role key).
drop policy if exists "clients write security_logs" on public.security_logs;

-- 3) Tighten application RLS explicitly (no permissive true checks).
drop policy if exists "authenticated can read curriculums" on public.curriculums;
create policy "authenticated can read published curriculums"
on public.curriculums
for select
to authenticated
using (is_published = true);

drop policy if exists "admins manage curriculums" on public.curriculums;
create policy "admins manage curriculums"
on public.curriculums
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "authenticated can read lessons" on public.lessons;
create policy "authenticated can read published lessons"
on public.lessons
for select
to authenticated
using (is_published = true);

drop policy if exists "admins manage lessons" on public.lessons;
create policy "admins manage lessons"
on public.lessons
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "authenticated can read files metadata" on public.files;
drop policy if exists "authenticated can read files" on public.files;
create policy "authenticated can read files"
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

drop policy if exists "authenticated can read video links" on public.video_links;
create policy "authenticated can read video links"
on public.video_links
for select
to authenticated
using (true);

drop policy if exists "admins manage video links" on public.video_links;
create policy "admins manage video links"
on public.video_links
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- "profiles" compatibility view for systems expecting profiles.role.
create or replace view public.profiles as
select
  id,
  email,
  role,
  created_at,
  updated_at,
  full_name,
  phone
from public.users;
