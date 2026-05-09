-- Phase 4: user login audit fields + security_logs (server-written via Edge Function).
-- Run after phase-1 and phase-3.

alter table public.users
  add column if not exists last_login_at timestamptz,
  add column if not exists last_login_ip text,
  add column if not exists device_info text;

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
create index if not exists idx_security_logs_ip_time on public.security_logs (ip_address, created_at desc);

alter table public.security_logs enable row level security;

drop policy if exists "admins read security_logs" on public.security_logs;
create policy "admins read security_logs"
on public.security_logs
for select
to authenticated
using (public.is_admin());

-- No client INSERT/UPDATE: rows are inserted only with service_role (Edge Function).
