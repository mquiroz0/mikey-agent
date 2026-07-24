const axios = require("axios");

const ALLOWED_TONES = {
  pro: "Write a professional, polite email reply. Sign off with 'Best regards, Mikey'.",
  cas: "Write a casual, friendly reply like texting a colleague. Sign off with '— Mikey'.",
  sho: "Write a very short reply in 1-2 sentences maximum. No sign off needed.",
};

function isSameOrigin(req, requestOrigin) {
  const host = req.headers.host;
  if (!host || !requestOrigin) return false;
  return (
    requestOrigin === `https://${host}` || requestOrigin === `http://${host}`
  );
}

function setCorsHeaders(req, res) {
  const allowedOrigin = process.env.ALLOWED_ORIGIN;
  const requestOrigin = req.headers.origin;

  // Non-browser clients often omit Origin.
  if (!requestOrigin) {
    return true;
  }

  // Same-origin browser calls (typical Vercel deploy) do not need CORS headers.
  if (isSameOrigin(req, requestOrigin)) {
    return true;
  }

  // Explicit allowlist for cross-origin use — never reflect arbitrary Origin.
  if (allowedOrigin && requestOrigin === allowedOrigin) {
    res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Vary", "Origin");
    return true;
  }

  return false;
}

module.exports = async (req, res) => {
  if (!setCorsHeaders(req, res)) {
    return res.status(403).json({ error: "Origin not allowed" });
  }

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message, tone } = req.body || {};

  if (typeof message !== "string" || !message.trim()) {
    return res.status(400).json({ error: "message is required" });
  }

  if (!ALLOWED_TONES[tone]) {
    return res.status(400).json({ error: "tone must be one of: pro, cas, sho" });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("ANTHROPIC_API_KEY is not set");
    return res.status(500).json({ error: "Server misconfigured" });
  }

  try {
    const response = await axios.post(
      "https://api.anthropic.com/v1/messages",
      {
        model: "claude-haiku-4-5-20251001",
        max_tokens: 300,
        system: `You are MikeyAgent, a personal AI assistant that writes email replies. ${ALLOWED_TONES[tone]} Only write the reply itself, nothing else.`,
        messages: [{ role: "user", content: `Write a reply to this message: "${message}"` }],
      },
      {
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
      }
    );
    res.json({ reply: response.data.content[0].text });
  } catch (err) {
    console.error("Claude API error:", err.response?.status || err.message);
    res.status(500).json({ error: "Claude API error" });
  }
};
