const pool = require("./src/db");

async function checkData() {
  try {
    const [rows] = await pool.query("SELECT * FROM ai_conversations WHERE user_id = 1");
    console.log("Conversations for user_id=1:", rows.length);
    if (rows.length > 0) {
      console.log("First row:", rows[0]);
    }

    const [allUsers] = await pool.query("SELECT * FROM users");
    console.log("All users:", allUsers);

  } catch (err) {
    console.error("Error:", err);
  } finally {
    process.exit();
  }
}

checkData();
