const pool = require("./src/db");

async function checkDb() {
  try {
    const [counts] = await pool.query("SELECT user_id, COUNT(*) as count FROM ai_conversations GROUP BY user_id");
    console.log("Conversations per user:", counts);

    const [all] = await pool.query("SELECT * FROM ai_conversations");
    console.log("Total conversations:", all.length);
    
    const [users] = await pool.query("SELECT id, username FROM users");
    console.log("Users in DB:", users);

  } catch (err) {
    console.error("Error checking rows:", err);
  } finally {
    process.exit();
  }
}

checkDb();
