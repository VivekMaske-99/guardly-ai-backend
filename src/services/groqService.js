const Groq = require("groq-sdk");
const { GROQ_API_KEY } = require("../config/env");

const groq = new Groq({ apiKey: GROQ_API_KEY });

/* ================= CHAT AI (EXISTING) ================= */
const analyzeMessage = async (message, isFirstQuery = true) => {
  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content: `
You are GuardLY cybersecurity assistant.

Analyze the user message and respond in this JSON format:

{
  "ai": "short explanation",
  "risk": "type of risk",
  "severity": "Low | Medium | High | None",
  "impact": "impact description",
  "action": "what user should do",
  "likelihood": number,
  "impactScore": number,
  "riskLevel": number,
  "suggestions": ["suggestion1", "suggestion2"]
}
`
      },
      { role: "user", content: message }
    ]
  });

  let parsed;

  try {
    parsed = JSON.parse(completion.choices[0].message.content);
  } catch (e) {
    console.error("JSON Parse Error:", completion.choices[0].message.content);

    // 🔥 FALLBACK (VERY IMPORTANT)
    parsed = {
      ai: completion.choices[0].message.content || "Unable to analyze.",
      risk: "",
      severity: "None",
      impact: "",
      action: "",
      likelihood: 0,
      impactScore: 0,
      riskLevel: 0,
      suggestions: []
    };
  }

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