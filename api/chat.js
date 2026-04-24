const { data, engine, grounder } = require("../lib");

function writeNdjson(res, payload) {
  res.write(JSON.stringify(payload) + "\n");
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
    /\bpolitic\b/,
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

async function streamGroqCompletion(req, res) {
  res.setHeader("Content-Type", "application/x-ndjson; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Transfer-Encoding", "chunked");

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    writeNdjson(res, {
      type: "error",
      message: "Missing GROQ_API_KEY"
    });
    res.end();
    return;
  }

  let body = "";
  req.on("data", (chunk) => { body += chunk; });
  
  await new Promise((resolve) => req.on("end", resolve));

  let requestBody = {};
  try {
    requestBody = body ? JSON.parse(body) : {};
  } catch (e) {
    requestBody = {};
  }
  
  const message = String(requestBody.message || "").trim();
  const history = Array.isArray(requestBody.history) ? requestBody.history : [];

  if (isOutOfScopeMessage(message)) {
    const reply =
      "I can help with Orlando Auto Repair services, appointments, hours, warranty, location, contact information, and common vehicle questions. If you need help with the shop, I'm happy to assist.";
    writeNdjson(res, { type: "token", content: reply });
    writeNdjson(res, {
      type: "done",
      content: reply,
      citations: [],
      actions: [
        { label: "Book Appointment", url: data.company.bookingUrl },
        { label: "Call Shop", url: data.company.phoneHref }
      ]
    });
    res.end();
    return;
  }

  const grounding = grounder.buildContext(message, history);

  if (!grounding.matches.length || grounding.score < 6) {
    const fallback = engine.respond(message);
    writeNdjson(res, { type: "token", content: fallback.text });
    writeNdjson(res, {
      type: "done",
      content: fallback.text,
      citations: fallback.citations || [],
      actions: fallback.actions || []
    });
    res.end();
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

      const token =
        parsed &&
        parsed.choices &&
        parsed.choices[0] &&
        parsed.choices[0].delta &&
        parsed.choices[0].delta.content
          ? parsed.choices[0].delta.content
          : "";

      if (token) {
        finalText += token;
        writeNdjson(res, { type: "token", content: token });
      }
    }
  }

  writeNdjson(res, {
    type: "done",
    content: finalText.trim(),
    citations: grounding.citations,
    actions: [
      { label: "Book Appointment", url: data.company.bookingUrl },
      { label: "Call Shop", url: data.company.phoneHref }
    ]
  });
  res.end();
}

module.exports = async (req, res) => {
  if (req.method === "GET") {
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Transfer-Encoding", "chunked");
    writeNdjson(res, {
      type: "error",
      message: "Use POST method"
    });
    res.end();
    return;
  }

  try {
    await streamGroqCompletion(req, res);
  } catch (error) {
    res.setHeader("Content-Type", "application/x-ndjson; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    writeNdjson(res, {
      type: "error",
      message: error && error.message ? error.message : "Unknown server error."
    });
    res.end();
  }
};