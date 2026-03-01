const fs = require("fs");
const path = require("path");
const pool = require("../src/db");

async function runMigration() {
  const sqlPath = path.join(__dirname, "migrate.sql");
  const sql = fs.readFileSync(sqlPath, "utf8");

  // Split the SQL into individual statements. This is a naive split
  // but usually works for simple migration files without stored procedures.
  const statements = sql
    .split(";")
    .map(s => s.trim())
    .filter(s => s.length > 0);

  console.log(`Starting migration with ${statements.length} statements...`);

  for (const statement of statements) {
    try {
      await pool.query(statement);
      // console.log("Executed:", statement.slice(0, 50) + "...");
    } catch (error) {
      console.error("Migration error at statement:", statement);
      console.error(error);
      process.exit(1);
    }
  }

  console.log("Migration completed successfully!");
  process.exit(0);
}

runMigration();
