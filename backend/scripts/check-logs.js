const pool = require("../src/db");
require("dotenv").config();

async function checkLogs() {
  try {
    const [rows] = await pool.execute("SELECT * FROM ai_command_logs ORDER BY created_at DESC LIMIT 5");
    console.log("AI logs:", JSON.stringify(rows, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkLogs();
