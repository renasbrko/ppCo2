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
    await loadScriptOnce(`${jsBase}content-protection.js`);

    if (!window.AlendAuth) return;

    await window.AlendAuth.init();
    if (!isPublic) {
      await window.AlendAuth.requireAuth();
      const user = await window.AlendAuth.getUser();
      if (window.AlendContentProtection && user) {
        await window.AlendContentProtection.init(user);
      }
    }
  } catch (error) {
    // Keep UI usable even if auth bootstrap fails on public routes.
    if (!isPublic) {
      window.location.href = `${jsBase ? jsBase.replace("js/", "") : ""}login.html`;
    }
  }
}

function getRelativeRootFromPathname(pathname) {
  const clean = pathname.replace(/\\/g, "/");
  const segments = clean.split("/").filter(Boolean);
  const fileIndex = segments.findIndex((s) => s.endsWith(".html"));
  const depth = fileIndex >= 0 ? fileIndex - 1 : segments.length - 1;
  const safeDepth = Math.max(0, depth);
  return safeDepth === 0 ? "" : "../".repeat(safeDepth);
}

function upgradeFooter() {
  const footer = document.querySelector(".site-footer");
  if (!footer || footer.dataset.enhanced === "true") return;

  const root = getRelativeRootFromPathname(window.location.pathname);
  const year = new Date().getFullYear();

  footer.innerHTML = `
    <div class="footer-inner">
      <div class="footer-top">
        <div>
          <div class="footer-brand">
            <img src="${root}logo.png" alt="PPAlend" class="footer-logo">
            <div>
              <h3 data-lang="footer_brand_title">پلاتفۆرمی پەروەردەیی ئەلند</h3>
              <p class="footer-desc" data-lang="footer_brand_desc">پلاتفۆرمێکی مۆدێرن بۆ پێشکەشکردنی ناوەڕۆکی خوێندنی بەکوێت و بەخێرایی.</p>
            </div>
          </div>
        </div>
        <div>
          <p class="footer-title" data-lang="footer_links_title">بەستەرەکان</p>
          <ul class="footer-links">
            <li><a href="${root}index.html" data-lang="footer_nav_home">سەرەکی</a></li>
            <li><a href="${root}index.html#subjects" data-lang="footer_nav_subjects">بەشەکان</a></li>
            <li><a href="${root}index.html#about" data-lang="footer_nav_about">دەربارە</a></li>
            <li><a href="${root}login.html" data-lang="footer_nav_login">چوونەژوورەوە</a></li>
          </ul>
        </div>
        <div>
          <p class="footer-title" data-lang="footer_contact_title">پەیوەندی</p>
          <div class="footer-contact">
            <p>📧 support@ppalend.com</p>
            <p>📍 Kurdistan - Iraq</p>
          </div>
          <div class="footer-social">
            <a class="social-icon" href="#" aria-label="Facebook">f</a>
            <a class="social-icon" href="#" aria-label="Instagram">i</a>
            <a class="social-icon" href="#" aria-label="YouTube">▶</a>
            <a class="social-icon" href="#" aria-label="Telegram">t</a>
          </div>
        </div>
        <div class="footer-newsletter">
          <p class="footer-title" data-lang="footer_newsletter_title">نامەی هەواڵ</p>
          <form action="mailto:support@ppalend.com" method="post" enctype="text/plain">
            <input class="footer-input" type="email" name="email" data-lang-placeholder="footer_newsletter_placeholder" placeholder="ئیمەیڵەکەت" required>
            <button class="footer-btn" type="submit" data-lang="footer_newsletter_btn">تۆمار</button>
          </form>
        </div>
      </div>
      <div class="footer-bottom">© ${year} PPAlend - <span data-lang="footer_rights">هەموو مافەکان پارێزراون</span></div>
    </div>
  `;

  footer.dataset.enhanced = "true";
  if (typeof LangManager !== "undefined") {
    LangManager.apply();
  }
}

// Init on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  ThemeManager.init();
  if (typeof LangManager !== 'undefined') LangManager.init();
  upgradeFooter();
  bootstrapRouteProtection();
});
