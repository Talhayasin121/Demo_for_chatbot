# Orlando Auto Repair Chatbot

This is a grounded chatbot for Orlando Auto Repair's website.

It now supports two modes:

1. Local grounded mode with no API key
2. Groq-powered conversational mode with server-side streaming

Both modes follow the same Karpathy-style company wiki idea:

1. Turn company information into a small, structured knowledge base.
2. Retrieve the most relevant website chunks for the user's question.
3. Answer from retrieved evidence.
4. Refuse or redirect when the website does not support a claim.

## Why I did not use LangChain

LangChain would add weight here without solving the main problem. This bot is:

- static
- free to host
- easy to audit
- deterministic
- easier to embed into a company site

For this use case, plain JavaScript is the better choice.

## Files

- `index.html`: demo page
- `styles.css`: UI styling
- `knowledge-base.js`: company facts and content chunks
- `chatbot-core.js`: retrieval engine and guardrails
- `grounding.js`: retrieval and grounding helper used by the Groq backend
- `app.js`: widget UI
- `server.js`: local web server and Groq streaming API
- `test-chatbot.js`: quick local sanity test
- `.env.example`: environment variable template

## Guardrails

The chatbot is deliberately strict:

- It only answers from the Orlando Auto Repair knowledge base.
- It does not invent pricing, quotes, or unsupported policies.
- It redirects users to phone or booking when the site does not provide enough detail.
- It stays in scope: services, booking, hours, warranty, location, contact info, certifications, and blog topics that appear on the site.

## Local test

Run:

```powershell
node .\test-chatbot.js
```

## Release test suite

The project now includes a 100-scenario release suite covering:

- greetings and support tone
- services and service-specific answers
- hours, location, contact, warranty, and booking
- pricing guardrails
- follow-up context handling
- symptom conversations without remote diagnosis
- unsupported-policy fallback behavior
- off-topic refusal behavior
- deployment file checks

Run it with:

```powershell
node .\release-tests.js
```

Or with the package script:

```powershell
npm.cmd test
```

## Run locally without Groq

```powershell
node .\server.js
```

Then open `http://localhost:8000`.

In this mode the app still works, but it uses the local grounded engine instead of the Groq LLM.

## Run locally with Groq

1. Copy `.env.example` to `.env`
2. Put your Groq API key in `GROQ_API_KEY`
3. Start the server with the variables loaded

In PowerShell:

```powershell
$env:GROQ_API_KEY="your_key_here"
$env:GROQ_MODEL="llama-3.1-8b-instant"
node .\server.js
```

Then open `http://localhost:8000`.

The UI will automatically switch to the Groq streaming mode when the server reports that `GROQ_API_KEY` is available.

## Free deployment options

## Groq notes

The Groq key is used only on the server side. It is never exposed to the browser.

The backend uses Groq streaming chat completions so replies can appear token by token in real time.

Default model:

- `llama-3.1-8b-instant`

I picked that as the default because Groq documents it as a low-latency model suited to real-time conversational interfaces.

## Deployment

### Option 1: Vercel or another Node host

For the Groq version, the easiest deployment path is a Node-capable host where you can set environment variables.

1. Upload this folder to a GitHub repo.
2. Deploy it to a Node host.
3. Set `GROQ_API_KEY` in the host's environment settings.
4. Optionally set `GROQ_MODEL`.
5. Start command: `node server.js`

### Static-only deployment

If you do not want any backend, you can still deploy the project as a static site. In that case the app falls back to the local grounded engine and does not use Groq.

## Deployment checklist

Before deploying:

1. Set `GROQ_API_KEY` in the host environment.
2. Optionally set `GROQ_MODEL`.
3. Start the app with `node server.js` or the `npm start` script.
4. Run the 100-scenario suite and confirm all tests pass.
5. Rotate any temporary API keys used during development.

## Embedding on the company website

The production-ready way to embed this on a client site is with the hosted widget script.

After you deploy this app, add this one tag to the client website before the closing `</body>` tag:

```html
<script
  src="https://chat.yourdomain.com/widget.js"
  data-title="Chat With Orlando Auto Repair"
  data-subtitle="Ask about appointments, services, hours, and more."
  data-button-label="Chat"
  data-position="right"
></script>
```

That script creates a floating launcher and opens the chatbot inside a secure iframe powered by your hosted app.

### Optional widget attributes

- `data-title`: panel title
- `data-subtitle`: short helper text
- `data-button-label`: launcher button text
- `data-position`: `right` or `left`
- `data-open`: `true` to open by default
- `data-iframe-path`: custom iframe page path if you do not want `/embed.html`

### Embed architecture

- `widget.js`: lightweight launcher script for the client website
- `embed.html`: isolated iframe page that renders the chatbot
- `server.js`: serves both the widget files and the Groq-backed chat API

### If you still want a direct inline embed

You can also embed the full chat page with an iframe:

```html
<iframe
  src="https://chat.yourdomain.com/embed.html"
  title="Orlando Auto Repair Support"
  style="width:100%;max-width:420px;height:700px;border:0;border-radius:20px;"
  loading="lazy"
></iframe>
```

### Legacy direct-file approach

If the company website allows custom HTML and JavaScript and you are hosting the files on the same origin, you can add these tags before the closing `</body>` tag:

```html
<link rel="stylesheet" href="/chatbot/styles.css" />
<script src="/chatbot/knowledge-base.js"></script>
<script src="/chatbot/chatbot-core.js"></script>
<script src="/chatbot/app.js"></script>
```

Then add this container where you want the chatbot to appear:

```html
<div data-orlando-chatbot></div>
```

For most client websites, the hosted `widget.js` approach is the best option.

## Important limitation

Because you asked for a completely free solution, this bot is retrieval-first instead of using a paid LLM. That is actually a good tradeoff for a company website chatbot:

- lower cost
- easier deployment
- lower hallucination risk
- faster responses

If later you want more conversational answers, we can add an optional LLM layer on top of the same retrieval system. The current structure is already ready for that upgrade.
