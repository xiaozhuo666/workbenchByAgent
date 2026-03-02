const pool = require("./src/db");

async function checkRows() {
  try {
    const [rows] = await pool.query("SELECT * FROM ai_conversations LIMIT 5");
    console.log("Last 5 conversations:", rows);
  } catch (err) {
    console.error("Error checking rows:", err);
  } finally {
    process.exit();
  }
}

checkRows();
