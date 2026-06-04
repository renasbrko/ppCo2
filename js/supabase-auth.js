(function () {
  const SUPABASE_CDN = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
  let supabaseClient = null;

  function getLang() {
    const raw = (localStorage.getItem("alend_lang") || "ku").toLowerCase();
    return raw === "ar" ? "ar" : "ku";
  }

  function t(key) {
    const lang = getLang();
    const dict = {
      ku: {
        err_unknown: "هەڵەی نەناسراو.",
        err_config_missing:
          "ڕێکخستنی Supabase تەواو نییە. تکایە `js/env.js` ڕاست بکە و `anonKey` دابنێ.",
        err_email_invalid: "ئیمەیڵەکە دروست بنووسە.",
        err_password_required: "تێپەڕەوشە بنووسە.",
        err_password_strength: "تێپەڕەوشە پێویستە بەهێز بێت (8+ پیت، پیتی گەورە و بچووک، ژمارە).",
        err_phone_required: "ژمارەی مۆبایل بنووسە.",
        err_phone_invalid: "ژمارەی مۆبایل دروست بنووسە (10–15 ژمارە، دەتوانێت + بێت).",
        err_name_required: "ناوی تەواو بنووسە (لانیکەم 2 پیت).",
        err_passwords_mismatch: "تێپەڕەوشەکان یەک ناگرنەوە.",
        err_email_exists: "ئەم ئیمەیڵە پێشتر تۆمارکراوە.",
        err_invalid_login: "ئیمەیڵ یان تێپەڕەوشە هەڵەیە.",
        err_network: "کێشەیەک هەیە لە پەیوەندی بە سێرڤەر. تکایە دووبارە هەوڵ بدەوە.",
        err_rate_limited: "زۆر هەوڵدان. تکایە کەمێک چاوەڕێ بکە پاشان دووبارە هەوڵ بدەوە."
      },
      ar: {
        err_unknown: "حدث خطأ غير معروف.",
        err_config_missing:
          "إعدادات Supabase غير مكتملة. عدّل ملف `js/env.js` وضع قيمة `anonKey` الصحيحة.",
        err_email_invalid: "اكتب بريدًا إلكترونيًا صحيحًا.",
        err_password_required: "اكتب كلمة المرور.",
        err_password_strength: "كلمة المرور يجب أن تكون قوية (8+ أحرف، حرف كبير وصغير، رقم).",
        err_phone_required: "اكتب رقم الهاتف.",
        err_phone_invalid: "اكتب رقم هاتف صحيح (10–15 رقمًا ويمكن أن يبدأ بـ +).",
        err_name_required: "اكتب الاسم الكامل (حرفان على الأقل).",
        err_passwords_mismatch: "كلمتا المرور غير متطابقتين.",
        err_email_exists: "هذا البريد مسجّل مسبقًا.",
        err_invalid_login: "البريد أو كلمة المرور غير صحيحة.",
        err_network: "مشكلة في الاتصال بالخادم. حاول مرة أخرى.",
        err_rate_limited: "محاولات كثيرة. انتظر قليلًا ثم حاول مرة أخرى."
      }
    };

    return (dict[lang] && dict[lang][key]) || dict.ku[key] || key;
  }

  function getConfig() {
    const cfg = window.ALEND_SUPABASE_CONFIG || {};
    const defaultAdmin = "renasbrko1@gmail.com";
    return {
      url: cfg.url || "",
      anonKey: cfg.anonKey || "",
      siteUrl: cfg.siteUrl || window.location.origin,
      adminEmail: (cfg.adminEmail || defaultAdmin).toLowerCase()
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

  function isPlaceholderConfig(cfg) {
    const url = (cfg.url || "").toLowerCase();
    const key = (cfg.anonKey || "").toLowerCase();
    if (url.includes("your_project_ref") || url.includes("your_project")) return true;
    if (key.includes("your_supabase_anon_key") || key.includes("paste_your_supabase_anon_key_here")) return true;
    return false;
  }

  function hasValidConfig() {
    const cfg = getConfig();
    if (!cfg.url.startsWith("https://")) return false;
    if (!cfg.anonKey || cfg.anonKey.length < 30) return false;
    if (isPlaceholderConfig(cfg)) return false;
    return true;
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
        detectSessionInUrl: true,
        // Reduce token persistence risk vs localStorage (still survives refresh in the same tab).
        storage: window.sessionStorage
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
    // Phase 1: keep this best-effort and silent if the Edge Function isn't deployed.
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
    if (!error) return t("err_unknown");
    const msg = (error.message || "").toLowerCase();
    const code = error.code || "";

    if (msg.includes("already registered") || msg.includes("user already") || code === "signup_disabled") {
      return t("err_email_exists");
    }
    if (
      msg.includes("invalid login") ||
      msg.includes("invalid credentials") ||
      msg.includes("email not confirmed") ||
      msg.includes("not confirmed")
    ) {
      return t("err_invalid_login");
    }
    if (msg.includes("password")) {
      return t("err_password_strength");
    }
    if (msg.includes("email")) {
      return t("err_email_invalid");
    }
    if (msg.includes("failed to fetch") || msg.includes("fetch")) {
      return t("err_network");
    }
    if (code === "over_request_rate_limit" || msg.includes("rate limit") || msg.includes("too many")) {
      return t("err_rate_limited");
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
    // IMPORTANT: do not grant admin from client config or user metadata.
    // Admin is determined strictly by database-side role assignment (e.g., trigger) and RLS.
    let role = existing?.role === "admin" ? "admin" : "student";

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
    if (!user?.id) return false;
    const client = await init();
    if (!client) return false;
    // STRICT: admin access must only work if profiles.role = 'admin'
    const { data, error } = await client.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (error) return false;
    return data?.role === "admin";
  }

  async function signInWithEmailPassword(email, password, opts) {
    const options = opts && typeof opts === "object" ? opts : {};
    const failEventType = options.securityContext === "admin" ? "admin_login_failed" : "login_failed";
    const isAdminContext = options.securityContext === "admin";
    const now = Date.now();

    // Brute-force protection requirement:
    // - after 5 failed attempts
    // - lock login for 30 seconds
    const lockKey = isAdminContext ? "alend_admin_login_lock" : "alend_login_lock";
    const maxFails = isAdminContext ? 5 : 12;
    const lockMs = isAdminContext ? 30 * 1000 : 0;

    const client = await init();
    if (!client) throw new Error(t("err_config_missing"));

    const trimmedEmail = String(email || "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      throw new Error(t("err_email_invalid"));
    }
    if (!password || password.length < 1) {
      throw new Error(t("err_password_required"));
    }

    // Client-side lockout (must be backed by DB/RLS for real security).
    try {
      const raw = localStorage.getItem(lockKey);
      const state = raw ? JSON.parse(raw) : { fails: 0, lockedUntil: 0 };
      if (state.lockedUntil && now < state.lockedUntil) {
        const seconds = Math.ceil((state.lockedUntil - now) / 1000);
        throw new Error((getLang() === "ar" ? "محاولات كثيرة. انتظر " : "زۆر هەوڵدان. چاوەڕێ بکە ") + seconds + (getLang() === "ar" ? " ثانية." : " چرکە."));
      }
    } catch (e) {
      // If we failed to parse storage OR we're locked, surface the lock message.
      if (e instanceof Error && e.message) throw e;
    }

    const { data, error } = await client.auth.signInWithPassword({
      email: trimmedEmail,
      password
    });

    if (error) {
      // Count failed attempts and apply lockout.
      if (isAdminContext) {
        try {
          const raw = localStorage.getItem(lockKey);
          const state = raw ? JSON.parse(raw) : { fails: 0, lockedUntil: 0 };
          state.fails = Number(state.fails || 0) + 1;
          if (state.fails >= maxFails) {
            state.fails = 0;
            state.lockedUntil = now + lockMs;
            localStorage.setItem(lockKey, JSON.stringify(state));
          } else {
            state.lockedUntil = 0;
            localStorage.setItem(lockKey, JSON.stringify(state));
          }
        } catch {
          // ignore
        }
      }

      await reportSecurityEvent(
        { event_type: failEventType, email_attempt: trimmedEmail, success: false },
        null
      );
      if (options.securityContext === "admin") {
        await reportSecurityEvent(
          { event_type: "suspicious_admin_login_attempt", email_attempt: trimmedEmail, success: false },
          null
        );
      }
      throw new Error(mapAuthError(error));
    }

    // Phase 1: do not block login on email verification.

    if (data.user) await syncPublicUserRow(data.user);
    try { localStorage.removeItem(lockKey); } catch { /* ignore */ }
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
    const lang = getLang();
    if (!password || password.length < 8) return lang === "ar" ? "كلمة المرور يجب أن تكون 8 أحرف على الأقل." : "تێپەڕەوشە لانیکەم 8 پیت بێت.";
    if (!/[a-z]/.test(password)) return lang === "ar" ? "أضف حرفًا صغيرًا واحدًا على الأقل." : "لانیکەم یەک پیتی بچووک بنووسە.";
    if (!/[A-Z]/.test(password)) return lang === "ar" ? "أضف حرفًا كبيرًا واحدًا على الأقل." : "لانیکەم یەک پیتی گەورە بنووسە.";
    if (!/[0-9]/.test(password)) return lang === "ar" ? "أضف رقمًا واحدًا على الأقل." : "لانیکەم یەک ژمارە بنووسە.";
    return null;
  }

  function validatePhone(phone) {
    const p = String(phone || "").trim().replace(/\s/g, "");
    if (!p) return t("err_phone_required");
    if (!/^\+?[0-9]{10,15}$/.test(p)) return t("err_phone_invalid");
    return null;
  }

  async function signUpWithEmail({ fullName, email, phone, password }) {
    const client = await init();
    if (!client) throw new Error(t("err_config_missing"));

    const name = String(fullName || "").trim();
    if (name.length < 2) throw new Error(t("err_name_required"));

    const trimmedEmail = String(email || "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      throw new Error(t("err_email_invalid"));
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

    if (data.user) {
      // Session may be null if email confirmation is enabled. In Phase 1 we allow both cases.
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
    // Phase 1: no email verification gate.
  }

  async function requireAdmin() {
    const session = await getSession();
    if (!session?.user) {
      const appBase = getAppBaseUrl();
      const current = window.location.pathname + window.location.search + window.location.hash;
      localStorage.setItem("alend_auth_return_to", current);
      window.location.href = `${appBase}/login.html`;
      return false;
    }
    const ok = await isUserAdmin(session.user);
    if (!ok) {
      // Force sign-out to prevent any client-side UI bypass.
      await signOutLocal();
      return false;
    }
    return true;
  }

  function consumeReturnTo() {
    const value = localStorage.getItem("alend_auth_return_to");
    if (!value) return null;
    localStorage.removeItem("alend_auth_return_to");
    return value;
  }

  window.AlendAuth = {
    init,
    getLang,
    t,
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
