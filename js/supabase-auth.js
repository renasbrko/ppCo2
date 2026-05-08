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
    // Prefer current runtime origin for Vercel/preview compatibility.
    return runtimeOrigin || configured || "";
  }

  function hasValidConfig() {
    const cfg = getConfig();
    return cfg.url.startsWith("https://") && cfg.anonKey.length > 20;
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

  async function signInWithOAuth(provider) {
    const client = await init();
    if (!client) throw new Error("Supabase env config is missing");
    const appBase = getAppBaseUrl();
    if (!appBase) throw new Error("Invalid app base URL");
    const redirectTo = `${appBase}/login.html?oauth=callback`;
    localStorage.setItem("alend_auth_return_to", window.location.href);
    const { error } = await client.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo
      }
    });

    if (error) throw error;
  }

  async function signOut() {
    const client = await init();
    if (!client) return;
    await client.auth.signOut();
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
    }
  }

  async function requireAdmin() {
    await requireAuth();
    const user = await getUser();
    const cfg = getConfig();
    if (!user || !cfg.adminEmail || user.email?.toLowerCase() !== cfg.adminEmail) {
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
    signInWithOAuth,
    signOut,
    requireAuth,
    requireAdmin,
    consumeReturnTo
  };
})();
