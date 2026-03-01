const pool = require("../src/db");
require("dotenv").config();

async function checkSchedules() {
  try {
    const [rows] = await pool.execute("SELECT * FROM schedules");
    console.log("All schedules in DB:", JSON.stringify(rows, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkSchedules();
