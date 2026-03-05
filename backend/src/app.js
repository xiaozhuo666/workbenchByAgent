const express = require("express");
const cors = require("cors");
const env = require("./config/env");
const requestContext = require("./middleware/requestContext");
const { errorHandler } = require("./middleware/errorHandler");
const authRoutes = require("./modules/auth/auth.routes");
const todoRoutes = require("./modules/todo/todo.routes");
const scheduleRoutes = require("./modules/schedule/schedule.routes");
const aiRoutes = require("./modules/ai/ai.routes");
const ticketRoutes = require("./modules/ai/ticket/ticket.routes");

const app = express();

app.use(cors({ 
  origin: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"]
}));
app.use(express.json());
app.use(requestContext);

// Simple request logger
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

app.get("/api/health", (req, res) => {
  res.json({ code: "OK", message: "healthy" });
});

app.use("/api/auth", authRoutes);
app.use("/api/todos", todoRoutes);
app.use("/api/schedules", scheduleRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api", ticketRoutes);

app.use(errorHandler);

module.exports = app;
