import { useState } from "react";
import "./App.css";

const TONES = [
  { label: "Professional", key: "pro" },
  { label: "Casual", key: "cas" },
  { label: "Short", key: "sho" },
];

async function fetchReply(message, tone) {
  const response = await fetch("/api/reply", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, tone }),
  });
  const data = await response.json();
  return data.reply;
}

export default function App() {
  const [input, setInput] = useState("");
  const [replies, setReplies] = useState(null);
  const [copied, setCopied] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleGenerate() {
    if (!input.trim()) return;
    setLoading(true);
    setError(null);
    setReplies(null);

    try {
      const [pro, cas, sho] = await Promise.all([
        fetchReply(input, "pro"),
        fetchReply(input, "cas"),
        fetchReply(input, "sho"),
      ]);
      setReplies({ pro, cas, sho });
    } catch (err) {
      setError("Something went wrong. Try again!");
    }

    setLoading(false);
  }

  function handleCopy(key, text) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1800);
  }

  return (
    <div className="app">
      <h1>Mikey<span>Agent</span> <small>v0.2</small></h1>
      <label>Paste your email or message</label>
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Hey, just checking in on the project update..."
        disabled={loading}
      />
      <button onClick={handleGenerate} disabled={!input.trim() || loading}>
        {loading ? "Generating..." : "Generate Replies"}
      </button>
      {error && <p className="error">{error}</p>}
      {replies && (
        <div className="replies">
          {TONES.map(({ label, key }) => (
            <div className="card" key={key}>
              <div className="card-top">
                <span className={`badge ${key}`}>{label}</span>
                <button
                  className={`copy-btn ${copied === key ? "copied" : ""}`}
                  onClick={() => handleCopy(key, replies[key])}
                >
                  {copied === key ? "Copied ✓" : "Copy"}
                </button>
              </div>
              <p>{replies[key]}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
