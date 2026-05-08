// ===== Theme Manager =====
const ThemeManager = {
  current: localStorage.getItem('sts_theme') || 'dark',

  apply() {
    if (this.current === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    document.querySelectorAll('.theme-btn').forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.theme === this.current) btn.classList.add('active');
    });
  },

  toggle() {
    this.current = this.current === 'dark' ? 'light' : 'dark';
    localStorage.setItem('sts_theme', this.current);
    this.apply();
  },

  init() {
    this.apply();
    document.querySelectorAll('.theme-toggle').forEach(btn => {
      btn.addEventListener('click', () => this.toggle());
    });
  }
};

async function loadScriptOnce(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      if (existing.dataset.loaded === "true") resolve();
      else existing.addEventListener("load", () => resolve(), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = false;
    script.addEventListener("load", () => {
      script.dataset.loaded = "true";
      resolve();
    });
    script.addEventListener("error", () => reject(new Error(`Failed to load ${src}`)));
    document.head.appendChild(script);
  });
}

function getSharedJsBase() {
  const script = document.querySelector('script[src*="js/theme.js"]');
  const src = script?.getAttribute("src") || "js/theme.js";
  return src.replace(/theme\.js$/, "");
}

async function bootstrapRouteProtection() {
  const pathname = window.location.pathname.toLowerCase();
  const isPublic =
    pathname.endsWith("/index.html") ||
    pathname.endsWith("/login.html") ||
    pathname.endsWith("/google5052188c8b63726a.html") ||
    pathname.endsWith("/");

  const jsBase = getSharedJsBase();

  try {
    await loadScriptOnce(`${jsBase}env.js`);
    await loadScriptOnce(`${jsBase}supabase-auth.js`);

    if (!window.AlendAuth) return;

    await window.AlendAuth.init();
    if (!isPublic) {
      await window.AlendAuth.requireAuth();
    }
  } catch (error) {
    // Keep UI usable even if auth bootstrap fails on public routes.
    if (!isPublic) {
      window.location.href = `${jsBase ? jsBase.replace("js/", "") : ""}login.html`;
    }
  }
}

// Init on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  ThemeManager.init();
  if (typeof LangManager !== 'undefined') LangManager.init();
  bootstrapRouteProtection();
});
