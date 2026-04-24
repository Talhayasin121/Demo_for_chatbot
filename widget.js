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
  var title = script.getAttribute("data-title") || "Chat With Orlando Auto Repair";
  var subtitle = script.getAttribute("data-subtitle") || "Ask about appointments, services, hours, and more.";
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
    '  <span class="oar-widget__launcher-icon">?</span>' +
    '  <span class="oar-widget__launcher-label">' + buttonLabel + "</span>" +
    "</button>" +
    '<section class="oar-widget__panel" id="oar-widget-panel" hidden>' +
    '  <header class="oar-widget__panel-header">' +
    '    <div class="oar-widget__header-copy">' +
    '      <p class="oar-widget__eyebrow">Customer Support</p>' +
    '      <h2 class="oar-widget__title">' + title + "</h2>" +
    '      <p class="oar-widget__subtitle">' + subtitle + "</p>" +
    "    </div>" +
    '    <button class="oar-widget__close" type="button" aria-label="Close chat">Close</button>' +
    "  </header>" +
    '  <iframe class="oar-widget__frame" title="' + title + '" loading="lazy" src="' + iframeUrl + '"></iframe>' +
    "</section>";

  var style = document.createElement("style");
  style.textContent =
    ".oar-widget{position:fixed;bottom:20px;z-index:2147483000;font-family:Georgia,'Times New Roman',serif}" +
    ".oar-widget--right{right:20px}.oar-widget--left{left:20px}" +
    ".oar-widget__launcher{display:inline-flex;align-items:center;gap:10px;border:0;border-radius:999px;padding:14px 18px;background:linear-gradient(135deg,#cc5a18,#8e3608);color:#fff;box-shadow:0 18px 45px rgba(68,40,16,.28);font:inherit;font-weight:700;cursor:pointer}" +
    ".oar-widget__launcher-icon{display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:999px;background:rgba(255,255,255,.18);font-size:16px}" +
    ".oar-widget__panel{position:absolute;bottom:72px;width:min(420px,calc(100vw - 24px));height:min(760px,calc(100vh - 110px));background:#fffdf8;border:1px solid #e2d4c3;border-radius:24px;box-shadow:0 30px 80px rgba(68,40,16,.24);overflow:hidden}" +
    ".oar-widget--right .oar-widget__panel{right:0}.oar-widget--left .oar-widget__panel{left:0}" +
    ".oar-widget__panel-header{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;padding:16px 16px 14px;background:linear-gradient(135deg,rgba(255,241,232,.98),rgba(255,253,248,.94));border-bottom:1px solid #e2d4c3}" +
    ".oar-widget__header-copy{min-width:0}.oar-widget__eyebrow{margin:0 0 6px;color:#8e3608;font-size:11px;letter-spacing:.14em;text-transform:uppercase}" +
    ".oar-widget__title{margin:0 0 4px;font-size:18px;line-height:1.1;color:#26180f}.oar-widget__subtitle{margin:0;color:#715d4c;font-size:13px;line-height:1.4}" +
    ".oar-widget__close{border:1px solid #e2d4c3;border-radius:999px;padding:8px 12px;background:#fff;color:#26180f;font:inherit;cursor:pointer}" +
    ".oar-widget__frame{display:block;width:100%;height:calc(100% - 82px);border:0;background:#fffdf8}" +
    "@media (max-width:640px){.oar-widget{left:12px;right:12px;bottom:12px}.oar-widget--left,.oar-widget--right{left:12px;right:12px}.oar-widget__launcher{width:100%;justify-content:center}.oar-widget__panel{left:0!important;right:0!important;bottom:68px;width:100%;height:min(78vh,720px)}}";

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
