(function () {
  const SUPABASE_CDN = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
  let supabaseClient = null;

  function getConfig() {
    const cfg = window.ALEND_SUPABASE_CONFIG || {};
    return {
      url: cfg.url || "",
      anonKey: cfg.anonKey || "",
      siteUrl: cfg.siteUrl || window.location.origin,
      adminEmail: (cfg.adminEmail || "").toLowerCase()
    };
  }

  function safeUrl(value) {
    try {
      return new URL(value).toString().replace(/\/+$/, "");
    } catch {
      return "";
    }
  }

  function getAppBaseUrl() {
    const cfg = getConfig();
    const runtimeOrigin = safeUrl(window.location.origin);
    const configured = safeUrl(cfg.siteUrl);
    return runtimeOrigin || configured || "";
  }

  function hasValidConfig() {
    const cfg = getConfig();
    return cfg.url.startsWith("https://") && cfg.anonKey.length > 20;
  }

  function getDeviceHint() {
    try {
      return (navigator.userAgent || "").slice(0, 240);
    } catch {
      return "";
    }
  }

  async function loadSupabaseLib() {
    if (window.supabase?.createClient) return;
    await new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${SUPABASE_CDN}"]`);
      if (existing) {
        existing.addEventListener("load", () => resolve(), { once: true });
        return;
      }
      const script = document.createElement("script");
      script.src = SUPABASE_CDN;
      script.async = true;
      script.onload = resolve;
      script.onerror = () => reject(new Error("Failed to load Supabase library"));
      document.head.appendChild(script);
    });
  }

  async function init() {
    if (supabaseClient) return supabaseClient;
    if (!hasValidConfig()) return null;

    await loadSupabaseLib();
    const cfg = getConfig();

    supabaseClient = window.supabase.createClient(cfg.url, cfg.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });

    return supabaseClient;
  }

  async function getSession() {
    const client = await init();
    if (!client) return null;
    const { data, error } = await client.auth.getSession();
    if (error) return null;
    return data.session || null;
  }

  async function getUser() {
    const session = await getSession();
    return session?.user || null;
  }

  function isEmailVerified(user) {
    if (!user) return false;
    return !!user.email_confirmed_at;
  }

  /**
   * Report auth/security events to Edge Function (no tokens in body).
   */
  async function reportSecurityEvent(payload, accessToken) {
    const cfg = getConfig();
    if (!cfg.url || !cfg.anonKey) return;
    const fnUrl = `${cfg.url.replace(/\/+$/, "")}/functions/v1/log-auth-event`;
    const headers = {
      "Content-Type": "application/json",
      apikey: cfg.anonKey
    };
    headers.Authorization = accessToken ? `Bearer ${accessToken}` : `Bearer ${cfg.anonKey}`;
    try {
      await fetch(fnUrl, {
        method: "POST",
        headers,
        body: JSON.stringify({
          event_type: payload.event_type,
          email_attempt: payload.email_attempt || null,
          success: !!payload.success,
          device_hint: payload.device_hint || getDeviceHint()
        })
      });
    } catch {
      /* non-fatal */
    }
  }

  function mapAuthError(error) {
    if (!error) return "هەڵەی نەناسراو.";
    const msg = (error.message || "").toLowerCase();
    const code = error.code || "";

    if (msg.includes("already registered") || msg.includes("user already") || code === "signup_disabled") {
      return "ئەم ئیمەیڵە پێشتر تۆمارکراوە.";
    }
    if (
      msg.includes("invalid login") ||
      msg.includes("invalid credentials") ||
      msg.includes("email not confirmed") ||
      msg.includes("not confirmed")
    ) {
      return "ئیمەیڵ یان تێپەڕەوشە هەڵەیە، یان هەژمارەکەت هێشتا پشتڕاست نەکراوەتەوە.";
    }
    if (msg.includes("password")) {
      return "تێپەڕەوشە پێویستە بەهێز بێت (8+ پیت، پیتی گەورە و بچووک، ژمارە).";
    }
    if (msg.includes("email")) {
      return "ئیمەیڵەکە دروست بنووسە.";
    }
    return error.message || "داواکاری سەرکەوتوو نەبوو.";
  }

  async function syncPublicUserRow(user) {
    const client = await init();
    if (!client || !user?.id || !user.email) return;

    const meta = user.user_metadata || {};
    const fullName = (meta.full_name || meta.fullName || "").trim() || null;
    const phone = (meta.phone || "").trim() || null;
    const cfg = getConfig();
    const updatedAt = new Date().toISOString();

    const { data: existing } = await client.from("users").select("role").eq("id", user.id).maybeSingle();
    let role = "student";
    if (existing?.role === "admin") role = "admin";
    else if (user.email?.toLowerCase() === cfg.adminEmail && cfg.adminEmail) role = "admin";

    const { error: upsertErr } = await client.from("users").upsert(
      { id: user.id, email: user.email, role, updated_at: updatedAt },
      { onConflict: "id" }
    );
    if (upsertErr) {
      console.warn("users upsert:", upsertErr.message);
      return;
    }

    if (fullName || phone) {
      const { error: patchErr } = await client
        .from("users")
        .update({ full_name: fullName, phone: phone, updated_at: updatedAt })
        .eq("id", user.id);
      if (patchErr && !/full_name|phone|column/i.test(String(patchErr.message || ""))) {
        console.warn("users profile patch:", patchErr.message);
      }
    }
  }

  async function isUserAdmin(user) {
    if (!user?.email) return false;
    const cfg = getConfig();
    if (user.email.toLowerCase() === cfg.adminEmail && cfg.adminEmail) return true;
    const client = await init();
    if (!client) return false;
    const { data } = await client.from("users").select("role").eq("id", user.id).maybeSingle();
    return data?.role === "admin";
  }

  async function signInWithEmailPassword(email, password, opts) {
    const options = opts && typeof opts === "object" ? opts : {};
    const failEventType = options.securityContext === "admin" ? "admin_login_failed" : "login_failed";

    const client = await init();
    if (!client) throw new Error("ڕێکخستنی Supabase نەدۆزرایەوە.");

    const trimmedEmail = String(email || "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      throw new Error("ئیمەیڵەکە دروست بنووسە.");
    }
    if (!password || password.length < 1) {
      throw new Error("تێپەڕەوشە بنووسە.");
    }

    const { data, error } = await client.auth.signInWithPassword({
      email: trimmedEmail,
      password
    });

    if (error) {
      await reportSecurityEvent(
        { event_type: failEventType, email_attempt: trimmedEmail, success: false },
        null
      );
      throw new Error(mapAuthError(error));
    }

    if (data.user && !isEmailVerified(data.user)) {
      await signOutLocal();
      await reportSecurityEvent(
        { event_type: "login_unverified_email", email_attempt: trimmedEmail, success: false },
        null
      );
      throw new Error(
        "تکایە سەرەتا ئیمەیڵەکەت پشتڕاست بکەرەوە (لینکی نێرراو بەکاربهێنە) پێش چوونەژوورەوە."
      );
    }

    if (data.user) await syncPublicUserRow(data.user);
    if (data.session?.access_token) {
      await reportSecurityEvent(
        {
          event_type: "login_success",
          email_attempt: data.user.email,
          success: true
        },
        data.session.access_token
      );
    }

    return data;
  }

  function validatePasswordStrength(password) {
    if (!password || password.length < 8) return "تێپەڕەوشە لانیکەم 8 پیت بێت.";
    if (!/[a-z]/.test(password)) return "لانیکەم یەک پیتی بچووک بنووسە.";
    if (!/[A-Z]/.test(password)) return "لانیکەم یەک پیتی گەورە بنووسە.";
    if (!/[0-9]/.test(password)) return "لانیکەم یەک ژمارە بنووسە.";
    return null;
  }

  function validatePhone(phone) {
    const p = String(phone || "").trim().replace(/\s/g, "");
    if (!p) return "ژمارەی مۆبایل بنووسە.";
    if (!/^\+?[0-9]{10,15}$/.test(p)) return "ژمارەی مۆبایل دروست بنووسە (10–15 ژمارە، دەتوانێت + بێت).";
    return null;
  }

  async function signUpWithEmail({ fullName, email, phone, password }) {
    const client = await init();
    if (!client) throw new Error("ڕێکخستنی Supabase نەدۆزرایەوە.");

    const name = String(fullName || "").trim();
    if (name.length < 2) throw new Error("ناوی تەواو بنووسە (لانیکەم 2 پیت).");

    const trimmedEmail = String(email || "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      throw new Error("ئیمەیڵەکە دروست بنووسە.");
    }

    const phoneErr = validatePhone(phone);
    if (phoneErr) throw new Error(phoneErr);

    const passErr = validatePasswordStrength(password);
    if (passErr) throw new Error(passErr);

    const appBase = getAppBaseUrl();
    const emailRedirectTo = appBase ? `${appBase}/login.html` : undefined;

    const { data, error } = await client.auth.signUp({
      email: trimmedEmail,
      password,
      options: {
        emailRedirectTo,
        data: {
          full_name: name,
          phone: String(phone).trim().replace(/\s/g, "")
        }
      }
    });

    if (error) throw new Error(mapAuthError(error));

    if (data.user && data.session) {
      if (!isEmailVerified(data.user)) {
        await signOutLocal();
        return { ...data, session: null };
      }
      await syncPublicUserRow(data.user);
    }

    return data;
  }

  async function signOutLocal() {
    const client = await init();
    if (!client) return;
    await client.auth.signOut();
  }

  async function signOut() {
    await signOutLocal();
    const appBase = getAppBaseUrl();
    window.location.href = `${appBase}/login.html`;
  }

  async function requireAuth() {
    const session = await getSession();
    if (!session?.user) {
      const appBase = getAppBaseUrl();
      const current = window.location.pathname + window.location.search + window.location.hash;
      localStorage.setItem("alend_auth_return_to", current);
      window.location.href = `${appBase}/login.html`;
      return;
    }
    if (!isEmailVerified(session.user)) {
      await signOutLocal();
      const appBase = getAppBaseUrl();
      window.location.href = `${appBase}/login.html?reason=unverified`;
    }
  }

  async function requireAdmin() {
    await requireAuth();
    const session = await getSession();
    const user = session?.user;
    if (!user || !(await isUserAdmin(user))) {
      const appBase = getAppBaseUrl();
      window.location.href = `${appBase}/index.html`;
    }
  }

  function consumeReturnTo() {
    const value = localStorage.getItem("alend_auth_return_to");
    if (!value) return null;
    localStorage.removeItem("alend_auth_return_to");
    return value;
  }

  window.AlendAuth = {
    init,
    getSession,
    getUser,
    isEmailVerified,
    isUserAdmin,
    signInWithEmailPassword,
    signUpWithEmail,
    mapAuthError,
    validatePasswordStrength,
    validatePhone,
    syncPublicUserRow,
    reportSecurityEvent,
    signOutLocal,
    signOut,
    requireAuth,
    requireAdmin,
    consumeReturnTo
  };
})();
