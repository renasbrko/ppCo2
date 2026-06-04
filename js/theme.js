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

async function ensureLucideIcons() {
  try {
    await loadScriptOnce("https://cdn.jsdelivr.net/npm/lucide@latest");
    if (window.lucide && typeof window.lucide.createIcons === "function") {
      window.lucide.createIcons({
        attrs: {
          width: "18",
          height: "18",
          "stroke-width": "1.8",
        }
      });
    }
  } catch {
    // non-fatal
  }
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

  const make = (tag, attrs) => {
    const n = document.createElement(tag);
    if (attrs) {
      for (const [k, v] of Object.entries(attrs)) {
        if (v == null) continue;
        if (k === "class") n.className = String(v);
        else if (k === "text") n.textContent = String(v);
        else n.setAttribute(k, String(v));
      }
    }
    return n;
  };

  const inner = make("div", { class: "footer-inner" });
  const top = make("div", { class: "footer-top" });

  // Brand
  const colBrand = make("div");
  const brand = make("div", { class: "footer-brand" });
  brand.appendChild(make("img", { src: `${root}logo.png`, alt: "PPAlend", class: "footer-logo" }));
  const brandText = make("div");
  brandText.appendChild(make("h3", { "data-lang": "footer_brand_title", text: "پلاتفۆرمی پەروەردەیی ئەلند" }));
  brandText.appendChild(make("p", {
    class: "footer-desc",
    "data-lang": "footer_brand_desc",
    text: "پلاتفۆرمێکی مۆدێرن بۆ پێشکەشکردنی ناوەڕۆکی خوێندنی بەکوێت و بەخێرایی."
  }));
  brand.appendChild(brandText);
  colBrand.appendChild(brand);

  // Links
  const colLinks = make("div");
  colLinks.appendChild(make("p", { class: "footer-title", "data-lang": "footer_links_title", text: "بەستەرەکان" }));
  const ul = make("ul", { class: "footer-links" });
  const link = (href, key, text) => {
    const li = make("li");
    li.appendChild(make("a", { href, "data-lang": key, text }));
    return li;
  };
  ul.appendChild(link(`${root}index.html`, "footer_nav_home", "سەرەکی"));
  ul.appendChild(link(`${root}index.html#subjects`, "footer_nav_subjects", "بەشەکان"));
  ul.appendChild(link(`${root}index.html#about`, "footer_nav_about", "دەربارە"));
  ul.appendChild(link(`${root}login.html`, "footer_nav_login", "چوونەژوورەوە"));
  colLinks.appendChild(ul);

  // Contact + socials
  const colContact = make("div");
  colContact.appendChild(make("p", { class: "footer-title", "data-lang": "footer_contact_title", text: "پەیوەندی" }));
  const contact = make("div", { class: "footer-contact" });
  contact.appendChild(make("p", { "data-lang": "footer_contact_email", text: "📧 support@ppalend.com" }));
  contact.appendChild(make("p", { "data-lang": "footer_contact_region", text: "📍 هەرێمی کوردستان — عێراق" }));
  colContact.appendChild(contact);
  const socials = make("div", { class: "footer-social" });
  const social = (labelKey, label, iconName) => {
    const a = make("a", { class: "social-icon", href: "#", "data-lang-attr": `aria-label:${labelKey}`, "aria-label": label });
    const i = make("i", { "data-lucide": iconName, "aria-hidden": "true" });
    a.appendChild(i);
    return a;
  };
  socials.appendChild(social("footer_social_facebook", "Facebook", "facebook"));
  socials.appendChild(social("footer_social_instagram", "Instagram", "instagram"));
  socials.appendChild(social("footer_social_youtube", "YouTube", "youtube"));
  socials.appendChild(social("footer_social_telegram", "Telegram", "send"));
  colContact.appendChild(socials);

  // Newsletter
  const colNews = make("div", { class: "footer-newsletter" });
  colNews.appendChild(make("p", { class: "footer-title", "data-lang": "footer_newsletter_title", text: "نامەی هەواڵ" }));
  const form = make("form", { action: "mailto:support@ppalend.com", method: "post", enctype: "text/plain" });
  const input = make("input", {
    class: "footer-input",
    type: "email",
    name: "email",
    placeholder: "ئیمەیڵەکەت",
    required: ""
  });
  input.setAttribute("data-lang-placeholder", "footer_newsletter_placeholder");
  const btn = make("button", { class: "footer-btn", type: "submit", "data-lang": "footer_newsletter_btn", text: "تۆمار" });
  form.appendChild(input);
  form.appendChild(btn);
  colNews.appendChild(form);

  top.appendChild(colBrand);
  top.appendChild(colLinks);
  top.appendChild(colContact);
  top.appendChild(colNews);

  const bottom = make("div", { class: "footer-bottom" });
  bottom.appendChild(document.createTextNode(`© ${year} PPAlend - `));
  bottom.appendChild(make("span", { "data-lang": "footer_rights", text: "هەموو مافەکان پارێزراون" }));

  inner.appendChild(top);
  inner.appendChild(bottom);
  footer.replaceChildren(inner);

  footer.dataset.enhanced = "true";
  if (typeof LangManager !== "undefined") {
    LangManager.apply();
  }
  ensureLucideIcons();
}

// Init on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  ThemeManager.init();
  if (typeof LangManager !== 'undefined') LangManager.init();
  upgradeFooter();
  bootstrapRouteProtection();
  ensureLucideIcons();
});
