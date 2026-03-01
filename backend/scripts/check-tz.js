const pool = require("../src/db");
require("dotenv").config();

async function checkTz() {
  try {
    const [rows] = await pool.execute("SELECT @@global.time_zone, @@session.time_zone, NOW()");
    console.log("DB Timezone info:", rows[0]);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkTz();
