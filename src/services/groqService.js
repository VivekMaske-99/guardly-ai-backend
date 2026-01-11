const Groq = require('groq-sdk');
const { GROQ_API_KEY } = require('../config/env');

const groq = new Groq({
  apiKey: GROQ_API_KEY,
});

const SYSTEM_PROMPT = `
You are GuardLY — a cybersecurity and privacy protection assistant.

Analyze the user's message and return ONLY valid JSON in this exact format:

{
  "risk": "Short name of the threat",
  "impact": "What could go wrong for the user",
  "action": "One-line immediate action",
  "severity": "Low | Medium | High",
  "userMessage": "A detailed, friendly, easy-to-understand explanation for a normal non-technical person. Include step-by-step actions and prevention tips. Write like ChatGPT."
}

Rules:
- No markdown
- No extra text
- No code blocks
- Output must be valid JSON
`;


const analyzeMessage = async (message) => {
  try {
    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: message },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.2,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0].message.content;
    return JSON.parse(content);
  } catch (error) {
    console.error("Groq API Error:", error);
    throw new Error("Failed to analyze message");
  }
};

module.exports = { analyzeMessage };
