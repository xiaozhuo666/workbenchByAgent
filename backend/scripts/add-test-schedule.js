const pool = require("../src/db");
require("dotenv").config();

async function addTest() {
  try {
    const userId = 2;
    const title = "Manual Test 1st March";
    const startTime = "2026-03-01 14:00:00";
    const [result] = await pool.execute(
      "INSERT INTO schedules (user_id, title, start_time) VALUES (?, ?, ?)",
      [userId, title, startTime]
    );
    console.log("Inserted manual test:", result.insertId);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

addTest();
