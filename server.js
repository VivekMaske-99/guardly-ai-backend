// server.js
const app = require("./src/app");
const { PORT, MONGO_URI } = require("./src/config/env");
const mongoose = require("mongoose");

const http = require("http");
const { Server } = require("socket.io");

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

// 🔥 make socket available globally
app.set("io", io);

// DB connect
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error(err));

// Start server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});