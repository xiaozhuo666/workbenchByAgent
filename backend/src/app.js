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

app.use(cors({ origin: env.corsOrigin }));
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
