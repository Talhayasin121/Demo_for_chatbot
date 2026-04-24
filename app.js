(function () {
  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  function escapeHtml(text) {
    var div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  function createElement(tag, className, html) {
    var element = document.createElement(tag);
    if (className) {
      element.className = className;
    }
    if (typeof html === "string") {
      element.innerHTML = html;
    }
    return element;
  }

  function wait(ms) {
    return new Promise(function (resolve) {
      window.setTimeout(resolve, ms);
    });
  }

  function splitIntoChunks(text) {
    return (text || "").match(/.{1,4}(\s+|$)|\S+(\s+|$)/g) || [text];
  }

  ready(function () {
    if (!window.OrlandoChatbotData || !window.createOrlandoChatbotEngine) {
      return;
    }

    var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    var canListen = typeof SpeechRecognition === "function";
    var canSpeak = typeof window.speechSynthesis !== "undefined" && typeof window.SpeechSynthesisUtterance !== "undefined";
    var data = window.OrlandoChatbotData;
    var engine = window.createOrlandoChatbotEngine(data);
    var mount = document.querySelector("[data-orlando-chatbot]");
    var isResponding = false;
    var autoSpeak = false;
    var recognition = null;
    var listening = false;
    var llmAvailable = false;
    var chatHistory = [];

    if (!mount) {
      mount = createElement("div", "chatbot-floating-host");
      document.body.appendChild(mount);
    }

    mount.innerHTML =
      '<div class="chatbot">' +
      '  <div class="chatbot__header">' +
      '    <div>' +
      '      <p class="chatbot__eyebrow">Customer Support</p>' +
      '      <div class="chatbot__presence"><span class="chatbot__presence-dot"></span><span>Online now</span></div>' +
      '      <h1 class="chatbot__title">Orlando Auto Repair Support</h1>' +
      '      <p class="chatbot__subtitle" data-subtitle>Fast help with appointments, services, hours, and common questions.</p>' +
      "    </div>" +
      '    <div class="chatbot__header-actions">' +
      '      <button class="chatbot__toggle" type="button" data-voice-toggle aria-pressed="false">Voice Off</button>' +
      '      <a class="chatbot__header-link" href="' +
      data.company.bookingUrl +
      '" target="_blank" rel="noreferrer">Book</a>' +
      "    </div>" +
      "  </div>" +
      '  <div class="chatbot__messages" data-messages></div>' +
      '  <div class="chatbot__quick-replies" data-quick-replies></div>' +
      '  <form class="chatbot__composer" data-form>' +
      '    <button class="chatbot__icon-button" data-mic type="button" title="Start voice input">Mic</button>' +
      '    <input class="chatbot__input" data-input type="text" placeholder="Tell me what is going on with your car, or ask anything about the shop..." />' +
      '    <button class="chatbot__send" type="submit">Send</button>' +
      "  </form>" +
      "</div>";

    var messages = mount.querySelector("[data-messages]");
    var quickReplies = mount.querySelector("[data-quick-replies]");
    var form = mount.querySelector("[data-form]");
    var input = mount.querySelector("[data-input]");
    var micButton = mount.querySelector("[data-mic]");
    var voiceToggle = mount.querySelector("[data-voice-toggle]");
    var subtitle = mount.querySelector("[data-subtitle]");

    if (!canListen) {
      micButton.disabled = true;
      micButton.textContent = "No Mic";
      micButton.title = "Voice input is not supported in this browser.";
    }

    if (!canSpeak) {
      voiceToggle.disabled = true;
      voiceToggle.textContent = "Voice N/A";
    }

    function scrollToBottom() {
      messages.scrollTop = messages.scrollHeight;
    }

    function setBusy(busy) {
      isResponding = busy;
      input.disabled = busy;
      form.querySelector(".chatbot__send").disabled = busy;
      if (!listening) {
        micButton.disabled = !canListen || busy;
      }
    }

    function setListening(active) {
      listening = active;
      micButton.textContent = active ? "Stop" : canListen ? "Mic" : "No Mic";
      micButton.classList.toggle("chatbot__icon-button--active", active);
      micButton.disabled = !canListen || isResponding;
      if (active) {
        input.placeholder = "Listening...";
      } else {
        input.placeholder = "Tell me what is going on with your car, or ask anything about the shop...";
      }
    }

    function setAutoSpeak(active) {
      autoSpeak = active && canSpeak;
      voiceToggle.textContent = autoSpeak ? "Voice On" : "Voice Off";
      voiceToggle.setAttribute("aria-pressed", autoSpeak ? "true" : "false");
      voiceToggle.classList.toggle("chatbot__toggle--active", autoSpeak);
    }

    function speakText(text) {
      if (!canSpeak || !autoSpeak || !text) {
        return;
      }

      window.speechSynthesis.cancel();
      var utterance = new window.SpeechSynthesisUtterance(text);
      utterance.rate = 1.02;
      utterance.pitch = 1;
      utterance.lang = "en-US";
      window.speechSynthesis.speak(utterance);
    }

    function renderQuickReplies(items) {
      quickReplies.innerHTML = "";
      items.forEach(function (item) {
        var button = createElement("button", "chatbot__chip", escapeHtml(item));
        button.type = "button";
        button.disabled = isResponding;
        button.addEventListener("click", function () {
          input.value = item;
          submitQuery(item);
        });
        quickReplies.appendChild(button);
      });
    }

    function createBubble(role) {
      var wrapper = createElement("article", "chatbot__message chatbot__message--" + role);
      var bubble = createElement("div", "chatbot__bubble");
      wrapper.appendChild(bubble);
      messages.appendChild(wrapper);
      scrollToBottom();
      return bubble;
    }

    function renderUserMessage(text) {
      var bubble = createBubble("user");
      bubble.innerHTML = escapeHtml(text);
      chatHistory.push({ role: "user", content: text });
      if (chatHistory.length > 12) {
        chatHistory.shift();
      }
    }

    function renderTypingIndicator(statusText) {
      var wrapper = createElement("article", "chatbot__message chatbot__message--assistant chatbot__message--thinking");
      wrapper.innerHTML =
        '<div class="chatbot__bubble">' +
        '  <div class="chatbot__thinking">' +
        '    <span class="chatbot__thinking-dot"></span>' +
        '    <span class="chatbot__thinking-dot"></span>' +
        '    <span class="chatbot__thinking-dot"></span>' +
        "  </div>" +
        '  <p class="chatbot__status">' + escapeHtml(statusText || "Thinking") + "</p>" +
        "</div>";
      messages.appendChild(wrapper);
      scrollToBottom();
      return wrapper;
    }

    function buildAssistantHtml(payload, text) {
      var html = "<p>" + escapeHtml(text || "") + "</p>";

      if (payload.actions && payload.actions.length) {
        html += '<div class="chatbot__actions">';
        payload.actions.forEach(function (action) {
          html +=
            '<a class="chatbot__action" href="' +
            action.url +
            '" target="_blank" rel="noreferrer">' +
            escapeHtml(action.label) +
            "</a>";
        });
        html += "</div>";
      }

      return html;
    }

    function humanizeResponse(query, payload) {
      var state = typeof engine.getState === "function" ? engine.getState() : {};
      var normalizedQuery = (query || "").toLowerCase();
      var text = payload.text || "";
      var prefix = "";

      if (payload.intent === "greeting") {
        return text;
      }

      if (payload.intent === "thanks") {
        return text;
      }

      if (payload.intent === "price") {
        prefix = "I want to make sure you get the right estimate. ";
      } else if (payload.intent === "hours") {
        prefix = "Sure. ";
      } else if (payload.intent === "location") {
        prefix = "Absolutely. ";
      } else if (payload.intent === "booking") {
        prefix = "Yes. ";
      } else if (payload.intent === "contact") {
        prefix = "Of course. ";
      } else if (payload.intent === "diagnostic-topic") {
        prefix = "Here is the best guidance I can give you right now. ";
      } else if (payload.intent === "fallback") {
        prefix = "I want to make sure you get the right answer. ";
      } else if (payload.intent === "retrieval" && state.turnCount > 1) {
        prefix = "";
      }

      if (normalizedQuery.indexOf("my car") !== -1 || normalizedQuery.indexOf("battery") !== -1 || normalizedQuery.indexOf("start") !== -1) {
        prefix = "I understand. ";
      }

      return prefix + text;
    }

    async function streamAssistantMessage(query, payload) {
      var bubble = createBubble("assistant");
      var paragraph = createElement("p", "chatbot__stream");
      bubble.appendChild(paragraph);

      var finalText = humanizeResponse(query, payload);
      var chunks = splitIntoChunks(finalText);
      var built = "";

      for (var index = 0; index < chunks.length; index += 1) {
        built += chunks[index];
        paragraph.textContent = built;
        scrollToBottom();
        await wait(index < 6 ? 38 : index < 18 ? 24 : 16);
      }

      bubble.innerHTML = buildAssistantHtml(payload, finalText);
      scrollToBottom();

      chatHistory.push({ role: "assistant", content: finalText });
      if (chatHistory.length > 12) {
        chatHistory.shift();
      }

      if (payload.suggestions && payload.suggestions.length) {
        renderQuickReplies(payload.suggestions);
      }

      speakText(finalText);
    }

    function renderAssistantFromServer(initialPayload) {
      var bubble = createBubble("assistant");
      var paragraph = createElement("p", "chatbot__stream");
      bubble.appendChild(paragraph);
      scrollToBottom();

      var payload = {
        text: "",
        citations: [],
        actions: [],
        suggestions: ["How do I book an appointment?", "What are your hours?"]
      };

      if (initialPayload) {
        payload.intent = initialPayload.intent || null;
      }

      return {
        appendToken: function (token) {
          payload.text += token;
          paragraph.textContent = payload.text;
          scrollToBottom();
        },
        finish: function (finalPayload) {
          payload.text = finalPayload.content || payload.text;
          payload.citations = finalPayload.citations || [];
          payload.actions = finalPayload.actions || [];
          bubble.innerHTML = buildAssistantHtml(payload, payload.text);
          chatHistory.push({ role: "assistant", content: payload.text });
          if (chatHistory.length > 12) {
            chatHistory.shift();
          }
          renderQuickReplies(payload.suggestions);
          speakText(payload.text);
        },
        error: function (message) {
          bubble.innerHTML = buildAssistantHtml(
            {
              citations: [],
              actions: [
                { label: "Book Appointment", url: data.company.bookingUrl },
                { label: "Call Shop", url: data.company.phoneHref }
              ]
            },
            message
          );
        }
      };
    }

    async function detectLlmAvailability() {
      try {
        var response = await fetch("/api/health", { cache: "no-store" });
        if (!response.ok) {
          return;
        }
        var payload = await response.json();
        llmAvailable = Boolean(payload && payload.llmEnabled);
        if (llmAvailable) {
          subtitle.textContent = "Live support assistant for appointments, services, hours, and common questions.";
        }
      } catch (error) {
        llmAvailable = false;
      }
    }

    async function respondWithGroq(query) {
      var response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: query,
          history: chatHistory
        })
      });

      if (!response.ok || !response.body) {
        throw new Error("The Groq chat endpoint is not available.");
      }

      var renderer = renderAssistantFromServer();
      var decoder = new TextDecoder();
      var buffer = "";
      var donePayload = null;
      var reader = response.body.getReader();

      while (true) {
        var read = await reader.read();
        if (read.done) {
          break;
        }

        buffer += decoder.decode(read.value, { stream: true });
        var lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (var index = 0; index < lines.length; index += 1) {
          var line = lines[index].trim();
          if (!line) {
            continue;
          }

          var payload = JSON.parse(line);
          if (payload.type === "token") {
            renderer.appendToken(payload.content || "");
          } else if (payload.type === "done") {
            donePayload = payload;
          } else if (payload.type === "error") {
            throw new Error(payload.message || "Unknown Groq server error.");
          }
        }
      }

      if (donePayload) {
        renderer.finish(donePayload);
        return;
      }

      throw new Error("The Groq response ended unexpectedly.");
    }

    async function respondToQuery(query) {
      setBusy(true);
      var thinkingMessage = renderTypingIndicator(
        llmAvailable
          ? "Checking that for you"
          : "Preparing your answer"
      );
      await wait(260);

      try {
        if (llmAvailable) {
          thinkingMessage.remove();
          await respondWithGroq(query);
        } else {
          var response = engine.respond(query);
          thinkingMessage.remove();
          await streamAssistantMessage(query, response);
        }
      } catch (error) {
        thinkingMessage.remove();
        var fallback = engine.respond(query);
        await streamAssistantMessage(query, fallback);
      }

      setBusy(false);
      input.focus();
    }

    function submitQuery(query) {
      var trimmed = (query || "").trim();
      if (!trimmed || isResponding) {
        return;
      }

      renderUserMessage(trimmed);
      input.value = "";
      respondToQuery(trimmed);
    }

    function startVoiceRecognition() {
      if (!canListen || isResponding) {
        return;
      }

      if (!recognition) {
        recognition = new SpeechRecognition();
        recognition.lang = "en-US";
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

        recognition.addEventListener("start", function () {
          setListening(true);
        });

        recognition.addEventListener("end", function () {
          setListening(false);
        });

        recognition.addEventListener("result", function (event) {
          var transcript = "";
          for (var i = event.resultIndex; i < event.results.length; i += 1) {
            transcript += event.results[i][0].transcript;
          }

          input.value = transcript.trim();

          var lastResult = event.results[event.results.length - 1];
          if (lastResult && lastResult.isFinal) {
            submitQuery(transcript);
          }
        });

        recognition.addEventListener("error", function () {
          setListening(false);
        });
      }

      if (listening) {
        recognition.stop();
        return;
      }

      recognition.start();
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      submitQuery(input.value);
    });

    micButton.addEventListener("click", startVoiceRecognition);
    voiceToggle.addEventListener("click", function () {
      setAutoSpeak(!autoSpeak);
    });

    renderQuickReplies(data.quickReplies);
    detectLlmAvailability();

    streamAssistantMessage("", {
      text:
        "Welcome to Orlando Auto Repair. I can help with appointments, services, hours, warranty, location, and common vehicle questions. Let me know how I can help.",
      citations: [],
      actions: [
        { label: "Book Appointment", url: data.company.bookingUrl },
        { label: "Call " + data.company.phoneDisplay, url: data.company.phoneHref }
      ],
      suggestions: data.quickReplies,
      intent: "greeting"
    });
  });
})();
