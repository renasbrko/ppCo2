# Admin account, email verification, and security alerts

## 1) Enable email verification (Supabase Dashboard)

1. Open **Authentication → Providers → Email**.
2. Turn **Confirm email** ON (required for the app’s gate: users without `email_confirmed_at` cannot access protected pages).
3. Under **Authentication → URL Configuration**:
   - **Site URL**: your production origin, e.g. `https://pp-co2.vercel.app`
   - **Redirect URLs**: add at least:
     - `https://pp-co2.vercel.app/login.html`
     - `http://localhost:*/login.html` (optional, for local testing)

Sign-up from the app uses `emailRedirectTo` → `{siteUrl}/login.html` so the confirmation link returns users to the login page.

## 2) Customize email templates

1. **Authentication → Email Templates**.
2. Edit **Confirm signup**, **Magic Link**, **Change Email Address**, etc.
3. Templates support `{{ .ConfirmationURL }}` and other variables documented in Supabase.

Branding and copy are controlled only here (not in the static frontend).

## 3) Bootstrap an admin (no passwords in the repo)

1. In **Authentication → Users**, create a user (or use an existing account) with a strong password you choose in the Dashboard.
2. Ensure a row exists in `public.users` (the user should sign in once from `/login.html` so `syncPublicUserRow` runs, or insert manually matching `auth.users.id`).
3. Grant admin:

```sql
update public.users
set role = 'admin', updated_at = now()
where lower(email) = lower('your-admin@example.com');
```

4. Set `adminEmail` in `js/env.js` to the same address. This value is public (it is in the browser bundle); real protection is **`public.users.role = 'admin'`** and RLS.

**Change password later:** Authentication → Users → select user → reset password, or use the normal “Forgot password” / Dashboard reset flow. Do not store service-role keys or passwords in the frontend.

## 4) Deploy `log-auth-event` Edge Function

From the `alend-platform` folder (with Supabase CLI logged in):

```bash
supabase functions deploy log-auth-event --no-verify-jwt
```

JWT verification must be **off** for this function so failed logins (no user JWT) can still be logged. The function only inserts rows using the **service role** secret configured in Supabase (never in the browser).

### Secrets (Supabase → Project Settings → Edge Functions → Secrets)

| Name | Purpose |
|------|---------|
| `SUPABASE_URL` | Usually auto-provided |
| `SUPABASE_ANON_KEY` | Usually auto-provided |
| `SUPABASE_SERVICE_ROLE_KEY` | Required for inserting `security_logs` and updating `users` login fields |
| `RESEND_API_KEY` | Optional; for email alerts |
| `RESEND_FROM` | Optional; e.g. `Alend <onboarding@resend.dev>` |
| `ALERT_TO_EMAIL` | Optional; Gmail or any inbox to receive alerts |

If Resend variables are omitted, logging still works; alert emails are skipped.

## 5) SQL: security logs and profile columns

Run in order:

- `supabase/phase-1-schema.sql`
- `supabase/phase-3-user-profile.sql` (if not already)
- `supabase/phase-4-security-logs.sql`

## 6) Gmail / Resend

Use [Resend](https://resend.com) (or another provider) to deliver to Gmail. Verify your sending domain or use Resend’s test domain per their docs. Set `RESEND_FROM` to an address your Resend project is allowed to send from.
