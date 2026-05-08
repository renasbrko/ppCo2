# Google OAuth Fix Notes

Project:

- Supabase Project ID: `wezuhzjatooyimnpibmv`
- Region: `ap-northeast-1`

## Why Google OAuth was failing

The frontend previously used a rigid redirect target that could mismatch active runtime domains (localhost, Vercel preview, production).  
When Supabase provider redirect allowlist does not exactly match `redirectTo`, Google sign-in fails or loops.

## Implemented fix

- OAuth now redirects to:
  - `<current-origin>/login.html?oauth=callback`
- Return path is stored before redirect and consumed after login (`alend_auth_return_to`), so post-login navigation is stable.
- Session persistence is kept with Supabase client:
  - `persistSession: true`
  - `autoRefreshToken: true`
  - `detectSessionInUrl: true`

## Supabase dashboard checks (required)

In Supabase -> Authentication -> URL Configuration:

- Site URL:
  - Your production Vercel domain (example: `https://your-app.vercel.app`)
- Redirect URLs (add all exact values you use):
  - `https://your-app.vercel.app/login.html`
  - `https://your-app.vercel.app/login.html?oauth=callback`
  - `http://localhost:3000/login.html`
  - `http://localhost:3000/login.html?oauth=callback`

In Supabase -> Authentication -> Providers -> Google:

- Provider enabled
- Correct Google OAuth Client ID/Secret from Google Cloud
- Authorized redirect URI in Google Cloud must include Supabase callback shown in provider settings

## Vercel compatibility

- Ensure `ALEND_SUPABASE_CONFIG.siteUrl` in `js/env.js` equals your production domain.
- Runtime redirect now prefers current origin, reducing preview/prod mismatch.

