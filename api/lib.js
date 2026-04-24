try {
  const kb = require("./knowledge-base.js");
  data = typeof kb === 'function' ? kb() : kb;
  
  const core = require("./chatbot-core.js");
  const createEngine = typeof core === 'function' ? core() : core;
  engine = createEngine(data);
  
  const ground = require("./grounding.js");
  const createGrounder = typeof ground === 'function' ? ground() : ground;
  grounder = createGrounder(data);
  
  console.log("Data keys:", Object.keys(data || {}).slice(0, 5));
} catch (e) {
  console.error("Error:", e.message);
  data = { company: { phoneHref: "tel:+14074125103", bookingUrl: "https://myalp.io/" }, quickReplies: [], knowledgeBase: [] };
  engine = { respond: () => ({ text: "Error", actions: [] }) };
  grounder = { buildContext: () => ({ matches: [], contextText: "", score: 0 }) };
}

module.exports = { data, engine, grounder };