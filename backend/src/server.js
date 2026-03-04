const app = require("./app");
const env = require("./config/env");
const { runMigrations } = require("./db/migrate");

async function startServer() {
  try {
    // Run DB migrations before starting server
    await runMigrations();
    
    app.listen(env.port, () => {
      console.log(`backend listening on ${env.port}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

startServer();

// Keep process alive
setInterval(() => {}, 1000);
