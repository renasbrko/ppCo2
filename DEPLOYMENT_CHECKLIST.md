# Vercel Deployment Checklist

## 1) Pre-deploy cleanup

- [ ] Ensure `js/env.js` contains production values (or generate it in CI before deploy).
- [ ] Confirm `js/env.js` does **not** contain `service_role` keys.
- [ ] Confirm Supabase SQL migrations are applied:
  - `supabase/phase-1-schema.sql`
  - `supabase/phase-2-storage-security.sql`
  - `supabase/phase-3-user-profile.sql` (recommended: `full_name`, `phone`, own-profile updates)
  - `supabase/phase-4-security-logs.sql` (`security_logs`, login audit columns on `users`)
- [ ] Deploy Edge Functions:
  - `supabase/functions/secure-content/index.ts`
  - `supabase/functions/log-auth-event/index.ts` (use `--no-verify-jwt`; see `supabase/ADMIN_AND_EMAIL_SETUP.md`)

## 2) Vercel project setup

- [ ] Import this repository as a Vercel project.
- [ ] Framework preset: **Other** (static site).
- [ ] Root directory: project root (`alend-platform`).
- [ ] Confirm `vercel.json` is detected.

## 3) Environment variable strategy

This project is static HTML/JS, so browser values must be in `js/env.js`.

Required public browser values:

- `ALEND_SUPABASE_CONFIG.url`
- `ALEND_SUPABASE_CONFIG.anonKey`
- `ALEND_SUPABASE_CONFIG.siteUrl`
- `ALEND_SUPABASE_CONFIG.adminEmail`

Secret server-only values (NEVER in frontend):

- `SUPABASE_SERVICE_ROLE_KEY` (Edge Function secret only)
- Any admin/service tokens

## 4) Supabase security checks

- [ ] Bucket `alend-files-private` is private (`public = false`).
- [ ] No public direct storage read policy for authenticated users.
- [ ] Signed URL flow works for PDFs via `secure-content`.
- [ ] Admin uploads only via signed upload token.
- [ ] `users.role` properly set (`student` / `admin`).

## 5) Authentication and route checks

- [ ] Supabase **Email** provider enabled (Authentication → Providers → Email).
- [ ] Site URL set to production (e.g. `https://pp-co2.vercel.app`) and redirect URLs include `https://pp-co2.vercel.app/login.html`.
- [ ] `/login.html` loads: register (full name, email, phone, password) and sign-in work.
- [ ] If **Confirm email** is enabled, new users complete verification then can sign in.
- [ ] Unauthenticated user visiting protected route gets redirected to login.
- [ ] Authenticated user can access curriculum pages.
- [ ] Non-admin users cannot access admin-only actions.

## 6) Admin account safety

- [ ] Keep only your trusted email as admin in `public.users`.
- [ ] Remove accidental admin rows immediately.
- [ ] Use SQL to enforce admin assignment intentionally:

```sql
update public.users
set role = case
  when email = 'your-email@example.com' then 'admin'
  else 'student'
end;
```

- [ ] Periodically review `public.admin_logs`.

## 7) Frontend QA before production

- [ ] Mobile widths: 320, 360, 390, 768
- [ ] No horizontal scrolling
- [ ] Navbar open/close behavior is stable
- [ ] Footer layout stable on all pages
- [ ] No visible JS runtime errors in browser console

