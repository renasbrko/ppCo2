# Secure Content Setup

This project now includes secure storage/content protection primitives.

## 1) Apply SQL

Run both files in Supabase SQL editor:

1. `supabase/phase-1-schema.sql`
2. `supabase/phase-2-storage-security.sql`

## 2) Deploy Edge Function

Function path:

- `supabase/functions/secure-content/index.ts`

Deploy using Supabase CLI:

```bash
supabase functions deploy secure-content
```

Required function secrets:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## 3) Client usage

### Get signed PDF URL

Call function with user access token:

```json
{
  "action": "get_pdf_url",
  "fileId": "<uuid>"
}
```

Response:

```json
{
  "signedUrl": "https://...",
  "expiresIn": 300
}
```

### Create signed upload URL (admin only)

```json
{
  "action": "create_upload_url",
  "path": "curriculum/math/books/1710000000_file.pdf",
  "mimeType": "application/pdf",
  "sizeBytes": 123456
}
```

## 4) Built-in security controls

- Private bucket enforced (`alend-files-private`)
- Direct object reads denied by RLS
- Signed URLs only for PDF delivery
- Signed uploads only for admins
- Validation for path, mime type, file size
- Basic request rate limiting in function
- Admin audit logging in `admin_logs`
- Unified JSON error responses

## 5) Frontend content protection

`js/content-protection.js` adds:

- Right-click disable
- Common save/inspect shortcut blocking
- Dynamic watermark overlay (email, user id, timestamp)
- Safer YouTube embed conversion via `youtube-nocookie` and reduced controls

These controls deter casual copying but do not provide perfect DRM.

