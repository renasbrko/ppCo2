-- Optional: profile fields for email registration (full name, phone).
-- Run after phase-1-schema.sql.

alter table public.users
  add column if not exists full_name text,
  add column if not exists phone text;

drop policy if exists "users can update own profile" on public.users;
create policy "users can update own profile"
on public.users
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);
