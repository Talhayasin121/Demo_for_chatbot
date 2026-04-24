const fs = require("fs");
const path = require("path");
const vm = require("vm");

let data, engine, grounder;

try {
  const kbPath = path.join(__dirname, "knowledge-base.js");
  const kbCode = fs.readFileSync(kbPath, "utf8");
  const kbSandbox = { module: { exports: {} }, exports: {}, console };
  kbSandbox.globalThis = kbSandbox;
  vm.runInNewContext(kbCode, kbSandbox, { filename: "knowledge-base.js" });
  const kbExport = kbSandbox.module.exports;
  data = typeof kbExport === 'function' ? kbExport() : kbExport;
  
  const corePath = path.join(__dirname, "chatbot-core.js");
  const coreCode = fs.readFileSync(corePath, "utf8");
  const coreSandbox = { module: { exports: {} }, exports: {}, console };
  coreSandbox.globalThis = coreSandbox;
  vm.runInNewContext(coreCode, coreSandbox, { filename: "chatbot-core.js" });
  const coreExport = coreSandbox.module.exports;
  const createEngine = typeof coreExport === 'function' ? coreExport() : coreExport;
  engine = createEngine(data);
  
  const groundPath = path.join(__dirname, "grounding.js");
  const groundCode = fs.readFileSync(groundPath, "utf8");
  const groundSandbox = { module: { exports: {} }, exports: {}, console };
  groundSandbox.globalThis = groundSandbox;
  vm.runInNewContext(groundCode, groundSandbox, { filename: "grounding.js" });
  const groundExport = groundSandbox.module.exports;
  const createGrounder = typeof groundExport === 'function' ? groundExport() : groundExport;
  grounder = createGrounder(data);
  
  console.log("Loaded data:", data ? "yes" : "no");
  console.log("Loaded engine:", engine ? "yes" : "no");
  console.log("Loaded grounder:", grounder ? "yes" : "no");
} catch (e) {
  console.error("Load error:", e.message, e.stack);
  data = { company: { phoneHref: "tel:+14074125103", bookingUrl: "https://myalp.io/" }, quickReplies: [], knowledgeBase: [] };
  engine = { respond: () => ({ text: "Error loading", actions: [] }) };
  grounder = { buildContext: () => ({ matches: [], contextText: "", score: 0 }) };
}

module.exports = { data, engine, grounder };