🛡 GuardLY AI Backend

GuardLY is an AI-powered cybersecurity platform backend that combines a conversational security assistant, threat intelligence engine, dynamic risk scoring, alert automation, analytics APIs, and professional security report generation.

This backend serves both:

🤖 AI Chatbot (security guidance & detection)

📊 Security Dashboard (analytics, alerts, reports)

🚀 Features
🔐 AI Chatbot Backend

AI-based cybersecurity assistant (Groq LLM)

Detects phishing, scams, malware, suspicious activity

Returns structured JSON responses

Assigns severity and riskLevel (1–10) based on cybersecurity standards

Stores conversation history

📊 Dashboard Backend

Dynamic risk score calculation (weekly-based)

Threat event logging (event-driven architecture)

Category aggregation (phishing, malware, scams, etc.)

Weekly trend analytics

Alerts generation & storage

Security health scoring

Professional PDF & DOC security report generation

🧠 Risk Scoring Standard

GuardLY follows a CVSS-inspired risk model:

Threat Type	Risk Level
Awareness	1–3
Suspicious Activity	4–5
Phishing Attempt	6–7
Malware Infection	8–9
Ransomware / Financial Fraud	9–10

Risk score is calculated dynamically using last 7 days of threat events.

🗂 Project Structure
src/
├── controllers/
│   ├── chatController.js        # AI chatbot logic
│   ├── dashboardController.js   # Dashboard APIs (overview, trends, categories)
│   ├── reportController.js      # PDF/DOC report generation
│   └── userController.js        # User-related APIs (future-ready)
│
├── models/
│   ├── ChatHistory.js           # Stores chatbot conversations
│   ├── ThreatEvent.js           # Core event-based threat logging
│   ├── UserRiskProfile.js       # User risk score & security health
│   └── UserAlert.js             # Alerts generated from risk engine
│
├── routes/
│   ├── apiRoutes.js             # Chatbot routes
│   ├── dashboardRoutes.js       # Dashboard analytics routes
│   └── reportRoutes.js          # Report download routes
│
├── services/
│   ├── groqService.js           # AI model integration
│   ├── riskEngine.js            # Risk calculation logic
│   └── alertEngine.js           # Alert generation logic
│
├── app.js                       # Express app configuration
└── server.js                    # Server entry point

🧪 Testing Locally
1️⃣ Install dependencies
npm install
2️⃣ Create .env file
PORT=3000
MONGO_URI=your_mongodb_url
GROQ_API_KEY=your_groq_key

⚠️ Never commit .env to GitHub

3️⃣ Start server
npm run dev

Server runs at:

http://localhost:3000

🧩 Tech Stack

Node.js

Express.js

MongoDB + Mongoose

Groq AI SDK

PDFKit

DOCX

REST APIs

🧱  HIGH-LEVEL ARCHITECTURE FLOW (SYSTEM VIEW)
┌──────────────┐
│   Frontend   │
│ (Dashboard / │
│   Chat UI)   │
└──────┬───────┘
       │ HTTP / REST APIs
       ▼
┌─────────────────────────────┐
│        GuardLY Backend      │
│     (Node.js + Express)     │
└──────┬──────────┬──────────┘
       │          │
       │          │
       ▼          ▼
┌──────────────┐  ┌─────────────────┐
│  AI Engine   │  │   Risk Engine   │
│ (Groq LLM)   │  │ (Scoring Logic) │
└──────┬───────┘  └──────┬──────────┘
       │                 │
       ▼                 ▼
┌─────────────────────────────────┐
│          MongoDB Database        │
│  (Threats, Risk, Alerts, Chats) │
└─────────────────────────────────┘
