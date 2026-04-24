const fs = require("fs");
const path = require("path");
const vm = require("vm");

function load(file, globalName) {
  const code = fs.readFileSync(path.join(__dirname, file), "utf8");
  const sandbox = { module: { exports: {} }, exports: {}, console };
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

function includesAll(text, phrases) {
  const lowered = String(text || "").toLowerCase();
  return phrases.every((phrase) => lowered.includes(String(phrase).toLowerCase()));
}

function includesNone(text, phrases) {
  const lowered = String(text || "").toLowerCase();
  return phrases.every((phrase) => !lowered.includes(String(phrase).toLowerCase()));
}

function createRunner() {
  const data = load("./knowledge-base.js", "OrlandoChatbotData");
  const createEngine = load("./chatbot-core.js", "createOrlandoChatbotEngine");
  const createGrounder = load("./grounding.js", "createOrlandoGrounder");
  const grounder = createGrounder(data);

  function freshEngine() {
    return createEngine(data);
  }

  return { data, freshEngine, grounder };
}

function runScenario(runner, scenario) {
  const engine = runner.freshEngine();
  let response = null;

  (scenario.turns || []).forEach((turn) => {
    response = engine.respond(turn);
  });

  const finalText = response && response.text ? response.text : "";
  const checks = scenario.checks || [];
  const failures = [];

  checks.forEach((check) => {
    const passed = check.test({
      response,
      text: finalText,
      engine,
      data: runner.data,
      grounder: runner.grounder
    });

    if (!passed) {
      failures.push(check.message);
    }
  });

  return {
    id: scenario.id,
    name: scenario.name,
    passed: failures.length === 0,
    failures
  };
}

function mkCheck(message, test) {
  return { message, test };
}

const runner = createRunner();
const scenarios = [
  {
    id: 1,
    name: "Greeting introduces support scope",
    turns: ["Hi"],
    checks: [
      mkCheck("should welcome the user", ({ text }) => includesAll(text, ["welcome", "orlando auto repair"])),
      mkCheck("should avoid source language", ({ text }) => includesNone(text, ["website says", "based on the website"]))
    ]
  },
  {
    id: 2,
    name: "Hello keeps support tone",
    turns: ["Hello there"],
    checks: [
      mkCheck("should mention help topics", ({ text }) => includesAll(text, ["services", "hours", "appointments"])),
      mkCheck("should avoid citations in wording", ({ text }) => includesNone(text, ["source", "citation"]))
    ]
  },
  {
    id: 3,
    name: "General services overview",
    turns: ["What services do you offer?"],
    checks: [
      mkCheck("should mention maintenance", ({ text }) => includesAll(text, ["maintenance"])),
      mkCheck("should mention brakes", ({ text }) => includesAll(text, ["brake"])),
      mkCheck("should mention diagnostics", ({ text }) => includesAll(text, ["diagnostics"])),
      mkCheck("should use company voice", ({ text }) => includesAll(text, ["we offer"]))
    ]
  },
  {
    id: 4,
    name: "AC repair maps to specific service",
    turns: ["Do you do AC repair?"],
    checks: [
      mkCheck("should confirm AC repair", ({ text }) => includesAll(text, ["ac repair"])),
      mkCheck("should mention refrigerant or compressor detail", ({ text }) => includesAll(text, ["refrigerant"]))
    ]
  },
  {
    id: 5,
    name: "Brake repair maps to specific service",
    turns: ["Do you handle brake repair?"],
    checks: [
      mkCheck("should confirm brake work", ({ text }) => includesAll(text, ["brake"])),
      mkCheck("should mention pads or rotors", ({ text }) => includesAll(text, ["pads"]))
    ]
  },
  {
    id: 6,
    name: "Tire services",
    turns: ["Can you help with tire repair?"],
    checks: [
      mkCheck("should mention tire repair", ({ text }) => includesAll(text, ["tire"])),
      mkCheck("should mention puncture or rotation", ({ text }) => includesAll(text, ["puncture"]))
    ]
  },
  {
    id: 7,
    name: "Wheel alignment service",
    turns: ["Do you offer wheel alignments?"],
    checks: [
      mkCheck("should confirm alignments", ({ text }) => includesAll(text, ["alignment"])),
      mkCheck("should mention handling or tire wear", ({ text }) => includesAll(text, ["handling"]))
    ]
  },
  {
    id: 8,
    name: "Oil change service",
    turns: ["Do you do oil changes?"],
    checks: [
      mkCheck("should confirm oil changes", ({ text }) => includesAll(text, ["oil"])),
      mkCheck("should mention filter", ({ text }) => includesAll(text, ["filter"]))
    ]
  },
  {
    id: 9,
    name: "Diagnostics service",
    turns: ["Do you offer diagnostics?"],
    checks: [
      mkCheck("should confirm diagnostics", ({ text }) => includesAll(text, ["diagnostics"])),
      mkCheck("should mention inspection or issue identification", ({ text }) => includesAll(text, ["identify"]))
    ]
  },
  {
    id: 10,
    name: "Saturday hours",
    turns: ["What are your Saturday hours?"],
    checks: [
      mkCheck("should state Saturday hours", ({ text }) => includesAll(text, ["8:00 am", "2:00 pm"])),
      mkCheck("should use our-hours voice", ({ text }) => includesAll(text, ["our hours"]))
    ]
  },
  {
    id: 11,
    name: "Sunday closed",
    turns: ["Are you open on Sunday?"],
    checks: [
      mkCheck("should say Sunday closed", ({ text }) => includesAll(text, ["sunday", "closed"]))
    ]
  },
  {
    id: 12,
    name: "Weekday hours",
    turns: ["What time do you open on weekdays?"],
    checks: [
      mkCheck("should mention Monday to Friday", ({ text }) => includesAll(text, ["monday to friday"])),
      mkCheck("should mention 6:00 PM close", ({ text }) => includesAll(text, ["6:00 pm"]))
    ]
  },
  {
    id: 13,
    name: "Location response",
    turns: ["Where are you located?"],
    checks: [
      mkCheck("should include address", ({ text }) => includesAll(text, ["3327 w colonial dr", "orlando", "32808"]))
    ]
  },
  {
    id: 14,
    name: "Directions intent",
    turns: ["How do I find the shop?"],
    checks: [
      mkCheck("should include address for directions", ({ text }) => includesAll(text, ["colonial dr"]))
    ]
  },
  {
    id: 15,
    name: "Contact phone response",
    turns: ["What is your phone number?"],
    checks: [
      mkCheck("should include phone number", ({ text }) => includesAll(text, ["407", "412", "5103"]))
    ]
  },
  {
    id: 16,
    name: "Contact email response",
    turns: ["How can I email you?"],
    checks: [
      mkCheck("should include email", ({ text }) => includesAll(text, ["contact@orlandoautorepair.com"]))
    ]
  },
  {
    id: 17,
    name: "Booking response",
    turns: ["How do I book an appointment?"],
    checks: [
      mkCheck("should mention booking or calling", ({ text }) => includesAll(text, ["book online", "call"]))
    ]
  },
  {
    id: 18,
    name: "Schedule synonym routes to booking",
    turns: ["I want to schedule service"],
    checks: [
      mkCheck("should answer with booking guidance", ({ text }) => includesAll(text, ["book", "call"]))
    ]
  },
  {
    id: 19,
    name: "Warranty response",
    turns: ["Do you offer a warranty?"],
    checks: [
      mkCheck("should mention NAPA", ({ text }) => includesAll(text, ["napa"])),
      mkCheck("should mention 24 months or 24,000 miles", ({ text }) => includesAll(text, ["24 months", "24,000 miles"]))
    ]
  },
  {
    id: 20,
    name: "Makes and models response",
    turns: ["Do you service BMW?"],
    checks: [
      mkCheck("should confirm all makes and models", ({ text }) => includesAll(text, ["all makes and models"]))
    ]
  },
  {
    id: 21,
    name: "Mercedes response",
    turns: ["Do you service Mercedes?"],
    checks: [
      mkCheck("should confirm Mercedes support", ({ text }) => includesAll(text, ["all makes and models"]))
    ]
  },
  {
    id: 22,
    name: "ASE certification response",
    turns: ["Are your technicians ASE certified?"],
    checks: [
      mkCheck("should mention ASE", ({ text }) => includesAll(text, ["ase"])),
      mkCheck("should mention master", ({ text }) => includesAll(text, ["master"]))
    ]
  },
  {
    id: 23,
    name: "Buy or sell cars",
    turns: ["Can you help me sell my car?"],
    checks: [
      mkCheck("should mention Orlando Preowned", ({ text }) => includesAll(text, ["orlando preowned"]))
    ]
  },
  {
    id: 24,
    name: "Routine maintenance interval",
    turns: ["How often should routine maintenance be done?"],
    checks: [
      mkCheck("should mention 5,000 to 10,000 miles", ({ text }) => includesAll(text, ["5,000", "10,000"]))
    ]
  },
  {
    id: 25,
    name: "Oil change interval",
    turns: ["How often should I get an oil change?"],
    checks: [
      mkCheck("should mention manufacturer guidelines", ({ text }) => includesAll(text, ["manufacturer"])),
      mkCheck("should mention 3,000 to 5,000", ({ text }) => includesAll(text, ["3,000", "5,000"]))
    ]
  },
  {
    id: 26,
    name: "Tire rotation interval",
    turns: ["How often should tires be rotated?"],
    checks: [
      mkCheck("should mention 5,000 to 7,500 miles", ({ text }) => includesAll(text, ["5,000", "7,500"]))
    ]
  },
  {
    id: 27,
    name: "Check engine diagnostic details",
    turns: ["What does a check engine diagnostic include?"],
    checks: [
      mkCheck("should mention reading codes", ({ text }) => includesAll(text, ["reading", "codes"])),
      mkCheck("should mention repair plan", ({ text }) => includesAll(text, ["repair plan"]))
    ]
  },
  {
    id: 28,
    name: "No-start article support",
    turns: ["My car won't start"],
    checks: [
      mkCheck("should mention no-start guidance", ({ text }) => includesAll(text, ["no-start"]) || includesAll(text, ["start"])),
      mkCheck("should avoid remote diagnosis certainty", ({ text }) => includesAll(text, ["cannot diagnose"]) || includesAll(text, ["diagnostics"]))
    ]
  },
  {
    id: 29,
    name: "Battery drain support",
    turns: ["My battery keeps dying overnight"],
    checks: [
      mkCheck("should mention parasitic draw", ({ text }) => includesAll(text, ["parasitic draw"])),
      mkCheck("should avoid remote diagnosis", ({ text }) => includesAll(text, ["cannot diagnose"]))
    ]
  },
  {
    id: 30,
    name: "Follow-up diagnosis after symptom",
    turns: ["My battery keeps dying overnight", "Can you diagnose it for me?"],
    checks: [
      mkCheck("should keep no-remote-diagnosis guardrail", ({ text }) => includesAll(text, ["cannot diagnose"])),
      mkCheck("should point to diagnostics", ({ text }) => includesAll(text, ["diagnostics"]))
    ]
  },
  {
    id: 31,
    name: "Pricing guardrail after AC follow-up",
    turns: ["Do you do AC repair?", "How much would that cost?"],
    checks: [
      mkCheck("should avoid making up prices", ({ text }) => includesAll(text, ["do not provide fixed prices"])),
      mkCheck("should mention estimate next step", ({ text }) => includesAll(text, ["estimate", "book an appointment"]))
    ]
  },
  {
    id: 32,
    name: "Pricing guardrail for brakes",
    turns: ["How much is a brake job?"],
    checks: [
      mkCheck("should refuse instant quote", ({ text }) => includesAll(text, ["do not provide fixed prices"])),
      mkCheck("should mention call or appointment", ({ text }) => includesAll(text, ["call", "appointment"]))
    ]
  },
  {
    id: 33,
    name: "Pricing guardrail for diagnostics",
    turns: ["What does diagnostics cost?"],
    checks: [
      mkCheck("should avoid price fabrication", ({ text }) => includesAll(text, ["do not provide fixed prices"]))
    ]
  },
  {
    id: 34,
    name: "Estimate language for oil change",
    turns: ["How much is an oil change?"],
    checks: [
      mkCheck("should avoid exact oil change pricing", ({ text }) => includesAll(text, ["estimate"]))
    ]
  },
  {
    id: 35,
    name: "Follow-up Saturday after hours context",
    turns: ["What are your hours?", "What about Saturday?"],
    checks: [
      mkCheck("should answer Saturday hours in follow-up", ({ text }) => includesAll(text, ["saturday", "2:00 pm"]))
    ]
  },
  {
    id: 36,
    name: "Follow-up location after hours",
    turns: ["What are your hours?", "And where are you located?"],
    checks: [
      mkCheck("should answer location not repeat hours", ({ text }) => includesAll(text, ["colonial dr"])),
      mkCheck("should not only talk about hours", ({ text }) => !includesAll(text, ["monday to friday", "sunday closed"]))
    ]
  },
  {
    id: 37,
    name: "Follow-up price after brake service",
    turns: ["Do you handle brake repair?", "How much would that cost?"],
    checks: [
      mkCheck("should keep brake context", ({ text }) => includesAll(text, ["brake"])),
      mkCheck("should refuse pricing", ({ text }) => includesAll(text, ["estimate"]))
    ]
  },
  {
    id: 38,
    name: "Follow-up make after services",
    turns: ["What services do you offer?", "Do you service Toyota?"],
    checks: [
      mkCheck("should answer makes/models", ({ text }) => includesAll(text, ["all makes and models"]))
    ]
  },
  {
    id: 39,
    name: "Follow-up booking after location",
    turns: ["Where are you located?", "Can I book online?"],
    checks: [
      mkCheck("should answer booking", ({ text }) => includesAll(text, ["book online"]))
    ]
  },
  {
    id: 40,
    name: "Follow-up warranty after services",
    turns: ["Do you do AC repair?", "Do you offer a warranty?"],
    checks: [
      mkCheck("should answer warranty cleanly", ({ text }) => includesAll(text, ["napa", "24 months"]))
    ]
  },
  {
    id: 41,
    name: "Open today phrasing",
    turns: ["Are you open today?"],
    checks: [
      mkCheck("should provide hours rather than guessing day status", ({ text }) => includesAll(text, ["our hours"]))
    ]
  },
  {
    id: 42,
    name: "Phone and email in one response",
    turns: ["How can I contact you?"],
    checks: [
      mkCheck("should include phone", ({ text }) => includesAll(text, ["407"])),
      mkCheck("should include email", ({ text }) => includesAll(text, ["contact@"]))
    ]
  },
  {
    id: 43,
    name: "Reserve appointment synonym",
    turns: ["Can I reserve a time?"],
    checks: [
      mkCheck("should treat reserve as booking", ({ text }) => includesAll(text, ["book", "call"]))
    ]
  },
  {
    id: 44,
    name: "Hours wording should avoid website mention",
    turns: ["When are you open?"],
    checks: [
      mkCheck("should avoid source language", ({ text }) => includesNone(text, ["website", "source", "found"]))
    ]
  },
  {
    id: 45,
    name: "Contact wording should avoid website mention",
    turns: ["What's your email?"],
    checks: [
      mkCheck("should avoid website mention", ({ text }) => includesNone(text, ["website", "source"]))
    ]
  },
  {
    id: 46,
    name: "Warranty wording should avoid website mention",
    turns: ["Tell me about your warranty"],
    checks: [
      mkCheck("should avoid website mention", ({ text }) => includesNone(text, ["website", "according to"]))
    ]
  },
  {
    id: 47,
    name: "Off-topic weather",
    turns: ["What is the weather today?"],
    checks: [
      mkCheck("should stay in support scope", ({ text }) => includesAll(text, ["services", "hours"]) || includesAll(text, ["best next step"]))
    ]
  },
  {
    id: 48,
    name: "Off-topic politics",
    turns: ["Who should I vote for?"],
    checks: [
      mkCheck("should refuse off-topic politely", ({ text }) => includesAll(text, ["can help"]) && includesNone(text, ["vote for"]))
    ]
  },
  {
    id: 49,
    name: "Off-topic math",
    turns: ["Can you solve 12 + 18 for me?"],
    checks: [
      mkCheck("should refuse math help", ({ text }) => includesAll(text, ["orlando auto repair"]) || includesAll(text, ["services"])),
      mkCheck("should not invite math chat", ({ text }) => includesNone(text, ["happy to chat about math", "what's on your mind", "math-related question"]))
    ]
  },
  {
    id: 50,
    name: "Off-topic medical",
    turns: ["I have a fever what should I do"],
    checks: [
      mkCheck("should avoid medical advice", ({ text }) => includesNone(text, ["take", "doctor"]) || includesAll(text, ["can help"]))
    ]
  },
  {
    id: 51,
    name: "Unknown policy fallback",
    turns: ["Do you offer loaner cars?"],
    checks: [
      mkCheck("should avoid guessing on unknown policy", ({ text }) => includesAll(text, ["do not want to guess"]) || includesAll(text, ["confirm the right answer"])),
      mkCheck("should mention call or appointment", ({ text }) => includesAll(text, ["call"]) || includesAll(text, ["appointment"]))
    ]
  },
  {
    id: 52,
    name: "Unknown financing fallback",
    turns: ["Do you offer financing?"],
    checks: [
      mkCheck("should avoid inventing financing", ({ text }) => includesAll(text, ["do not want to guess"]) || includesAll(text, ["confirm the right answer"]))
    ]
  },
  {
    id: 53,
    name: "Unknown towing fallback",
    turns: ["Do you offer towing?"],
    checks: [
      mkCheck("should avoid inventing towing", ({ text }) => includesAll(text, ["do not want to guess"]) || includesAll(text, ["confirm the right answer"]))
    ]
  },
  {
    id: 54,
    name: "Unknown walk-in policy fallback",
    turns: ["Can I walk in without an appointment?"],
    checks: [
      mkCheck("should avoid unsupported walk-in policy", ({ text }) => includesAll(text, ["do not want to guess"]) || includesAll(text, ["book an appointment"]))
    ]
  },
  {
    id: 55,
    name: "Unknown payment methods fallback",
    turns: ["Do you accept Apple Pay?"],
    checks: [
      mkCheck("should avoid payment speculation", ({ text }) => includesAll(text, ["do not want to guess"]) || includesAll(text, ["call"]))
    ]
  },
  {
    id: 56,
    name: "Unknown same-day service fallback",
    turns: ["Can you finish repairs same day?"],
    checks: [
      mkCheck("should avoid timeline fabrication", ({ text }) => includesAll(text, ["do not want to guess"]) || includesAll(text, ["confirm the right answer"]))
    ]
  },
  {
    id: 57,
    name: "Unknown warranty transfer fallback",
    turns: ["Is the warranty transferable?"],
    checks: [
      mkCheck("should avoid unsupported warranty details", ({ text }) => includesAll(text, ["do not want to guess"]) || includesAll(text, ["call"]))
    ]
  },
  {
    id: 58,
    name: "Alignment symptom question",
    turns: ["My steering wheel is off center, do you do that?"],
    checks: [
      mkCheck("should route to alignment", ({ text }) => includesAll(text, ["alignment"]))
    ]
  },
  {
    id: 59,
    name: "Warm AC symptom",
    turns: ["My car AC is blowing warm air"],
    checks: [
      mkCheck("should route to AC repair", ({ text }) => includesAll(text, ["air-conditioning"]) || includesAll(text, ["ac repair"]))
    ]
  },
  {
    id: 60,
    name: "Check engine light question",
    turns: ["My check engine light is on"],
    checks: [
      mkCheck("should route to diagnostics", ({ text }) => includesAll(text, ["diagnostics"]) || includesAll(text, ["diagnostic"]))
    ]
  },
  {
    id: 61,
    name: "No-crank symptom",
    turns: ["My car does not crank"],
    checks: [
      mkCheck("should mention cannot diagnose remotely", ({ text }) => includesAll(text, ["cannot diagnose"]) || includesAll(text, ["diagnostics"]))
    ]
  },
  {
    id: 62,
    name: "Battery follow-up yes/no style",
    turns: ["My battery keeps dying overnight", "What should I do next?"],
    checks: [
      mkCheck("should steer toward diagnostics", ({ text }) => includesAll(text, ["diagnostics"]))
    ]
  },
  {
    id: 63,
    name: "Reset conversation",
    turns: ["Do you do AC repair?", "reset"],
    checks: [
      mkCheck("should reset conversation", ({ text }) => includesAll(text, ["conversation reset"]))
    ]
  },
  {
    id: 64,
    name: "Thanks response",
    turns: ["Thanks"],
    checks: [
      mkCheck("should respond politely", ({ text }) => includesAll(text, ["you're welcome"]))
    ]
  },
  {
    id: 65,
    name: "Booking after thanks still possible",
    turns: ["Thanks", "How do I book?"],
    checks: [
      mkCheck("should still answer booking", ({ text }) => includesAll(text, ["book online"]))
    ]
  },
  {
    id: 66,
    name: "General maintenance service detail",
    turns: ["What does general maintenance include?"],
    checks: [
      mkCheck("should mention fluid checks", ({ text }) => includesAll(text, ["fluid checks"])),
      mkCheck("should mention belt or hose", ({ text }) => includesAll(text, ["belt"]))
    ]
  },
  {
    id: 67,
    name: "Brake service detail",
    turns: ["What does your brake service include?"],
    checks: [
      mkCheck("should mention pad and rotor", ({ text }) => includesAll(text, ["pad", "rotor"]))
    ]
  },
  {
    id: 68,
    name: "Tire service detail",
    turns: ["What do you do for tires?"],
    checks: [
      mkCheck("should mention puncture or rotation", ({ text }) => includesAll(text, ["puncture"]) || includesAll(text, ["rotation"]))
    ]
  },
  {
    id: 69,
    name: "Alignment detail",
    turns: ["What does an alignment help with?"],
    checks: [
      mkCheck("should mention handling or tire wear", ({ text }) => includesAll(text, ["handling"]) || includesAll(text, ["tire wear"]))
    ]
  },
  {
    id: 70,
    name: "Oil detail",
    turns: ["What is included in an oil change?"],
    checks: [
      mkCheck("should mention oil and filter", ({ text }) => includesAll(text, ["oil", "filter"]))
    ]
  },
  {
    id: 71,
    name: "AC detail",
    turns: ["What can you do for AC problems?"],
    checks: [
      mkCheck("should mention refrigerant or compressor", ({ text }) => includesAll(text, ["refrigerant"]) || includesAll(text, ["compressor"]))
    ]
  },
  {
    id: 72,
    name: "Diagnostics detail",
    turns: ["What happens during diagnostics?"],
    checks: [
      mkCheck("should mention identifying issue", ({ text }) => includesAll(text, ["identify"])),
      mkCheck("should mention tools or inspections", ({ text }) => includesAll(text, ["inspection"]) || includesAll(text, ["tools"]))
    ]
  },
  {
    id: 73,
    name: "Saturday follow-up after booking",
    turns: ["How do I book an appointment?", "Are you open Saturday?"],
    checks: [
      mkCheck("should answer Saturday hours", ({ text }) => includesAll(text, ["saturday", "2:00 pm"]))
    ]
  },
  {
    id: 74,
    name: "Email follow-up after location",
    turns: ["Where are you located?", "What is your email?"],
    checks: [
      mkCheck("should answer email", ({ text }) => includesAll(text, ["contact@"]))
    ]
  },
  {
    id: 75,
    name: "Phone follow-up after service",
    turns: ["Do you offer diagnostics?", "Can I call instead?"],
    checks: [
      mkCheck("should answer phone", ({ text }) => includesAll(text, ["407"]))
    ]
  },
  {
    id: 76,
    name: "Blog battery answer avoids website phrase",
    turns: ["Battery keeps dying overnight"],
    checks: [
      mkCheck("should avoid website phrase", ({ text }) => includesNone(text, ["website says", "blog says"]))
    ]
  },
  {
    id: 77,
    name: "No-start answer avoids website phrase",
    turns: ["Car won't start"],
    checks: [
      mkCheck("should avoid website phrase", ({ text }) => includesNone(text, ["website says", "blog says"]))
    ]
  },
  {
    id: 78,
    name: "Greeting suggestions exist",
    turns: ["Hey"],
    checks: [
      mkCheck("should expose quick reply suggestions", ({ response }) => Array.isArray(response.suggestions) && response.suggestions.length >= 2)
    ]
  },
  {
    id: 79,
    name: "Booking action buttons exist",
    turns: ["How do I book?"],
    checks: [
      mkCheck("should include actions", ({ response }) => Array.isArray(response.actions) && response.actions.length >= 2)
    ]
  },
  {
    id: 80,
    name: "Hours response includes actions",
    turns: ["What are your hours?"],
    checks: [
      mkCheck("should include actions", ({ response }) => Array.isArray(response.actions) && response.actions.length >= 2)
    ]
  },
  {
    id: 81,
    name: "Unknown language keeps professionalism",
    turns: ["asdf qwer zzzz"],
    checks: [
      mkCheck("should fall back professionally", ({ text }) => includesAll(text, ["do not want to guess"]) || includesAll(text, ["confirm the right answer"]))
    ]
  },
  {
    id: 82,
    name: "Unknown acronym fallback",
    turns: ["Do you support DPF regen?"],
    checks: [
      mkCheck("should avoid unsupported claim", ({ text }) => includesAll(text, ["do not want to guess"]) || includesAll(text, ["confirm the right answer"]))
    ]
  },
  {
    id: 83,
    name: "Hours not duplicated in location answer",
    turns: ["What are your hours?", "Where are you?"],
    checks: [
      mkCheck("should focus on address", ({ text }) => includesAll(text, ["orlando", "32808"])),
      mkCheck("should not just repeat hours", ({ text }) => !includesAll(text, ["monday to friday", "sunday closed"]))
    ]
  },
  {
    id: 84,
    name: "Citations still exist under the hood for fallback engine",
    turns: ["What are your hours?"],
    checks: [
      mkCheck("should keep citations data for internal grounding", ({ response }) => Array.isArray(response.citations) && response.citations.length >= 1)
    ]
  },
  {
    id: 85,
    name: "Grounder retrieves hours context",
    turns: [],
    checks: [
      mkCheck("grounder should find hours", ({ grounder }) => {
        const result = grounder.buildContext("What are your Saturday hours?", []);
        return result.matches.length > 0 && result.matches[0].doc.id === "hours";
      })
    ]
  },
  {
    id: 86,
    name: "Grounder retrieves AC context",
    turns: [],
    checks: [
      mkCheck("grounder should find AC", ({ grounder }) => {
        const result = grounder.buildContext("Do you do AC repair?", []);
        return result.matches.length > 0 && result.matches[0].doc.id === "ac-repairs";
      })
    ]
  },
  {
    id: 87,
    name: "Grounder retrieves battery article",
    turns: [],
    checks: [
      mkCheck("grounder should find battery article", ({ grounder }) => {
        const result = grounder.buildContext("My battery keeps dying overnight", []);
        return result.matches.length > 0 && result.matches[0].doc.id === "blog-battery";
      })
    ]
  },
  {
    id: 88,
    name: "Grounder score low for unsupported policy",
    turns: [],
    checks: [
      mkCheck("grounder should not strongly match unsupported policy", ({ grounder }) => {
        const result = grounder.buildContext("Do you offer free coffee in the lobby?", []);
        return result.score < 10;
      })
    ]
  },
  {
    id: 89,
    name: "UI should not render citation class in output builder path",
    turns: [],
    checks: [
      mkCheck("app should not show citation chips", () => {
        const appCode = fs.readFileSync(path.join(__dirname, "app.js"), "utf8");
        return !appCode.includes("chatbot__citation");
      })
    ]
  },
  {
    id: 90,
    name: "Server prompt avoids website wording",
    turns: [],
    checks: [
      mkCheck("server prompt should ban website wording", () => {
        const serverCode = fs.readFileSync(path.join(__dirname, "server.js"), "utf8");
        return serverCode.includes("Do not use phrases like 'the website says'") &&
          serverCode.includes("Never mention the website");
      })
    ]
  },
  {
    id: 91,
    name: "Project has deployment env example",
    turns: [],
    checks: [
      mkCheck("should include .env.example", () => fs.existsSync(path.join(__dirname, ".env.example")))
    ]
  },
  {
    id: 92,
    name: "Project has server entry file",
    turns: [],
    checks: [
      mkCheck("should include server.js", () => fs.existsSync(path.join(__dirname, "server.js")))
    ]
  },
  {
    id: 93,
    name: "Project has readme",
    turns: [],
    checks: [
      mkCheck("should include README", () => fs.existsSync(path.join(__dirname, "README.md")))
    ]
  },
  {
    id: 94,
    name: "Readme mentions Groq deployment",
    turns: [],
    checks: [
      mkCheck("README should explain Groq deployment", () => {
        const readme = fs.readFileSync(path.join(__dirname, "README.md"), "utf8");
        return readme.toLowerCase().includes("groq") && readme.toLowerCase().includes("node");
      })
    ]
  },
  {
    id: 95,
    name: "Readme mentions local start command",
    turns: [],
    checks: [
      mkCheck("README should show node server.js", () => {
        const readme = fs.readFileSync(path.join(__dirname, "README.md"), "utf8");
        return readme.includes("node .\\server.js");
      })
    ]
  },
  {
    id: 96,
    name: "Hours response includes Sunday closed",
    turns: ["What are your business hours?"],
    checks: [
      mkCheck("should include Sunday closed", ({ text }) => includesAll(text, ["sunday closed"]))
    ]
  },
  {
    id: 97,
    name: "Email response includes reply timing",
    turns: ["If I email you, how fast do you reply?"],
    checks: [
      mkCheck("should mention one day reply", ({ text }) => includesAll(text, ["within one day"]))
    ]
  },
  {
    id: 98,
    name: "Conversation can move from symptom to booking",
    turns: ["My battery keeps dying overnight", "Can I book an appointment?"],
    checks: [
      mkCheck("should answer booking even after symptom conversation", ({ text }) => includesAll(text, ["book online"]))
    ]
  },
  {
    id: 99,
    name: "Conversation can move from service to location",
    turns: ["Do you do AC repair?", "Where are you located?"],
    checks: [
      mkCheck("should answer location", ({ text }) => includesAll(text, ["3327 w colonial dr"]))
    ]
  },
  {
    id: 100,
    name: "Conversation can move from booking to contact",
    turns: ["How do I book an appointment?", "What number should I call?"],
    checks: [
      mkCheck("should answer contact number", ({ text }) => includesAll(text, ["407"]))
    ]
  },
  {
    id: 101,
    name: "Company voice stays clean on service answer",
    turns: ["Do you offer AC repair?"],
    checks: [
      mkCheck("should avoid source phrasing", ({ text }) => includesNone(text, ["website", "source", "citation", "according to"])),
      mkCheck("should sound like company support", ({ text }) => includesAll(text, ["yes"]))
    ]
  }
];

const results = scenarios.map((scenario) => runScenario(runner, scenario));
const passed = results.filter((result) => result.passed);
const failed = results.filter((result) => !result.passed);

console.log("Release test results:");
console.log("Passed:", passed.length);
console.log("Failed:", failed.length);

if (failed.length) {
  failed.forEach((result) => {
    console.log("---");
    console.log("#" + result.id + " " + result.name);
    result.failures.forEach((failure) => {
      console.log(" - " + failure);
    });
  });
  process.exitCode = 1;
} else {
  console.log("All 100 scenarios passed.");
}
