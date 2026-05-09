# Email / password auth (Supabase)

OAuth (Google / Apple) has been removed from the frontend. Use **Email** authentication only.

## Supabase dashboard

**Project:** `wezuhzjatooyimnpibmv` (region `ap-northeast-1`)

1. **Authentication → Providers → Email**  
   - Enable Email provider.  
   - Choose whether **Confirm email** is required (recommended for production).

2. **Authentication → URL Configuration**  
   - **Site URL:** `https://pp-co2.vercel.app`  
   - **Redirect URLs** (add at least):  
     - `https://pp-co2.vercel.app/login.html`  
     - `http://localhost:3000/login.html` (local dev, if used)

3. **Optional SQL**  
   - Run `phase-3-user-profile.sql` so `public.users` can store `full_name` and `phone` after registration.

## Duplicate accounts

Supabase rejects sign-up when the email is already registered. The client maps that error to a clear Kurdish message.

## Frontend config

In `js/env.js`, set:

- `url` → `https://wezuhzjatooyimnpibmv.supabase.co` (or your project URL from the Supabase API settings)
- `anonKey` → anon (publishable) key only
- `siteUrl` → `https://pp-co2.vercel.app` (should match Site URL for predictable `emailRedirectTo` on sign-up)

Do **not** put the service role key in `js/env.js`.
