const pool = require("./src/db");

async function checkSchema() {
  try {
    const [tables] = await pool.query("SHOW TABLES");
    console.log("Tables in database:", tables.map(t => Object.values(t)[0]));

    for (const table of tables.map(t => Object.values(t)[0])) {
      const [columns] = await pool.query(`DESCRIBE ${table}`);
      console.log(`\nSchema for table ${table}:`);
      columns.forEach(col => {
        console.log(`- ${col.Field}: ${col.Type} (Null: ${col.Null}, Key: ${col.Key}, Default: ${col.Default}, Extra: ${col.Extra})`);
      });

      const [rows] = await pool.query(`SELECT COUNT(*) as count FROM ${table}`);
      console.log(`Row count for ${table}:`, rows[0].count);
    }
  } catch (err) {
    console.error("Error checking schema:", err);
  } finally {
    process.exit();
  }
}

checkSchema();
