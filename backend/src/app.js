const express = require("express");
const cors = require("cors");
const env = require("./config/env");
const requestContext = require("./middleware/requestContext");
const { errorHandler } = require("./middleware/errorHandler");
const authRoutes = require("./modules/auth/auth.routes");

const app = express();

app.use(cors({ origin: env.corsOrigin }));
app.use(express.json());
app.use(requestContext);

app.get("/api/health", (req, res) => {
  res.json({ code: "OK", message: "healthy" });
});

app.use("/api/auth", authRoutes);

app.use(errorHandler);

module.exports = app;
