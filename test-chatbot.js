var fs = require("fs");
var vm = require("vm");

function load(file, globalName) {
  var code = fs.readFileSync(file, "utf8");
  var sandbox = { module: { exports: {} }, exports: {}, console: console };
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

var data = load("./knowledge-base.js", "OrlandoChatbotData");
var createEngine = load("./chatbot-core.js", "createOrlandoChatbotEngine");
var engine = createEngine(data);

[
  "Hi",
  "Do you do AC repair?",
  "How much would that cost?",
  "What are your Saturday hours?",
  "And where are you located?",
  "My battery keeps dying overnight",
  "Can you diagnose it for me?",
  "Do you service Mercedes?",
  "Thanks"
].forEach(function (question) {
  var response = engine.respond(question);
  console.log("Q:", question);
  console.log("A:", response.text);
  if (response.citations.length) {
    console.log(
      "Citations:",
      response.citations.map(function (item) {
        return item.label;
      }).join(" | ")
    );
  }
  console.log("State:", JSON.stringify(engine.getState()));
  console.log("---");
});
