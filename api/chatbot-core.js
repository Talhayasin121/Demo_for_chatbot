(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.createOrlandoChatbotEngine = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  var STOP_WORDS = new Set([
    "a",
    "an",
    "and",
    "are",
    "at",
    "be",
    "can",
    "do",
    "for",
    "from",
    "get",
    "how",
    "i",
    "in",
    "is",
    "it",
    "me",
    "my",
    "of",
    "on",
    "or",
    "the",
    "to",
    "what",
    "when",
    "where",
    "which",
    "who",
    "with",
    "you",
    "your"
  ]);

  var TOPIC_ALIASES = {
    "services-overview": ["services", "repair", "repairs", "maintenance", "help with my car"],
    "general-maintenance": ["maintenance", "routine service", "tune up", "fluid", "belt", "hose"],
    "brake-repairs": ["brake", "brakes", "brake repair", "brake service", "squeaking brakes", "pads", "rotors", "abs"],
    "tires": ["tire", "tires", "flat tire", "rotation", "puncture", "tread"],
    "alignment": ["alignment", "wheel alignment", "pulling", "pulls to one side", "steering wheel off center"],
    "oil-change": ["oil", "oil change", "oil service", "filter", "engine oil"],
    "ac-repairs": ["ac", "ac repair", "a c", "air conditioning", "air conditioning repair", "not blowing cold", "warm air", "hvac"],
    "diagnostics": ["diagnostic", "diagnostics", "diagnose", "inspection", "check engine", "warning light", "scan", "troubleshoot"],
    "hours": ["hours", "open", "closed", "saturday", "sunday", "today"],
    "contact": ["contact", "phone", "email", "call", "message"],
    "location": ["location", "address", "where are you", "directions", "map", "find the shop", "find you"],
    "booking": ["book", "booking", "appointment", "schedule", "reserve"],
    "warranty": ["warranty", "guarantee", "napa"],
    "makes-models": ["makes", "models", "bmw", "mercedes", "toyota", "honda", "ford", "volvo", "cadillac"],
    "certifications": ["ase", "certified", "master tech", "julio"],
    "buy-sell": ["buy", "sell", "trade", "trade in", "orlando preowned"],
    "maintenance-frequency": ["how often maintenance", "service interval", "5000", "10000"],
    "oil-frequency": ["how often oil", "how often should i get an oil change", "oil interval", "3000", "5000 miles"],
    "tire-rotation-frequency": ["rotate tires", "how often should tires be rotated", "tire rotation interval", "7500 miles"],
    "check-engine": ["check engine", "diagnostic include", "warning light"],
    "blog-no-start": ["wont start", "won't start", "no crank", "crank no start", "starter", "fuel", "sensors"],
    "blog-battery": ["battery dying", "battery overnight", "parasitic draw", "electrical drain", "weak click"]
  };

  function normalize(text) {
    return (text || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function tokenize(text) {
    return normalize(text)
      .split(" ")
      .filter(function (token) {
        return token && !STOP_WORDS.has(token);
      });
  }

  function includesAny(text, phrases) {
    var normalized = normalize(text);
    return phrases.some(function (phrase) {
      return normalized.indexOf(normalize(phrase)) !== -1;
    });
  }

  function uniqueById(items) {
    var seen = new Set();
    return items.filter(function (item) {
      if (!item || seen.has(item.id)) {
        return false;
      }
      seen.add(item.id);
      return true;
    });
  }

  function lowerFirst(text) {
    if (!text) {
      return "";
    }
    return text.charAt(0).toLowerCase() + text.slice(1);
  }

  function createEngine(data) {
    var docs = data.knowledgeBase.map(function (doc) {
      var combined = [doc.title, doc.category, doc.answer, doc.text].concat(doc.tags || []).join(" ");
      return Object.assign({}, doc, {
        normalized: normalize(combined),
        tokens: tokenize(combined)
      });
    });

    var docsById = {};
    docs.forEach(function (doc) {
      docsById[doc.id] = doc;
    });

    var state = {
      history: [],
      lastTopicId: null,
      lastTopicLabel: "",
      lastIntent: null,
      lastResolvedQuery: "",
      turnCount: 0
    };

    function scoreDocument(query, doc) {
      var tokens = tokenize(query);
      var normalizedQuery = normalize(query);
      var score = 0;

      tokens.forEach(function (token) {
        if (doc.tokens.indexOf(token) !== -1) {
          score += 3;
        }
        if ((doc.tags || []).some(function (tag) { return normalize(tag) === token; })) {
          score += 4;
        }
      });

      if (doc.normalized.indexOf(normalizedQuery) !== -1 && normalizedQuery.length > 4) {
        score += 8;
      }

      (doc.tags || []).forEach(function (tag) {
        if (normalizedQuery.indexOf(normalize(tag)) !== -1) {
          score += 5;
        }
      });

      if (includesAny(query, [doc.title])) {
        score += 6;
      }

      (TOPIC_ALIASES[doc.id] || []).forEach(function (alias) {
        if (normalizedQuery.indexOf(normalize(alias)) !== -1) {
          score += 7;
        }
      });

      if (state.lastTopicId && state.lastTopicId === doc.id) {
        score += 2;
      }

      return score;
    }

    function inferDirectTopicId(query) {
      var normalizedQuery = normalize(query);
      var bestTopicId = null;
      var bestScore = 0;

      Object.keys(TOPIC_ALIASES).forEach(function (topicId) {
        var score = 0;
        (TOPIC_ALIASES[topicId] || []).forEach(function (alias) {
          if (normalizedQuery.indexOf(normalize(alias)) !== -1) {
            score += normalize(alias).split(" ").length;
          }
        });

        if (score > bestScore) {
          bestScore = score;
          bestTopicId = topicId;
        }
      });

      return bestScore > 0 ? bestTopicId : null;
    }

    function search(query, limit) {
      return docs
        .map(function (doc) {
          return {
            doc: doc,
            score: scoreDocument(query, doc)
          };
        })
        .filter(function (result) {
          return result.score > 0;
        })
        .sort(function (a, b) {
          return b.score - a.score;
        })
        .slice(0, limit || 3);
    }

    function makeCitations(results) {
      return uniqueById(
        results.map(function (result) {
          return {
            id: result.doc.id,
            label: result.doc.title + " (" + result.doc.sourceLabel + ")",
            url: result.doc.sourceUrl
          };
        })
      );
    }

    function baseActions() {
      return [
        { label: "Book Appointment", url: data.company.bookingUrl },
        { label: "Call Shop", url: data.company.phoneHref }
      ];
    }

    function followUpSuggestions(topicId) {
      var map = {
        "services-overview": ["Do you service all makes and models?", "How do I book an appointment?"],
        "general-maintenance": ["How often should routine maintenance be done?", "How do I book an appointment?"],
        "brake-repairs": ["Do you offer a warranty?", "How do I book an appointment?"],
        "tires": ["How often should tires be rotated?", "What are your hours?"],
        "alignment": ["What are your hours on Saturday?", "How do I book an appointment?"],
        "oil-change": ["How often should I get an oil change?", "What are your hours?"],
        "ac-repairs": ["How do I book an appointment?", "What are your hours?"],
        "diagnostics": ["What does a check engine diagnostic include?", "How do I book an appointment?"],
        "hours": ["Where are you located?", "How do I book an appointment?"],
        "contact": ["What are your hours?", "Where are you located?"],
        "location": ["What are your hours?", "How do I book an appointment?"],
        "booking": ["What are your hours?", "Where are you located?"],
        "warranty": ["Do you service all makes and models?", "How do I book an appointment?"],
        "makes-models": ["What services do you offer?", "How do I book an appointment?"],
        "certifications": ["What services do you offer?", "Do you offer a warranty?"],
        "buy-sell": ["How can I contact the shop?", "Where are you located?"],
        "blog-no-start": ["Do you offer diagnostics?", "How do I book an appointment?"],
        "blog-battery": ["Do you offer diagnostics?", "What are your hours?"]
      };

      return map[topicId] || data.quickReplies.slice(0, 2);
    }

    function remember(query, response, topicId, intent, resolvedQuery) {
      response.topicId = topicId || state.lastTopicId || null;
      response.intent = intent || state.lastIntent || null;
      response.resolvedQuery = resolvedQuery || query;
      state.turnCount += 1;
      state.lastTopicId = topicId || state.lastTopicId;
      state.lastTopicLabel = topicId && docsById[topicId] ? docsById[topicId].title : state.lastTopicLabel;
      state.lastIntent = intent || state.lastIntent;
      state.lastResolvedQuery = resolvedQuery || query;
      state.history.push({
        query: query,
        topicId: topicId || null,
        intent: intent || null,
        response: response.text
      });

      if (state.history.length > 10) {
        state.history.shift();
      }

      return response;
    }

    function buildStandardResponse(text, citations, topicId, suggestions, actions) {
      return {
        text: text,
        citations: citations || [],
        actions: actions || baseActions(),
        suggestions: suggestions || followUpSuggestions(topicId)
      };
    }

    function contactResponse(query) {
      var text =
        "You can reach Orlando Auto Repair at " +
        data.company.phoneDisplay +
        " or " +
        data.company.email +
        ". The team typically replies within one day.";
      return remember(
        query,
        buildStandardResponse(
          text,
          [
            {
              id: "contact",
              label: "Phone, email, and reply time (Contact)",
              url: "https://orlandoautorepair.com/contact-us/"
            }
          ],
          "contact"
        ),
        "contact",
        "contact",
        query
      );
    }

    function hoursResponse(query) {
      var text =
        "Our hours are Monday to Friday from 8:00 AM to 6:00 PM, Saturday from 8:00 AM to 2:00 PM, and Sunday closed.";
      return remember(
        query,
        buildStandardResponse(
          text,
          [
            {
              id: "hours",
              label: "Opening hours (Contact)",
              url: "https://orlandoautorepair.com/contact-us/"
            }
          ],
          "hours"
        ),
        "hours",
        "hours",
        query
      );
    }

    function bookingResponse(query) {
      var text =
        "You can book online or call the shop directly at " +
        data.company.phoneDisplay +
        ".";
      return remember(
        query,
        buildStandardResponse(
          text,
          [
            {
              id: "booking",
              label: "Appointments and booking (Home)",
              url: "https://orlandoautorepair.com/"
            }
          ],
          "booking"
        ),
        "booking",
        "booking",
        query
      );
    }

    function locationResponse(query) {
      var text = "Orlando Auto Repair is located at " + data.company.address + ".";
      return remember(
        query,
        buildStandardResponse(
          text,
          [
            {
              id: "location",
              label: "Location (Contact)",
              url: "https://orlandoautorepair.com/contact-us/"
            }
          ],
          "location",
          ["What are your hours?", "How do I book an appointment?"],
          [
            { label: "Get Directions", url: data.company.mapsUrl },
            { label: "Call Shop", url: data.company.phoneHref }
          ]
        ),
        "location",
        "location",
        query
      );
    }

    function warrantyResponse(query) {
      var text =
        "Repairs are backed by a NAPA parts and labor warranty for 24 months or 24,000 miles.";
      return remember(
        query,
        buildStandardResponse(
          text,
          [
            {
              id: "warranty",
              label: "Warranty (Home FAQ)",
              url: "https://orlandoautorepair.com/"
            }
          ],
          "warranty"
        ),
        "warranty",
        "warranty",
        query
      );
    }

    function servicesResponse(query) {
      var text =
        "Yes. We offer general maintenance, brake repairs, tire repairs and rotations, wheel alignments, oil and filter changes, AC repairs, and diagnostics and inspections.";
      return remember(
        query,
        buildStandardResponse(
          text,
          [
            {
              id: "services-overview",
              label: "Main services (Services)",
              url: "https://orlandoautorepair.com/automotive-repair-service-orlando-fl/"
            }
          ],
          "services-overview"
        ),
        "services-overview",
        "services",
        query
      );
    }

    function priceGuardrail(query) {
      var explicitTopicId = inferDirectTopicId(query);
      var topicDoc = docsById[explicitTopicId] || docsById[state.lastTopicId];
      var topicText = topicDoc ? " for " + topicDoc.title.toLowerCase() : "";
      var text =
        "We do not provide fixed prices or instant repair quotes" +
        topicText +
        ". For an accurate estimate, the best next step is to call the shop or book an appointment.";
      return remember(
        query,
        buildStandardResponse(
          text,
          [
            {
              id: "booking",
              label: "Appointments and booking (Home)",
              url: "https://orlandoautorepair.com/"
            }
          ],
          explicitTopicId || state.lastTopicId || "booking",
          ["How do I book an appointment?", "What are your hours?"]
        ),
        explicitTopicId || state.lastTopicId || "booking",
        "price",
        query
      );
    }

    function outOfScopeResponse(query) {
      var text =
        "I can help with Orlando Auto Repair services, appointments, hours, warranty, location, contact information, and common vehicle questions. For anything outside that scope, I can help you get the right next step with the shop.";
      return remember(
        query,
        buildStandardResponse(text, [], state.lastTopicId || "services-overview", data.quickReplies.slice(0)),
        state.lastTopicId || "services-overview",
        "out-of-scope",
        query
      );
    }

    function noDiagnosisGuardrail(query, doc, resolvedQuery) {
      var diagnosticsDoc = docsById.diagnostics;
      var text =
        doc.answer +
        " I cannot diagnose the vehicle remotely here, but Orlando Auto Repair does offer diagnostics and inspections to identify the real issue.";
      var results = [{ doc: doc }];

      if (diagnosticsDoc && diagnosticsDoc.id !== doc.id) {
        results.push({ doc: diagnosticsDoc });
      }

      return remember(
        query,
        buildStandardResponse(text, makeCitations(results), doc.id),
        doc.id,
        "diagnostic-topic",
        resolvedQuery
      );
    }

    function unsupportedPolicyFallback(query) {
      var text =
        "I do not want to guess on that. Please call " +
        data.company.phoneDisplay +
        " or book an appointment and the team can confirm the right answer for you.";
      return remember(
        query,
        buildStandardResponse(text, [], state.lastTopicId || "booking", data.quickReplies.slice(0)),
        state.lastTopicId || "booking",
        "fallback",
        query
      );
    }

    function composeDocAnswer(doc, query) {
      var normalizedQuery = normalize(query);

      if (doc.category === "service-detail") {
        return "Yes. " + doc.answer;
      }

      if (doc.category === "faq") {
        return doc.answer;
      }

      if (doc.category === "trust" || doc.category === "operations" || doc.category === "sales") {
        return doc.answer;
      }

      if (doc.category === "blog") {
        if (
          normalizedQuery.indexOf("what is wrong") !== -1 ||
          normalizedQuery.indexOf("diagnose") !== -1 ||
          normalizedQuery.indexOf("my car") !== -1 ||
          normalizedQuery.indexOf("battery") !== -1 ||
          normalizedQuery.indexOf("start") !== -1
        ) {
          return doc.answer;
        }
      }

      return doc.answer;
    }

    function isFollowUpQuery(query) {
      var normalizedQuery = normalize(query);
      var tokens = tokenize(query);
      var directTopicId = inferDirectTopicId(query);

      if (!state.lastResolvedQuery) {
        return false;
      }

      if (directTopicId) {
        if (
          includesAny(normalizedQuery, [
            "what about",
            "how about",
            "same for",
            "do you do that",
            "what if"
          ])
        ) {
          return true;
        }
        return false;
      }

      if (tokens.length <= 4 && includesAny(normalizedQuery, ["that", "this", "it", "those", "these"])) {
        return true;
      }

      if (
        includesAny(normalizedQuery, [
          "what about",
          "how about",
          "and ",
          "that",
          "this",
          "it",
          "those",
          "these",
          "same for",
          "do you do that",
          "what if"
        ])
      ) {
        return true;
      }

      return false;
    }

    function expandWithContext(query) {
      var trimmed = (query || "").trim();

      if (!isFollowUpQuery(trimmed)) {
        return trimmed;
      }

      if (state.lastTopicLabel) {
        return state.lastTopicLabel + " " + trimmed;
      }

      return state.lastResolvedQuery + " " + trimmed;
    }

    function retrievalResponse(query) {
      var resolvedQuery = expandWithContext(query);
      var directTopicId = inferDirectTopicId(resolvedQuery);

      if (directTopicId && docsById[directTopicId] && directTopicId !== "services-overview") {
        var directDoc = docsById[directTopicId];

        if (directDoc.category === "blog") {
          return noDiagnosisGuardrail(query, directDoc, resolvedQuery);
        }

        return remember(
          query,
          buildStandardResponse(
            composeDocAnswer(directDoc, resolvedQuery),
            makeCitations([{ doc: directDoc }]),
            directDoc.id
          ),
          directDoc.id,
          "retrieval",
          resolvedQuery
        );
      }

      var results = search(resolvedQuery, 3);

      if (!results.length || results[0].score < 6) {
        return unsupportedPolicyFallback(query);
      }

      var topDoc = results[0].doc;
      var normalizedQuery = normalize(query);

      if (
        topDoc.category === "blog" &&
        (
          normalizedQuery.indexOf("my car") !== -1 ||
          normalizedQuery.indexOf("battery") !== -1 ||
          normalizedQuery.indexOf("start") !== -1 ||
          normalizedQuery.indexOf("what is wrong") !== -1
        )
      ) {
        return noDiagnosisGuardrail(query, topDoc, resolvedQuery);
      }

      return remember(
        query,
        buildStandardResponse(composeDocAnswer(topDoc, resolvedQuery), makeCitations(results.slice(0, 1)), topDoc.id),
        topDoc.id,
        "retrieval",
        resolvedQuery
      );
    }

    function greetingResponse(query) {
      var intro =
        state.turnCount === 0
          ? "Welcome to Orlando Auto Repair. I can help with services, hours, appointments, warranty, location, and common vehicle questions."
          : "I can keep helping with services, appointments, hours, warranty, location, and common vehicle questions.";

      return remember(
        query,
        buildStandardResponse(intro, [], state.lastTopicId || "services-overview", data.quickReplies.slice(0)),
        state.lastTopicId || "services-overview",
        "greeting",
        query
      );
    }

    function thanksResponse(query) {
      var text =
        "You're welcome. I can also help with the next step, like booking, hours, location, or whether we offer a specific service.";
      return remember(
        query,
        buildStandardResponse(text, [], state.lastTopicId || "services-overview", followUpSuggestions(state.lastTopicId)),
        state.lastTopicId || "services-overview",
        "thanks",
        query
      );
    }

    function resetResponse(query) {
      state.history = [];
      state.lastTopicId = null;
      state.lastTopicLabel = "";
      state.lastIntent = null;
      state.lastResolvedQuery = "";
      state.turnCount = 0;

      return remember(
        query,
        buildStandardResponse(
          "Conversation reset. Ask me about services, appointments, hours, warranty, location, or common maintenance questions.",
          [],
          "services-overview",
          data.quickReplies.slice(0)
        ),
        "services-overview",
        "reset",
        query
      );
    }

    function respond(query) {
      var trimmed = (query || "").trim();
      if (!trimmed) {
        return {
          text: "Ask me about services, hours, appointments, warranty, location, or common maintenance questions.",
          citations: [],
          actions: baseActions(),
          suggestions: data.quickReplies.slice(0),
          topicId: state.lastTopicId || "services-overview",
          intent: "empty",
          resolvedQuery: trimmed
        };
      }

      if (includesAny(trimmed, ["reset", "start over", "clear chat", "new question"])) {
        return resetResponse(trimmed);
      }

      if (includesAny(trimmed, ["hi", "hello", "hey", "good morning", "good afternoon"])) {
        return greetingResponse(trimmed);
      }

      if (includesAny(trimmed, ["thank you", "thanks"])) {
        return thanksResponse(trimmed);
      }

      if (
        includesAny(trimmed, [
          "weather",
          "politics",
          "vote",
          "pizza",
          "movie",
          "medical",
          "lawyer",
          "math",
          "algebra",
          "geometry",
          "calculus",
          "equation",
          "solve ",
          "add ",
          "subtract",
          "multiply",
          "divide"
        ])
      ) {
        return outOfScopeResponse(trimmed);
      }

      if (
        includesAny(trimmed, [
          "loaner",
          "financing",
          "towing",
          "walk in",
          "walk-in",
          "apple pay",
          "same day",
          "same-day",
          "transferable",
          "warranty transfer",
          "payment method",
          "payment methods",
          "credit card",
          "cashapp",
          "venmo"
        ])
      ) {
        return unsupportedPolicyFallback(trimmed);
      }

      if (includesAny(trimmed, ["price", "prices", "cost", "quote", "estimate", "how much"])) {
        return priceGuardrail(trimmed);
      }

      if (includesAny(trimmed, ["book", "booking", "appointment", "schedule", "reserve"])) {
        return bookingResponse(trimmed);
      }

      if (includesAny(trimmed, ["hours", "open", "close", "closed", "saturday", "sunday", "today"])) {
        return hoursResponse(trimmed);
      }

      if (includesAny(trimmed, ["phone", "email", "contact", "call", "message"])) {
        return contactResponse(trimmed);
      }

      if (includesAny(trimmed, ["where", "address", "location", "directions", "map", "find the shop", "find you"])) {
        return locationResponse(trimmed);
      }

      if (includesAny(trimmed, ["warranty", "guarantee", "napa"])) {
        return warrantyResponse(trimmed);
      }

      if (includesAny(trimmed, ["what services", "services", "what do you offer"])) {
        return servicesResponse(trimmed);
      }

      if (
        includesAny(trimmed, ["diagnose", "diagnosis", "what is wrong", "what's wrong"]) &&
        state.lastTopicId &&
        docsById[state.lastTopicId] &&
        docsById[state.lastTopicId].category === "blog"
      ) {
        return noDiagnosisGuardrail(trimmed, docsById[state.lastTopicId], expandWithContext(trimmed));
      }

      if (
        includesAny(trimmed, ["what should i do next", "what do i do next", "what next", "next step"]) &&
        state.lastTopicId &&
        docsById[state.lastTopicId] &&
        docsById[state.lastTopicId].category === "blog"
      ) {
        return noDiagnosisGuardrail(trimmed, docsById[state.lastTopicId], expandWithContext(trimmed));
      }

      return retrievalResponse(trimmed);
    }

    return {
      respond: respond,
      getState: function () {
        return {
          lastTopicId: state.lastTopicId,
          lastTopicLabel: state.lastTopicLabel,
          lastIntent: state.lastIntent,
          lastResolvedQuery: state.lastResolvedQuery,
          turnCount: state.turnCount,
          history: state.history.slice(0)
        };
      }
    };
  }

  return createEngine;
});
