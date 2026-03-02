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

// 详细的请求日志记录（放在 CORS 之前，用于诊断 preflight 预检请求）
app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    console.log(`${new Date().toISOString()} [PREFLIGHT] ${req.method} ${req.url} Origin: ${req.get('origin') || 'none'}`);
  } else {
    console.log(`${new Date().toISOString()} [REQUEST] ${req.method} ${req.url} Origin: ${req.get('origin') || 'none'}`);
  }
  next();
});

app.use(cors({ 
  origin: true, // 允许所有来源（反射请求头中的 Origin），解决本地开发中的 localhost vs 127.0.0.1 问题
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
