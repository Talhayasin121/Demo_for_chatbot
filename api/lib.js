let data, engine, grounder;

try {
  data = require("./knowledge-base.js");
  engine = require("./chatbot-core.js").createOrlandoChatbotEngine(data);
  grounder = require("./grounding.js").createOrlandoGrounder(data);
  console.log("loaded data:", data ? "yes" : "no");
} catch (e) {
  console.error("Module load error:", e.message, e.stack);
  data = { company: {}, quickReplies: [], knowledgeBase: [] };
  engine = { respond: () => ({ text: "Service temporarily unavailable.", actions: [] }) };
  grounder = { buildContext: () => ({ matches: [], contextText: "", score: 0, citations: [] }) };
}

module.exports = { data, engine, grounder };