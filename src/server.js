const express = require("express");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

app.post("/reply", async (req, res) => {
  const { message, tone } = req.body;

  const toneInstructions = {
    pro: "Write a professional, polite email reply. Sign off with 'Best regards, Mikey'.",
    cas: "Write a casual, friendly reply like texting a colleague. Sign off with '— Mikey'.",
    sho: "Write a very short reply in 1-2 sentences maximum. No sign off needed.",
  };

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
          "x-api-key": process.env.REACT_APP_CLAUDE_KEY,
          "anthropic-version": "2023-06-01",
        },
      }
    );
    res.json({ reply: response.data.content[0].text });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "Claude API error" });
  }
});

app.listen(3001, () => console.log("MikeyAgent server running on port 3001"));