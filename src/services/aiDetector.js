const Groq = require("groq-sdk");

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

async function detectSensitiveData(text) {
  try {
    const prompt = `
Extract sensitive personal information from the text.

Return ONLY JSON:
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
      model: "llama-3.3-70b-versatile", // ✅ FIXED MODEL
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0,
    });

    const result = response.choices[0].message.content;

    return JSON.parse(result);

  } catch (error) {
    console.error("❌ AI Detection Error:", error.message);
    return {};
  }
}

module.exports = { detectSensitiveData };