let data, engine, grounder;

try {
  const kbModule = require("./knowledge-base.js");
  const kb = typeof kbModule === 'function' ? kbModule() : (kbModule.default || kbModule);
  data = kb;
  
  const coreModule = require("./chatbot-core.js");
  const createEngine = typeof coreModule === 'function' ? coreModule : (coreModule.default || coreModule.createOrlandoChatbotEngine || coreModule);
  engine = createEngine(data);
  
  const groundModule = require("./grounding.js");
  const createGrounder = typeof groundModule === 'function' ? groundModule : (groundModule.default || groundModule.createOrlandoGrounder || groundModule);
  grounder = createGrounder(data);
} catch (e) {
  console.error("Module load error:", e.message);
  data = { company: {}, quickReplies: [], knowledgeBase: [] };
  engine = { respond: () => ({ text: "Service temporarily unavailable.", actions: [] }) };
  grounder = { buildContext: () => ({ matches: [], contextText: "", score: 0, citations: [] }) };
}

module.exports = { data, engine, grounder };