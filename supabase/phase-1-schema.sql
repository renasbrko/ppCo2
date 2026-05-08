-- Phase 1 schema for secure full-stack migration.
-- Run in Supabase SQL editor.

create extension if not exists "pgcrypto";

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  role text not null default 'student' check (role in ('student', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.curriculums (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  grade_level text not null,
  is_published boolean not null default true,
  created_by uuid references public.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  curriculum_id uuid not null references public.curriculums(id) on delete cascade,
  title text not null,
  description text,
  sort_order int not null default 0,
  is_published boolean not null default true,
  created_by uuid references public.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.files (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  storage_bucket text not null default 'alend-files',
  storage_path text not null,
  title text not null,
  description text,
  mime_type text,
  size_bytes bigint,
  created_by uuid references public.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.video_links (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  youtube_url text not null,
  is_unlisted boolean not null default true,
  title text not null,
  description text,
  created_by uuid references public.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.admin_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.users(id),
  action text not null,
  target_type text not null,
  target_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.users enable row level security;
alter table public.curriculums enable row level security;
alter table public.lessons enable row level security;
alter table public.files enable row level security;
alter table public.video_links enable row level security;
alter table public.admin_logs enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.users u
    where u.id = auth.uid() and u.role = 'admin'
  );
$$;

create policy "users can read own profile"
on public.users
for select
using (auth.uid() = id);

create policy "users can insert own profile"
on public.users
for insert
with check (auth.uid() = id);

create policy "admins can manage users"
on public.users
for all
using (public.is_admin())
with check (public.is_admin());

create policy "authenticated can read curriculums"
on public.curriculums
for select
using (auth.uid() is not null and is_published = true);

create policy "admins manage curriculums"
on public.curriculums
for all
using (public.is_admin())
with check (public.is_admin());

create policy "authenticated can read lessons"
on public.lessons
for select
using (auth.uid() is not null and is_published = true);

create policy "admins manage lessons"
on public.lessons
for all
using (public.is_admin())
with check (public.is_admin());

create policy "authenticated can read files"
on public.files
for select
using (auth.uid() is not null);

create policy "admins manage files"
on public.files
for all
using (public.is_admin())
with check (public.is_admin());

create policy "authenticated can read video links"
on public.video_links
for select
using (auth.uid() is not null);

create policy "admins manage video links"
on public.video_links
for all
using (public.is_admin())
with check (public.is_admin());

create policy "admins read logs"
on public.admin_logs
for select
using (public.is_admin());

create policy "admins write logs"
on public.admin_logs
for insert
with check (public.is_admin());
