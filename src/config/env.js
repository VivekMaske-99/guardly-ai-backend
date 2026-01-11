require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 3000,
  GROQ_API_KEY: process.env.GROQ_API_KEY,
  MONGO_URI: process.env.MONGO_URI,
};
