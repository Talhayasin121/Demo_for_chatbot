module.exports = (req, res) => {
  res.status(200).json({
    ok: true,
    llmEnabled: Boolean(process.env.GROQ_API_KEY),
    model: process.env.GROQ_MODEL || "llama-3.1-8b-instant"
  });
};