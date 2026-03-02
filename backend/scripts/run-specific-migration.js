const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

// Explicitly load .env from the root
dotenv.config({ path: path.join(__dirname, "../.env") });

const pool = require("../src/db");

async function runMigration() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error("Please provide a migration file path.");
    process.exit(1);
  }

  const sqlPath = path.isAbsolute(args[0]) ? args[0] : path.join(process.cwd(), args[0]);
  if (!fs.existsSync(sqlPath)) {
    console.error(`File not found: ${sqlPath}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(sqlPath, "utf8");

  const statements = sql
    .split(";")
    .map(s => s.trim())
    .filter(s => s.length > 0);

  console.log(`Starting migration ${path.basename(sqlPath)} with ${statements.length} statements...`);

  for (const statement of statements) {
    try {
      await pool.query(statement);
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
