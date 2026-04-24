(function () {
  if (window.OrlandoAutoRepairWidgetLoaded) {
    return;
  }
  window.OrlandoAutoRepairWidgetLoaded = true;

  var script = document.currentScript;
  if (!script) {
    return;
  }

  function getBaseUrl(src) {
    try {
      return new URL(".", src).href.replace(/\/$/, "");
    } catch (error) {
      return "";
    }
  }

  function asBool(value) {
    return String(value || "").toLowerCase() === "true";
  }

  var baseUrl = getBaseUrl(script.src);
  var title = script.getAttribute("data-title") || "Chat With Us";
  var subtitle = script.getAttribute("data-subtitle") || "Get instant answers about services, appointments, and more.";
  var buttonLabel = script.getAttribute("data-button-label") || "Chat";
  var position = script.getAttribute("data-position") === "left" ? "left" : "right";
  var startOpen = asBool(script.getAttribute("data-open"));
  var iframePath = script.getAttribute("data-iframe-path") || "/embed.html";
  var iframeUrl = baseUrl + iframePath;
  var root = document.createElement("div");
  var rootClass = "oar-widget oar-widget--" + position;

  root.className = rootClass;
  root.innerHTML =
    '<button class="oar-widget__launcher" type="button" aria-expanded="false" aria-controls="oar-widget-panel">' +
    '  <svg class="oar-widget__launcher-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
    '    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>' +
    "  </svg>" +
    '  <span class="oar-widget__launcher-label">' + buttonLabel + "</span>" +
    "</button>" +
    '<section class="oar-widget__panel" id="oar-widget-panel" hidden>' +
    '  <header class="oar-widget__panel-header">' +
    '    <div class="oar-widget__header-content">' +
    '      <h2 class="oar-widget__title">' + title + "</h2>" +
    '      <p class="oar-widget__subtitle">' + subtitle + "</p>" +
    "    </div>" +
    '    <button class="oar-widget__close" type="button" aria-label="Close chat">' +
    '      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
    '        <line x1="18" y1="6" x2="6" y2="18"></line>' +
    '        <line x1="6" y1="6" x2="18" y2="18"></line>' +
    "      </svg>" +
    "    </button>" +
    "  </header>" +
    '  <iframe class="oar-widget__frame" title="' + title + '" loading="lazy" src="' + iframeUrl + '"></iframe>' +
    "</section>";

  var style = document.createElement("style");
  style.textContent =
    ".oar-widget{position:fixed;bottom:24px;z-index:2147483000;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif}" +
    ".oar-widget--right{right:24px}.oar-widget--left{left:24px}" +
    ".oar-widget__launcher{display:inline-flex;align-items:center;gap:10px;padding:14px 20px;border:0;border-radius:999px;background:#0f172a;color:#fff;box-shadow:0 8px 30px rgba(15,23,42,.35);font:inherit;font-size:0.95rem;font-weight:600;cursor:pointer;transition:all .2s ease}" +
    ".oar-widget__launcher:hover{transform:translateY(-2px);box-shadow:0 12px 40px rgba(15,23,42,.45)}" +
    ".oar-widget__launcher-icon{display:flex;width:22px;height:22px}" +
    ".oar-widget__panel{position:absolute;bottom:72px;width:min(420px,calc(100vw - 48px));height:min(700px,calc(100vh - 120px));background:#fff;border:1px solid #e2e8f0;border-radius:20px;box-shadow:0 20px 60px rgba(15,23,42,.25);overflow:hidden;animation:.3s ease}" +
    ".oar-widget--right .oar-widget__panel{right:0}.oar-widget--left .oar-widget__panel{left:0}" +
    ".oar-widget__panel-header{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:16px 18px;background:#f8fafc;border-bottom:1px solid #e2e8f0}" +
    ".oar-widget__header-content{min-width:0}" +
    ".oar-widget__title{margin:0;font-size:1.1rem;font-weight:600;color:#0f172a}" +
    ".oar-widget__subtitle{margin:4px 0 0;font-size:0.85rem;color:#64748b;line-height:1.4}" +
    ".oar-widget__close{display:flex;align-items:center;justify-content:center;width:36px;height:36px;padding:0;border:0;border-radius:10px;background:#f1f5f9;color:#64748b;cursor:pointer;transition:all .2s ease}" +
    ".oar-widget__close:hover{background:#e2e8f0;color:#0f172a}" +
    ".oar-widget__close svg{width:18px;height:18px}" +
    ".oar-widget__frame{display:block;width:100%;height:calc(100% - 69px);border:0;background:#f8fafc}" +
    "@media (max-width:480px){.oar-widget{left:12px;right:12px;bottom:12px}.oar-widget--left,.oar-widget--right{left:12px;right:12px}.oar-widget__launcher{width:100%;justify-content:center}.oar-widget__panel{left:0!important;right:0!important;bottom:64px;width:100%;height:calc(100vh - 100px);border-radius:16px}}";

  document.head.appendChild(style);
  document.body.appendChild(root);

  var launcher = root.querySelector(".oar-widget__launcher");
  var panel = root.querySelector(".oar-widget__panel");
  var closeButton = root.querySelector(".oar-widget__close");

  function setOpen(isOpen) {
    panel.hidden = !isOpen;
    launcher.setAttribute("aria-expanded", isOpen ? "true" : "false");
  }

  launcher.addEventListener("click", function () {
    setOpen(panel.hidden);
  });

  closeButton.addEventListener("click", function () {
    setOpen(false);
  });

  window.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      setOpen(false);
    }
  });

  setOpen(startOpen);
})();