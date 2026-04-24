const fs = require("fs");
const path = require("path");
const vm = require("vm");

function load(file, globalName) {
  const code = fs.readFileSync(path.join(__dirname, file), "utf8");
  const sandbox = { module: { exports: {} }, exports: {}, console };
  sandbox.globalThis = sandbox;
  vm.runInNewContext(code, sandbox, { filename: file });

  if (sandbox.module && (typeof sandbox.module.exports === "function" || (sandbox.module.exports && Object.keys(sandbox.module.exports).length))) {
    return sandbox.module.exports;
  }
  return sandbox[globalName];
}

const data = load("knowledge-base.js", "OrlandoChatbotData");
const createEngine = load("chatbot-core.js", "createOrlandoChatbotEngine");
const createGrounder = load("grounding.js", "createOrlandoGrounder");
const engine = createEngine(data);
const grounder = createGrounder(data);

module.exports = { data, engine, grounder };