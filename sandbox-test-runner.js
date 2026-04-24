const fs = require("fs");
const vm = require("vm");

function load(file, globalName) {
  const code = fs.readFileSync(file, "utf8");
  const sandbox = { module: { exports: {} }, exports: {}, console };
  sandbox.globalThis = sandbox;
  vm.runInNewContext(code, sandbox, { filename: file });

  const out = sandbox.module.exports;
  if (typeof out === "function" || (out && Object.keys(out).length)) {
    return out;
  }

  return sandbox[globalName];
}

const data = load("./knowledge-base.js", "OrlandoChatbotData");
const createEngine = load("./chatbot-core.js", "createOrlandoChatbotEngine");
const engine = createEngine(data);

[
  "What services do you offer?",
  "What are your hours on Saturday?",
  "Do you offer a warranty?",
  "How much does a brake job cost?",
  "Do you service Mercedes?",
  "My battery keeps dying overnight",
  "Where are you located?"
].forEach((question) => {
  const response = engine.respond(question);
  console.log("Q:", question);
  console.log("A:", response.text);
  console.log(
    "C:",
    (response.citations || []).map((citation) => citation.label).join(" | ") || "none"
  );
  console.log("---");
});
