const express = require("express");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const app = express();
const allowedOrigin = process.env.ALLOWED_ORIGIN || "http://localhost:3000";

app.use(
  cors({
    origin: allowedOrigin,
    methods: ["POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  })
);
app.use(express.json());

if (!process.env.ANTHROPIC_API_KEY) {
  console.error("ANTHROPIC_API_KEY is not set");
}

app.post("/reply", async (req, res) => {
  const { message, tone } = req.body;

  if (typeof message !== "string" || !message.trim()) {
    return res.status(400).json({ error: "message is required" });
  }

  const toneInstructions = {
    pro: "Write a professional, polite email reply. Sign off with 'Best regards, Mikey'.",
    cas: "Write a casual, friendly reply like texting a colleague. Sign off with '— Mikey'.",
    sho: "Write a very short reply in 1-2 sentences maximum. No sign off needed.",
  };

  if (!toneInstructions[tone]) {
    return res.status(400).json({ error: "tone must be one of: pro, cas, sho" });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: "Server misconfigured" });
  }

  try {
    const response = await axios.post(
      "https://api.anthropic.com/v1/messages",
      {
        model: "claude-haiku-4-5-20251001",
        max_tokens: 300,
        system: `You are MikeyAgent, a personal AI assistant that writes email replies. ${toneInstructions[tone]} Only write the reply itself, nothing else.`,
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
});

app.listen(3001, () => console.log("MikeyAgent server running on port 3001"));
