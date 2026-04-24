let data, engine, grounder;

try {
  data = require("../knowledge-base.js");
  engine = require("../chatbot-core.js").createOrlandoChatbotEngine(data);
  grounder = require("../grounding.js").createOrlandoGrounder(data);
} catch (e) {
  console.error("Failed to load modules:", e.message);
  data = { company: {}, quickReplies: [], knowledgeBase: [] };
  engine = { respond: () => ({ text: "Service temporarily unavailable.", actions: [] }) };
  grounder = { buildContext: () => ({ matches: [], contextText: "", score: 0, citations: [] }) };
}

module.exports = { data, engine, grounder };