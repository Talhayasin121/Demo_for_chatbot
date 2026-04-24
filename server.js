const http = require("http");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

function load(file, globalName) {
  const code = fs.readFileSync(path.join(__dirname, file), "utf8");
  const sandbox = { module: { exports: {} }, exports: {}, console };
  sandbox.globalThis = sandbox;
  vm.runInNewContext(code, sandbox, { filename: file });

  if (
    sandbox.module &&
    (typeof sandbox.module.exports === "function" ||
      (sandbox.module.exports && Object.keys(sandbox.module.exports).length))
  ) {
    return sandbox.module.exports;
  }

  return sandbox[globalName];
}

const data = load("./knowledge-base.js", "OrlandoChatbotData");
const createEngine = load("./chatbot-core.js", "createOrlandoChatbotEngine");
const createGrounder = load("./grounding.js", "createOrlandoGrounder");
const engine = createEngine(data);
const grounder = createGrounder(data);

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8"
};

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  response.end(JSON.stringify(payload));
}

function writeNdjson(response, payload) {
  response.write(JSON.stringify(payload) + "\n");
}

function getClientMessages(history, message) {
  const trimmedHistory = Array.isArray(history) ? history.slice(-8) : [];
  return trimmedHistory
    .map((entry) => ({
      role: entry.role === "assistant" ? "assistant" : "user",
      content: String(entry.content || "")
    }))
    .concat([{ role: "user", content: message }]);
}

function buildSystemPrompt(contextText) {
  return [
    "You are the customer service assistant for Orlando Auto Repair.",
    "Speak like a polished production support agent: warm, clear, concise, and confident.",
    "Use only the verified company information provided in the trusted context.",
    "Never mention the website, source material, internal context, retrieval, documents, or citations.",
    "Answer in first-person company voice when appropriate, such as 'we offer' or 'our hours are'.",
    "If a detail is not confirmed, do not guess. Instead say you would be happy to help with the next best step, such as calling the shop or booking an appointment.",
    "Do not invent prices, repair timelines, hidden policies, or remote mechanical diagnoses.",
    "If the user describes vehicle symptoms, be helpful but do not claim to diagnose the vehicle remotely.",
    "If the user asks for unrelated help such as math, politics, weather, medicine, law, homework, or general chat, politely refuse and redirect them to Orlando Auto Repair support topics only.",
    "Do not use phrases like 'the website says', 'based on the context', or 'I found'.",
    "",
    "Trusted company information:",
    contextText || "No verified website context was found."
  ].join("\n");
}

function isOutOfScopeMessage(message) {
  const text = String(message || "").toLowerCase();
  const patterns = [
    /\bmath\b/,
    /\balgebra\b/,
    /\bgeometry\b/,
    /\bcalculus\b/,
    /\bequation\b/,
    /\bweather\b/,
    /\bpolitic/,
    /\bvote\b/,
    /\bmedical\b/,
    /\bdoctor\b/,
    /\blawyer\b/,
    /\bhomework\b/,
    /\bmovie\b/,
    /\bpizza\b/,
    /\bsolve\b.*\b\d/,
    /\b\d+\s*[\+\-\*\/]\s*\d+\b/
  ];

  return patterns.some((pattern) => pattern.test(text));
}

async function streamGroqCompletion(response, requestBody) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    writeNdjson(response, {
      type: "error",
      message: "Missing GROQ_API_KEY on the server."
    });
    return;
  }

  const message = String(requestBody.message || "").trim();
  const history = Array.isArray(requestBody.history) ? requestBody.history : [];

  if (isOutOfScopeMessage(message)) {
    const reply =
      "I can help with Orlando Auto Repair services, appointments, hours, warranty, location, contact information, and common vehicle questions. If you need help with the shop, I’m happy to assist.";
    writeNdjson(response, { type: "token", content: reply });
    writeNdjson(response, {
      type: "done",
      content: reply,
      citations: [],
      actions: [
        { label: "Book Appointment", url: data.company.bookingUrl },
        { label: "Call Shop", url: data.company.phoneHref }
      ]
    });
    return;
  }

  const grounding = grounder.buildContext(message, history);

  if (!grounding.matches.length || grounding.score < 6) {
    const fallback = engine.respond(message);
    writeNdjson(response, { type: "token", content: fallback.text });
    writeNdjson(response, {
      type: "done",
      content: fallback.text,
      citations: fallback.citations || [],
      actions: fallback.actions || []
    });
    return;
  }

  const clientMessages = [
    { role: "system", content: buildSystemPrompt(grounding.contextText) }
  ].concat(getClientMessages(history, message));

  const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + apiKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL || "llama-3.1-8b-instant",
      messages: clientMessages,
      temperature: 0.25,
      max_completion_tokens: 500,
      stream: true
    })
  });

  if (!groqResponse.ok || !groqResponse.body) {
    const errorText = await groqResponse.text();
    throw new Error("Groq API error: " + errorText);
  }

  const decoder = new TextDecoder();
  let buffer = "";
  let finalText = "";

  for await (const chunk of groqResponse.body) {
    buffer += decoder.decode(chunk, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line.startsWith("data:")) {
        continue;
      }

      const dataLine = line.slice(5).trim();
      if (!dataLine || dataLine === "[DONE]") {
        continue;
      }

      let parsed;
      try {
        parsed = JSON.parse(dataLine);
      } catch (error) {
        continue;
      }

      const token = parsed &&
        parsed.choices &&
        parsed.choices[0] &&
        parsed.choices[0].delta &&
        parsed.choices[0].delta.content
        ? parsed.choices[0].delta.content
        : "";

      if (token) {
        finalText += token;
        writeNdjson(response, { type: "token", content: token });
      }
    }
  }

  writeNdjson(response, {
    type: "done",
    content: finalText.trim(),
    citations: grounding.citations,
    actions: [
      { label: "Book Appointment", url: data.company.bookingUrl },
      { label: "Call Shop", url: data.company.phoneHref }
    ]
  });
}

function serveStatic(request, response) {
  const requestPath = request.url === "/" ? "/index.html" : request.url.split("?")[0];
  const safePath = path.normalize(requestPath).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(__dirname, safePath);

  if (!filePath.startsWith(__dirname)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, file) => {
    if (error) {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }

    response.writeHead(200, {
      "Content-Type": MIME_TYPES[path.extname(filePath)] || "application/octet-stream",
      "Cache-Control": "no-store"
    });
    response.end(file);
  });
}

const server = http.createServer(async (request, response) => {
  if (request.method === "GET" && request.url === "/api/health") {
    return sendJson(response, 200, {
      ok: true,
      llmEnabled: Boolean(process.env.GROQ_API_KEY),
      model: process.env.GROQ_MODEL || "llama-3.1-8b-instant"
    });
  }

  if (request.method === "POST" && request.url === "/api/chat") {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
    });

    request.on("end", async () => {
      response.writeHead(200, {
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Cache-Control": "no-store",
        Connection: "keep-alive"
      });

      try {
        const parsed = body ? JSON.parse(body) : {};
        await streamGroqCompletion(response, parsed);
      } catch (error) {
        writeNdjson(response, {
          type: "error",
          message: error && error.message ? error.message : "Unknown server error."
        });
      }
      response.end();
    });
    return;
  }

  if (request.method === "GET") {
    return serveStatic(request, response);
  }

  response.writeHead(405, { "Content-Type": "text/plain; charset=utf-8" });
  response.end("Method not allowed");
});

const port = Number(process.env.PORT || 8000);
server.listen(port, () => {
  console.log("Server running on http://localhost:" + port);
});
