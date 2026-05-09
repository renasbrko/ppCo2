# Supabase Migration - Phase 1

This phase adds secure auth foundations without rewriting the frontend.

## 1) Configure environment

1. Open `js/env.js`.
2. Replace:
   - `url`
   - `anonKey`
   - `adminEmail` (must be your email only)

## 2) Enable Email authentication

In Supabase dashboard:

1. Go to **Authentication → Providers → Email** and enable it.
2. Under **Authentication → URL Configuration**, set **Site URL** and **Redirect URLs** (see `supabase/EMAIL_AUTH_SETUP.md`).

## 3) Create database schema and RLS

Run `supabase/phase-1-schema.sql` in Supabase SQL editor.

## 4) Create your admin role record

After first login, run this SQL once (replace the email):

```sql
insert into public.users (id, email, role)
select id, email, 'admin'
from auth.users
where email = 'your-email@example.com'
on conflict (id) do update set role = excluded.role;
```

## 5) What is now protected

- `login.html` handles email + password sign-in and registration.
- Educational pages are guarded by auth bootstrap in `js/theme.js`.
- `admin.html` now expects Supabase authenticated admin email.

## 6) Next phase

Implement secure file upload flow with signed URLs, admin-only mutations, and storage policies.
