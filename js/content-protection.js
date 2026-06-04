(function () {
  let watermarkNode = null;
  let watermarkTimer = null;

  function formatTimestamp() {
    return new Date().toLocaleString();
  }

  function createWatermark(user) {
    if (watermarkNode) return watermarkNode;

    const layer = document.createElement("div");
    layer.className = "alend-watermark-layer";
    layer.setAttribute("aria-hidden", "true");

    const item = document.createElement("div");
    item.className = "alend-watermark-item";
    layer.appendChild(item);
    document.body.appendChild(layer);

    watermarkNode = item;
    updateWatermark(user);
    return item;
  }

  function updateWatermark(user) {
    if (!watermarkNode) return;
    watermarkNode.textContent = `${user.email || "unknown"} | ${user.id || "unknown"} | ${formatTimestamp()}`;
  }

  function ensureProtectionStyles() {
    if (document.getElementById("alend-protection-style")) return;
    const style = document.createElement("style");
    style.id = "alend-protection-style";
    style.textContent = `
      .alend-protected-content {
        user-select: none;
        -webkit-user-select: none;
      }
      .alend-watermark-layer {
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: 9999;
        overflow: hidden;
      }
      .alend-watermark-item {
        position: absolute;
        inset: 0;
        opacity: 0.11;
        color: #c9a24d;
        font-size: clamp(11px, 1.2vw, 14px);
        font-weight: 700;
        white-space: pre-wrap;
        display: grid;
        place-items: center;
        transform: rotate(-22deg);
        text-align: center;
      }
      .alend-secure-video-wrap {
        position: relative;
        width: 100%;
        max-width: 960px;
        margin-inline: auto;
      }
      .alend-secure-video-wrap iframe {
        width: 100%;
        aspect-ratio: 16 / 9;
        border: 0;
        border-radius: 12px;
        background: #000;
      }
    `;
    document.head.appendChild(style);
  }

  function disableCommonSaveActions() {
    document.addEventListener("contextmenu", (event) => {
      event.preventDefault();
    });

    document.addEventListener("keydown", (event) => {
      const key = event.key.toLowerCase();
      const ctrlOrMeta = event.ctrlKey || event.metaKey;

      // Save/print/view-source/devtools shortcuts
      const blocked =
        (ctrlOrMeta && ["s", "p", "u"].includes(key)) ||
        (ctrlOrMeta && event.shiftKey && ["i", "j", "s"].includes(key)) ||
        key === "f12";

      if (blocked) {
        event.preventDefault();
      }
    });
  }

  function toYoutubeEmbedUrl(raw) {
    // Strict parsing: https only + strict host allowlist + reject spoofed domains.
    let url;
    try {
      url = new URL(String(raw || "").trim());
    } catch {
      return null;
    }
    if (url.protocol !== "https:") return null;
    if (url.username || url.password) return null;
    const host = (url.hostname || "").toLowerCase();
    const allowedHosts = new Set(["youtube.com", "www.youtube.com", "youtu.be"]);
    if (!allowedHosts.has(host)) return null;

    const idRe = /^[a-zA-Z0-9_-]{11}$/;
    let id = "";
    if (host === "youtu.be") {
      const parts = url.pathname.split("/").filter(Boolean);
      if (parts.length !== 1) return null;
      id = parts[0];
    } else {
      const path = url.pathname.replace(/\/+$/, "");
      if (path === "/watch") {
        id = url.searchParams.get("v") || "";
      } else if (path.startsWith("/shorts/")) {
        id = path.split("/shorts/")[1] || "";
      } else if (path.startsWith("/embed/")) {
        id = path.split("/embed/")[1] || "";
      } else {
        return null;
      }
    }
    id = (id || "").trim();
    if (!idRe.test(id)) return null;

    const embed = new URL(`https://www.youtube-nocookie.com/embed/${id}`);
    embed.searchParams.set("rel", "0");
    embed.searchParams.set("modestbranding", "1");
    embed.searchParams.set("controls", "1");
    embed.searchParams.set("disablekb", "1");
    embed.searchParams.set("iv_load_policy", "3");
    embed.searchParams.set("fs", "0");
    embed.searchParams.set("playsinline", "1");
    return embed.toString();
  }

  function upgradeProtectedVideos() {
    const nodes = document.querySelectorAll("[data-youtube-url]");
    nodes.forEach((node) => {
      const url = node.getAttribute("data-youtube-url");
      if (!url) return;
      const embedUrl = toYoutubeEmbedUrl(url);
      if (!embedUrl) return;

      const wrap = document.createElement("div");
      wrap.className = "alend-secure-video-wrap";
      const iframe = document.createElement("iframe");
      iframe.src = embedUrl;
      iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
      iframe.referrerPolicy = "strict-origin-when-cross-origin";
      iframe.allowFullscreen = false;
      wrap.appendChild(iframe);

      node.replaceChildren(wrap);
    });
  }

  async function init(user) {
    if (!user) return;
    ensureProtectionStyles();
    disableCommonSaveActions();

    document.body.classList.add("alend-protected-content");
    createWatermark(user);
    if (watermarkTimer) window.clearInterval(watermarkTimer);
    watermarkTimer = window.setInterval(() => updateWatermark(user), 30_000);

    upgradeProtectedVideos();
  }

  window.AlendContentProtection = {
    init,
    toYoutubeEmbedUrl,
  };
})();

