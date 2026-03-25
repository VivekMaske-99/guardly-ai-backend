const Groq = require("groq-sdk");
const { GROQ_API_KEY } = require("../config/env");

const groq = new Groq({ apiKey: GROQ_API_KEY });

/* ================= CHAT AI (EXISTING) ================= */
const analyzeMessage = async (message, isFirstQuery = true) => {
  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: "You are GuardLY cybersecurity assistant"
      },
      { role: "user", content: message }
    ]
  });

  const parsed = JSON.parse(completion.choices[0].message.content);

  return {
    ai: parsed.ai || "",
    risk: isFirstQuery ? parsed.risk || "" : "",
    impact: isFirstQuery ? parsed.impact || "" : "",
    action: isFirstQuery ? parsed.action || "" : "",
    severity: isFirstQuery ? parsed.severity || "None" : "None",
    likelihood: parsed.likelihood || 0,
    impactScore: parsed.impactScore || 0,
    riskLevel: parsed.riskLevel || 0,
    suggestions: parsed.suggestions || []
  };
};

/* ================= 🔥 NEW: AI DOCUMENT REPORT ================= */
const generateScanReport = async (prompt) => {
  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    temperature: 0.3,
    messages: [
      {
        role: "system",
        content: `
You are GuardLY AI — a cybersecurity document analyzer.

RULES:
- Simple language
- Professional tone
- No markdown
- Structured output

FORMAT:

1. Document Overview
2. Detected Sensitive Data
3. Risk Analysis
4. Security Assessment
5. Recommendations
`
      },
      {
        role: "user",
        content: prompt
      }
    ]
  });

  return completion.choices[0].message.content;
};

module.exports = {
  analyzeMessage,
  generateScanReport
};