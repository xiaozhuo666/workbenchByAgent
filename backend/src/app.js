const express = require("express");
const cors = require("cors");
const env = require("./config/env");
const requestContext = require("./middleware/requestContext");
const { errorHandler } = require("./middleware/errorHandler");
const authRoutes = require("./modules/auth/auth.routes");
const todoRoutes = require("./modules/todo/todo.routes");
const scheduleRoutes = require("./modules/schedule/schedule.routes");
const aiRoutes = require("./modules/ai/ai.routes");

const app = express();

// 极其详细的全局请求日志（放在最前面，确保任何请求都能被记录）
app.use((req, res, next) => {
  const origin = req.get('origin') || 'no-origin';
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - Origin: ${origin} - IP: ${req.ip}`);
  next();
});

app.use(cors({ 
  origin: (origin, callback) => {
    callback(null, true);
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"]
}));
app.use(express.json());
app.use(requestContext);

app.get("/api/health", (req, res) => {
  res.json({ code: "OK", message: "healthy" });
});

app.use("/api/auth", authRoutes);
app.use("/api/todos", todoRoutes);
app.use("/api/schedules", scheduleRoutes);
app.use("/api/ai", aiRoutes);

app.use(errorHandler);

module.exports = app;
