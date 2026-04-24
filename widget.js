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

  function escapeHtml(text) {
    var div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  var baseUrl = getBaseUrl(script.src);
  var title = script.getAttribute("data-title") || "Support Assistant";
  var subtitle = script.getAttribute("data-subtitle") || "Get instant answers about services, appointments, and more.";
  var buttonLabel = script.getAttribute("data-button-label") || "Chat";
  var position = script.getAttribute("data-position") === "left" ? "left" : "right";
  var startOpen = asBool(script.getAttribute("data-open"));
  var chatApiUrl = baseUrl + "/api/chat";
  var quickReplies = [
    "What services do you offer?",
    "What are your hours?",
    "How do I book?"
  ];

  var root = document.createElement("div");
  var rootClass = "oar-widget oar-widget--" + position;

  var chatHistory = [];
  var isResponding = false;

  root.className = rootClass;
  root.innerHTML =
    '<button class="oar-widget__launcher" type="button" aria-expanded="false" aria-controls="oar-widget-panel">' +
    '  <svg class="oar-widget__launcher-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
    '    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>' +
    "  </svg>" +
    "</button>" +
    '<section class="oar-widget__panel" id="oar-widget-panel" hidden>' +
    '  <header class="oar-widget__panel-header">' +
    '    <div class="oar-widget__header-content">' +
    '      <div class="oar-widget__avatar">' +
    '        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
    '          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>' +
    "        </svg>" +
    '        <span class="oar-widget__status"></span>' +
    "      </div>" +
    '      <div class="oar-widget__header-text">' +
    '        <h2 class="oar-widget__title">' + title + "</h2>" +
    '        <p class="oar-widget__subtitle">Online</p>' +
    "      </div>" +
    "    </div>" +
    '    <button class="oar-widget__close" type="button" aria-label="Close chat">' +
    '      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
    '        <line x1="18" y1="6" x2="6" y2="18"></line>' +
    '        <line x1="6" y1="6" x2="18" y2="18"></line>' +
    "      </svg>" +
    "    </button>" +
    "  </header>" +
    '  <div class="oar-widget__messages" data-messages></div>' +
    '  <div class="oar-widget__quick-replies" data-quick-replies></div>' +
    '  <form class="oar-widget__composer" data-form>' +
    '    <input class="oar-widget__input" data-input type="text" placeholder="Type your message…" />' +
    '    <button class="oar-widget__send" type="submit">' +
    '      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
    '        <line x1="22" y1="2" x2="11" y2="13"></line>' +
    '        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>' +
    "      </svg>" +
    "    </button>" +
    "  </form>" +
    "</section>";

  var style = document.createElement("style");
  style.textContent =
    ".oar-widget{position:fixed;bottom:24px;z-index:2147483000;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif}" +
    ".oar-widget--right{right:24px}.oar-widget--left{left:24px}" +
    ".oar-widget__launcher{display:flex;align-items:center;justify-content:center;width:60px;height:60px;border:0;border-radius:30px;background:linear-gradient(135deg,#0f172a,#1e293b);color:#fff;box-shadow:0 8px 32px rgba(15,23,42,.4);cursor:pointer;transition:all .3s cubic-bezier(.4,0,.2,1)}" +
    ".oar-widget__launcher:hover{transform:scale(1.05);box-shadow:0 12px 40px rgba(15,23,42,.5)}" +
    ".oar-widget__launcher-icon{display:flex;width:26px;height:26px}" +
    ".oar-widget__panel{position:absolute;bottom:80px;width:360px;max-width:calc(100vw - 48px);height:520px;max-height:calc(100vh - 140px);background:#fff;border:1px solid #e2e8f0;border-radius:16px;box-shadow:0 20px 60px rgba(15,23,42,.2);overflow:hidden;display:flex;flex-direction:column;opacity:0;visibility:hidden;transition:all .3s cubic-bezier(.4,0,.2,1)}" +
    ".oar-widget--open .oar-widget__panel{opacity:1;visibility:visible}" +
    ".oar-widget--right .oar-widget__panel{right:0}.oar-widget--left .oar-widget__panel{left:0}" +
    ".oar-widget__panel-header{display:flex;align-items:center;gap:12px;padding:16px 18px;background:#f8fafc;border-bottom:1px solid #e2e8f0;flex-shrink:0}" +
    ".oar-widget__header-content{display:flex;align-items:center;gap:12px;flex:1;min-width:0}" +
    ".oar-widget__avatar{position:relative;display:flex;align-items:center;justify-content:center;width:44px;height:44px;background:linear-gradient(135deg,#0f172a,#1e293b);border-radius:22px;flex-shrink:0}" +
    ".oar-widget__avatar svg{width:22px;height:22px;color:#fff}" +
    ".oar-widget__status{position:absolute;bottom:0;right:0;width:12px;height:12px;background:#22c55e;border:2px solid #fff;border-radius:50%}" +
    ".oar-widget__header-text{min-width:0}" +
    ".oar-widget__title{margin:0;font-size:1rem;font-weight:600;color:#0f172a;letter-spacing:-.01em}" +
    ".oar-widget__subtitle{margin:2px 0 0;font-size:0.75rem;color:#22c55e;font-weight:500}" +
    ".oar-widget__close{display:flex;align-items:center;justify-content:center;width:36px;height:36px;padding:0;border:0;border-radius:10px;background:transparent;color:#64748b;cursor:pointer;transition:all .2s}" +
    ".oar-widget__close:hover{background:#f1f5f9;color:#0f172a}" +
    ".oar-widget__close svg{width:18px;height:18px}" +
    ".oar-widget__messages{flex:1;min-height:0;padding:16px;overflow-y:auto;background:#f8fafc;display:flex;flex-direction:column}" +
    ".oar-widget__message{display:flex;margin-bottom:12px;animation:.25s ease}" +
    ".oar-widget__message:last-child{margin-bottom:auto}" +
    ".oar-widget__message--user{justify-content:flex-end}" +
    ".oar-widget__bubble{max-width:85%;padding:10px 14px;border-radius:16px;border-bottom-right-radius:4px;font-size:.85rem;line-height:1.45;word-wrap:break-word}" +
    ".oar-widget__message--user .oar-widget__bubble{background:#0f172a;color:#fff;border-bottom-right-radius:16px;border-bottom-left-radius:4px}" +
    ".oar-widget__message--assistant .oar-widget__bubble{background:#fff;color:#1e293b;border:1px solid #e2e8f0;border-bottom-left-radius:4px}" +
    ".oar-widget__bubble p{margin:0}" +
    ".oar-widget__actions{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}" +
    ".oar-widget__action{display:inline-flex;padding:6px 12px;background:#fef3c7;border:1px solid #fcd34d;border-radius:999px;font-size:.75rem;font-weight:500;color:#92400e;text-decoration:none;cursor:pointer;transition:all .2s}" +
    ".oar-widget__action:hover{background:#fde68a}" +
    ".oar-widget__thinking{display:flex;gap:4px;padding:10px 14px;background:#fff;border:1px solid #e2e8f0;border-radius:16px;border-bottom-left-radius:4px;width:fit-content}" +
    ".oar-widget__thinking-dot{width:6px;height:6px;background:#94a3b8;border-radius:50%;animation:1.4s ease-in-out infinite both}" +
    ".oar-widget__thinking-dot:nth-child(1){animation-delay:-.32s}.oar-widget__thinking-dot:nth-child(2){animation-delay:-.16s}@-webkit-keyframes oarBounce{0%,80%,100%{transform:scale(.8);opacity:.5}40%{transform:scale(1);opacity:1}}@keyframes oarBounce{0%,80%,100%{transform:scale(.8);opacity:.5}40%{transform:scale(1);opacity:1}}" +
    ".oar-widget__quick-replies{display:flex;flex-wrap:wrap;gap:6px;padding:10px 16px;border-top:1px solid #f1f5f9;flex-shrink:0;max-height:80px;overflow-y:auto}" +
    ".oar-widget__chip{display:inline-flex;padding:6px 10px;background:#fff;border:1px solid #e2e8f0;border-radius:999px;font-size:.75rem;font-weight:500;color:#475569;cursor:pointer;transition:all .2s}" +
    ".oar-widget__chip:hover{background:#f1f5f9;border-color:#cbd5e1}" +
    ".oar-widget__composer{display:flex;gap:10px;padding:14px 16px;background:#fff;border-top:1px solid #e2e8f0;flex-shrink:0}" +
    ".oar-widget__input{flex:1;padding:12px 16px;border:1px solid #e2e8f0;border-radius:12px;font-family:inherit;font-size:.9rem;background:#f8fafc;color:#1e293b;outline:none;transition:all .2s}" +
    ".oar-widget__input:focus{border-color:#0f172a;background:#fff}" +
    ".oar-widget__input::placeholder{color:#94a3b8}" +
    ".oar-widget__send{display:flex;align-items:center;justify-content:center;width:44px;height:44px;padding:0;border:0;border-radius:12px;background:#0f172a;color:#fff;cursor:pointer;transition:all .2s}" +
    ".oar-widget__send:hover{background:#1e293b}" +
    ".oar-widget__send:disabled{opacity:.5;cursor:not-allowed}" +
    ".oar-widget__send svg{width:18px;height:18px}" +
    "@media (max-width:480px){.oar-widget{left:12px;right:12px;bottom:12px}.oar-widget--left,.oar-widget--right{left:12px;right:12px}.oar-widget__launcher{position:absolute;bottom:0;left:50%;transform:translateX(-50%)}.oar-widget__panel{left:0!important;right:0!important;bottom:0;width:100%;max-width:100%;height:100%;max-height:100%;border-radius:0}}";

  document.head.appendChild(style);
  document.body.appendChild(root);

  var launcher = root.querySelector(".oar-widget__launcher");
  var panel = root.querySelector(".oar-widget__panel");
  var closeButton = root.querySelector(".oar-widget__close");
  var messagesContainer = root.querySelector("[data-messages]");
  var quickRepliesContainer = root.querySelector("[data-quick-replies]");
  var form = root.querySelector("[data-form]");
  var input = root.querySelector("[data-input]");
  var sendButton = root.querySelector(".oar-widget__send");

  function setOpen(isOpen) {
    panel.hidden = !isOpen;
    launcher.setAttribute("aria-expanded", isOpen ? "true" : "false");
    root.classList.toggle("oar-widget--open", isOpen);
  }

  function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function renderUserMessage(text) {
    var wrapper = document.createElement("div");
    wrapper.className = "oar-widget__message oar-widget__message--user";
    wrapper.innerHTML = '<div class="oar-widget__bubble"><p>' + escapeHtml(text) + "</p></div>";
    messagesContainer.appendChild(wrapper);
    chatHistory.push({ role: "user", content: text });
    if (chatHistory.length > 12) {
      chatHistory.shift();
    }
  }

  function renderBotMessage(text, actions) {
    var wrapper = document.createElement("div");
    wrapper.className = "oar-widget__message oar-widget__message--assistant";
    var html = '<div class="oar-widget__bubble"><p>' + escapeHtml(text) + "</p>";
    if (actions && actions.length) {
      html += '<div class="oar-widget__actions">';
      actions.forEach(function (action) {
        html += '<a class="oar-widget__action" href="' + action.url + '" target="_blank" rel="noreferrer">' + escapeHtml(action.label) + "</a>";
      });
      html += "</div>";
    }
    html += "</div>";
    wrapper.innerHTML = html;
    messagesContainer.appendChild(wrapper);
    chatHistory.push({ role: "assistant", content: text });
    if (chatHistory.length > 12) {
      chatHistory.shift();
    }
    scrollToBottom();
  }

  function renderThinking() {
    var wrapper = document.createElement("div");
    wrapper.className = "oar-widget__message oar-widget__message--assistant";
    wrapper.innerHTML = '<div class="oar-widget__thinking"><span class="oar-widget__thinking-dot"></span><span class="oar-widget__thinking-dot"></span><span class="oar-widget__thinking-dot"></span></div>';
    messagesContainer.appendChild(wrapper);
    scrollToBottom();
    return wrapper;
  }

  function setBusy(busy) {
    isResponding = busy;
    input.disabled = busy;
    sendButton.disabled = busy;
  }

  function renderQuickReplies() {
    quickRepliesContainer.innerHTML = "";
    quickReplies.forEach(function (item) {
      var chip = document.createElement("button");
      chip.className = "oar-widget__chip";
      chip.textContent = item;
      chip.type = "button";
      chip.disabled = isResponding;
      chip.addEventListener("click", function () {
        input.value = item;
        submitQuery(item);
      });
      quickRepliesContainer.appendChild(chip);
    });
  }

  async function submitQuery(query) {
    var trimmed = (query || "").trim();
    if (!trimmed || isResponding) {
      return;
    }

    renderUserMessage(trimmed);
    input.value = "";
    setBusy(true);
    renderQuickReplies();

    var thinking = renderThinking();

    try {
      var response = await fetch(chatApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: trimmed,
          history: chatHistory
        })
      });

      if (!response.ok || !response.body) {
        throw new Error("Unable to get response");
      }

      var decoder = new TextDecoder();
      var buffer = "";
      var reader = response.body.getReader();
      var fullResponse = "";
      var donePayload = null;

      while (true) {
        var read = await reader.read();
        if (read.done) {
          break;
        }

        buffer += decoder.decode(read.value, { stream: true });
        var lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (var i = 0; i < lines.length; i++) {
          var line = lines[i].trim();
          if (!line) {
            continue;
          }

          var payload;
          try {
            payload = JSON.parse(line);
          } catch (e) {
            continue;
          }

          if (payload.type === "token") {
            fullResponse += payload.content || "";
          } else if (payload.type === "done") {
            donePayload = payload;
          } else if (payload.type === "error") {
            throw new Error(payload.message || "Error");
          }
        }
      }

      thinking.remove();

      if (fullResponse) {
        renderBotMessage(fullResponse, donePayload ? donePayload.actions : []);
      } else if (donePayload && donePayload.content) {
        renderBotMessage(donePayload.content, donePayload.actions);
      } else {
        renderBotMessage("I apologize, but I couldn't generate a response. Please try again or call us directly.", [
          { label: "Call Shop", url: "tel:+14074125103" }
        ]);
      }
    } catch (error) {
      thinking.remove();
      renderBotMessage("I apologize, but I'm having trouble connecting right now. Please try again or contact us directly.", [
        { label: "Call Shop", url: "tel:+14074125103" }
      ]);
    }

    setBusy(false);
    renderQuickReplies();
    input.focus();
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    submitQuery(input.value);
  });

  launcher.addEventListener("click", function () {
    setOpen(panel.hidden);
    if (!panel.hidden && messagesContainer.children.length === 0) {
      addWelcomeMessage();
    }
  });

  function addWelcomeMessage() {
    var wrapper = document.createElement("div");
    wrapper.className = "oar-widget__message oar-widget__message--assistant";
    wrapper.innerHTML = '<div class="oar-widget__bubble"><p>Hi! How can I help you today?</p></div>';
    messagesContainer.appendChild(wrapper);
    renderQuickReplies();
    scrollToBottom();
  }

  closeButton.addEventListener("click", function () {
    setOpen(false);
  });

  window.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      setOpen(false);
    }
  });

  setOpen(startOpen);
  renderQuickReplies();
})();