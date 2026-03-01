const pool = require("../src/db");
require("dotenv").config();

async function simulateApi() {
  try {
    const userId = 2;
    const startTime = "2026-03-01 00:00:00";
    const endTime = "2026-03-01 23:59:59";
    
    let query = "SELECT * FROM schedules WHERE user_id = ?";
    const params = [userId];
    if (startTime) {
      query += " AND start_time >= ?";
      params.push(startTime);
    }
    if (endTime) {
      query += " AND start_time <= ?";
      params.push(endTime);
    }
    query += " ORDER BY start_time ASC";
    
    const [rows] = await pool.execute(query, params);
    console.log("Simulated API Result:", JSON.stringify(rows, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

simulateApi();
