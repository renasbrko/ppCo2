import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SRK = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const ANON = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const RESEND_FROM = Deno.env.get("RESEND_FROM") ?? "";
const ALERT_TO_EMAIL = Deno.env.get("ALERT_TO_EMAIL") ?? "";

const rateBucket = new Map<string, { n: number; t: number }>();

function rateOk(ip: string, limit: number, windowMs: number) {
  const now = Date.now();
  const b = rateBucket.get(ip);
  if (!b || now - b.t > windowMs) {
    rateBucket.set(ip, { n: 1, t: now });
    return true;
  }
  b.n += 1;
  return b.n <= limit;
}

function clientIp(req: Request) {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("cf-connecting-ip") || "unknown";
}

async function maybeSendAlert(subject: string, html: string) {
  if (!RESEND_API_KEY || !RESEND_FROM || !ALERT_TO_EMAIL) return;
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: RESEND_FROM,
        to: [ALERT_TO_EMAIL],
        subject,
        html,
      }),
    });
  } catch {
    /* non-fatal */
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const ip = clientIp(req);
  if (!rateOk(ip, 40, 60_000)) {
    return new Response(JSON.stringify({ error: "rate_limited" }), {
      status: 429,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!SUPABASE_URL || !SRK || !ANON) {
    return new Response(JSON.stringify({ error: "server_misconfigured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: {
    event_type?: string;
    email_attempt?: string | null;
    success?: boolean;
    device_hint?: string | null;
  };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "invalid_json" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const eventType = String(body.event_type || "unknown");
  const success = !!body.success;
  const emailAttempt = body.email_attempt ? String(body.email_attempt).slice(0, 320) : null;
  const ua = (req.headers.get("user-agent") || "").slice(0, 500);
  const deviceHint = body.device_hint ? String(body.device_hint).slice(0, 300) : null;
  const deviceInfo = deviceHint || ua.slice(0, 300);

  const admin = createClient(SUPABASE_URL, SRK);
  const userClient = createClient(SUPABASE_URL, ANON, {
    global: { headers: { Authorization: req.headers.get("Authorization") || "" } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let userId: string | null = null;
  const authHeader = req.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const { data: u } = await userClient.auth.getUser();
    if (u?.user?.id) userId = u.user.id;
  }

  const metadata: Record<string, unknown> = {};
  if (deviceHint) metadata.device_hint = deviceHint;

  const { error: insErr } = await admin.from("security_logs").insert({
    event_type: eventType,
    success,
    user_id: userId,
    email_attempt: emailAttempt,
    ip_address: ip,
    user_agent: ua,
    metadata,
  });

  if (insErr) {
    return new Response(JSON.stringify({ error: insErr.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (success && userId && (eventType === "login_success" || eventType === "admin_login_success")) {
    await admin
      .from("users")
      .update({
        last_login_at: new Date().toISOString(),
        last_login_ip: ip,
        device_info: deviceInfo,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);
  }

  // Lightweight alerts: burst failed admin logins or many failures from one IP
  if (!success && (eventType === "admin_login_failed" || eventType === "login_failed")) {
    const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { count } = await admin
      .from("security_logs")
      .select("id", { count: "exact", head: true })
      .eq("ip_address", ip)
      .eq("success", false)
      .gte("created_at", since);

    const n = count ?? 0;
    if (eventType === "admin_login_failed" && n >= 3) {
      await maybeSendAlert(
        `[Alend] Admin login failures (${ip})`,
        `<p><strong>Failures (10m):</strong> ${n}</p><p>IP: ${ip}</p><p>Email attempt: ${emailAttempt || "—"}</p>`,
      );
    } else if (n >= 12) {
      await maybeSendAlert(
        `[Alend] Many failed logins (${ip})`,
        `<p><strong>Failures (10m):</strong> ${n}</p><p>IP: ${ip}</p>`,
      );
    }
  }

  if (eventType === "unauthorized_admin_access") {
    await maybeSendAlert(
      `[Alend] Unauthorized admin attempt`,
      `<p>User id: ${userId || "none"}</p><p>IP: ${ip}</p><p>Email: ${emailAttempt || "—"}</p>`,
    );
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
