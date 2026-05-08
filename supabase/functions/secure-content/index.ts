import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const MAX_UPLOAD_BYTES = 25 * 1024 * 1024; // 25MB
const ALLOWED_UPLOAD_MIME = new Set(["application/pdf"]);
const PRIVATE_BUCKET = "alend-files-private";

const rateLimitState = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 30;

class ApiError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

function applyRateLimit(key: string) {
  const now = Date.now();
  const existing = rateLimitState.get(key);
  if (!existing || existing.resetAt <= now) {
    rateLimitState.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return;
  }

  existing.count += 1;
  if (existing.count > RATE_LIMIT_MAX_REQUESTS) {
    throw new ApiError(429, "rate_limited", "Too many requests. Try again later.");
  }
}

function safePath(input: string) {
  if (!input || typeof input !== "string") {
    throw new ApiError(400, "invalid_path", "Path is required.");
  }
  const cleaned = input.trim();
  if (cleaned.includes("..") || cleaned.startsWith("/") || cleaned.endsWith("/")) {
    throw new ApiError(400, "invalid_path", "Invalid storage path.");
  }
  return cleaned.replace(/[^a-zA-Z0-9/_\-.]/g, "_");
}

function validateUploadRequest(payload: Record<string, unknown>) {
  const path = safePath(String(payload.path ?? ""));
  const mimeType = String(payload.mimeType ?? "");
  const sizeBytes = Number(payload.sizeBytes ?? 0);

  if (!ALLOWED_UPLOAD_MIME.has(mimeType)) {
    throw new ApiError(400, "invalid_mime", "Only PDF uploads are allowed.");
  }
  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0 || sizeBytes > MAX_UPLOAD_BYTES) {
    throw new ApiError(400, "invalid_size", `Upload must be 1..${MAX_UPLOAD_BYTES} bytes.`);
  }

  return { path, mimeType, sizeBytes };
}

async function logEvent(
  adminClient: ReturnType<typeof createClient>,
  actorId: string | null,
  action: string,
  targetType: string,
  targetId: string | null,
  metadata: Record<string, unknown>,
) {
  await adminClient.from("admin_logs").insert({
    actor_id: actorId,
    action,
    target_type: targetType,
    target_id: targetId,
    metadata,
  });
}

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing Supabase function environment variables.");
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      throw new ApiError(405, "method_not_allowed", "Only POST is allowed.");
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      throw new ApiError(401, "unauthorized", "Missing bearer token.");
    }

    const ipKey = req.headers.get("x-forwarded-for") ?? "unknown-ip";
    applyRateLimit(ipKey);

    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const userClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData.user) {
      throw new ApiError(401, "unauthorized", "Invalid user session.");
    }

    const actorId = userData.user.id;
    const actorEmail = userData.user.email ?? "";

    const { data: profile, error: profileError } = await adminClient
      .from("users")
      .select("role")
      .eq("id", actorId)
      .maybeSingle();

    if (profileError || !profile) {
      throw new ApiError(403, "forbidden", "Missing user profile.");
    }

    const isAdmin = profile.role === "admin";
    const payload = await req.json();
    const action = String(payload?.action ?? "");

    if (action === "get_pdf_url") {
      const fileId = String(payload?.fileId ?? "");
      if (!fileId) throw new ApiError(400, "invalid_file", "fileId is required.");

      const { data: fileRow, error: fileError } = await adminClient
        .from("files")
        .select("id, storage_bucket, storage_path, mime_type")
        .eq("id", fileId)
        .single();

      if (fileError || !fileRow) {
        throw new ApiError(404, "file_not_found", "File not found.");
      }

      const bucket = fileRow.storage_bucket || PRIVATE_BUCKET;
      if ((fileRow.mime_type ?? "").toLowerCase() !== "application/pdf") {
        throw new ApiError(400, "not_pdf", "Requested file is not a PDF.");
      }

      const { data: signed, error: signError } = await adminClient.storage
        .from(bucket)
        .createSignedUrl(fileRow.storage_path, 60 * 5); // 5 minutes

      if (signError || !signed?.signedUrl) {
        throw new ApiError(500, "signed_url_failed", "Could not generate signed URL.");
      }

      await logEvent(adminClient, actorId, "signed_pdf_requested", "file", fileId, {
        bucket,
        email: actorEmail,
      });

      return json(200, { signedUrl: signed.signedUrl, expiresIn: 300 });
    }

    if (action === "create_upload_url") {
      if (!isAdmin) throw new ApiError(403, "forbidden", "Only admins can upload.");

      const validated = validateUploadRequest(payload);
      const { data: signedUpload, error: signedUploadError } = await adminClient.storage
        .from(PRIVATE_BUCKET)
        .createSignedUploadUrl(validated.path, {
          upsert: false,
        });

      if (signedUploadError || !signedUpload?.token) {
        throw new ApiError(500, "signed_upload_failed", "Could not generate signed upload URL.");
      }

      await logEvent(adminClient, actorId, "signed_upload_created", "storage_object", validated.path, {
        sizeBytes: validated.sizeBytes,
        mimeType: validated.mimeType,
      });

      return json(200, {
        path: validated.path,
        token: signedUpload.token,
        expiresIn: 120,
      });
    }

    throw new ApiError(400, "invalid_action", "Unsupported action.");
  } catch (err) {
    const apiErr = err instanceof ApiError
      ? err
      : new ApiError(500, "internal_error", "Unexpected error.");

    return json(apiErr.status, {
      error: {
        code: apiErr.code,
        message: apiErr.message,
      },
    });
  }
});

