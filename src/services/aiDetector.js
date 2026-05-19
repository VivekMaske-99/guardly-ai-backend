const Groq = require("groq-sdk");

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

async function detectSensitiveData(text) {
  try {
    const prompt = `
Extract sensitive personal information from the text.

STRICT RULES:
- Return ONLY valid JSON
- Do NOT use backticks
- Do NOT add explanation
- If not found, return empty string

FORMAT:
{
  "name": "",
  "email": "",
  "phone": "",
  "location": ""
}

Text:
${text}
`;

    const response = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0,
    });

    let result = response.choices[0].message.content;

    console.log("🤖 RAW AI RESPONSE:", result);

    // ===============================
    // 🔥 CLEAN RESPONSE (CRITICAL)
    // ===============================
    result = result
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    // ===============================
    // 🔥 SAFE JSON EXTRACTION
    // ===============================
    const jsonMatch = result.match(/\{[\s\S]*\}/);

    let parsed = {
      name: "",
      email: "",
      phone: "",
      location: "",
    };

    if (jsonMatch) {
      try {
        const temp = JSON.parse(jsonMatch[0]);

        parsed = {
          name: temp.name || "",
          email: temp.email || "",
          phone: temp.phone || "",
          location: temp.location || "",
        };
      } catch (err) {
        console.error("❌ JSON Parse Failed:", err.message);
      }
    } else {
      console.log("⚠️ No JSON found in AI response");
    }

    console.log("✅ FINAL PARSED DATA:", parsed);

    return parsed;

  } catch (error) {
    console.error("❌ AI Detection Error:", error.message);
    return {
      name: "",
      email: "",
      phone: "",
      location: "",
    };
  }
}

module.exports = { detectSensitiveData };