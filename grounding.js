(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.createOrlandoGrounder = factory();
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

  var TOPIC_ALIASES = {
    "ac-repairs": ["ac repair", "air conditioning repair", "warm air", "not blowing cold"],
    "hours": ["saturday hours", "business hours", "open on sunday"],
    "blog-battery": ["battery keeps dying overnight", "parasitic draw", "battery overnight"],
    "oil-frequency": ["how often should i get an oil change", "oil interval"],
    "tire-rotation-frequency": ["how often should tires be rotated", "tire rotation interval"]
  };

  function createGrounder(data) {
    var docs = data.knowledgeBase.map(function (doc) {
      var combined = [doc.title, doc.category, doc.answer, doc.text].concat(doc.tags || []).join(" ");
      return Object.assign({}, doc, {
        normalized: normalize(combined),
        tokens: tokenize(combined)
      });
    });

    function score(query, doc) {
      var normalizedQuery = normalize(query);
      var queryTokens = tokenize(query);
      var total = 0;

      queryTokens.forEach(function (token) {
        if (doc.tokens.indexOf(token) !== -1) {
          total += 3;
        }
        if ((doc.tags || []).some(function (tag) { return normalize(tag) === token; })) {
          total += 5;
        }
      });

      (doc.tags || []).forEach(function (tag) {
        if (normalizedQuery.indexOf(normalize(tag)) !== -1) {
          total += 6;
        }
      });

      if (doc.normalized.indexOf(normalizedQuery) !== -1 && normalizedQuery.length > 4) {
        total += 8;
      }

      (TOPIC_ALIASES[doc.id] || []).forEach(function (alias) {
        if (normalizedQuery.indexOf(normalize(alias)) !== -1) {
          total += 12;
        }
      });

      return total;
    }

    function retrieve(query, limit) {
      return docs
        .map(function (doc) {
          return { doc: doc, score: score(query, doc) };
        })
        .filter(function (item) {
          return item.score > 0;
        })
        .sort(function (a, b) {
          return b.score - a.score;
        })
        .slice(0, limit || 4);
    }

    function buildContext(query, history) {
      var historyText = (history || [])
        .slice(-6)
        .map(function (entry) {
          return entry.role + ": " + entry.content;
        })
        .join("\n");

      var fullQuery = (historyText ? historyText + "\n" : "") + query;
      var matches = retrieve(fullQuery, 4);
      var citations = uniqueById(
        matches.map(function (item) {
          return {
            id: item.doc.id,
            label: item.doc.title + " (" + item.doc.sourceLabel + ")",
            url: item.doc.sourceUrl
          };
        })
      );

      var contextText = matches
        .map(function (item, index) {
          return (
            "[" +
            (index + 1) +
            "] " +
            item.doc.title +
            " | Source: " +
            item.doc.sourceLabel +
            " | URL: " +
            item.doc.sourceUrl +
            "\nAnswer: " +
            item.doc.answer +
            "\nDetails: " +
            item.doc.text
          );
        })
        .join("\n\n");

      return {
        matches: matches,
        citations: citations,
        contextText: contextText,
        score: matches.length ? matches[0].score : 0
      };
    }

    return {
      buildContext: buildContext
    };
  }

  return createGrounder;
});
