const path = require("path");
const fs = require("fs");
const pool = require("./index");
const bcrypt = require("bcrypt");

const MIGRATIONS_DIR = path.join(__dirname, "migrations");
const MIGRATIONS_TABLE = "schema_migrations";

/**
 * 创建迁移记录表（若不存在）
 */
async function ensureMigrationsTable(connection) {
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
      name VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

/**
 * 获取已执行的迁移文件名列表
 */
async function getAppliedMigrations(connection) {
  const [rows] = await connection.execute(
    `SELECT name FROM ${MIGRATIONS_TABLE} ORDER BY name`
  );
  return new Set(rows.map((r) => r.name));
}

/**
 * 按文件名排序的待执行迁移列表（仅 .sql）
 */
function getMigrationFiles() {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    return [];
  }
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();
}

/**
 * 将 SQL 文件内容拆成单条语句（按分号拆分，忽略空行与注释行）
 */
function splitStatements(content) {
  return content
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("--"));
}

/**
 * 执行单条 SQL（忽略仅注释或空）
 */
async function runStatement(connection, sql) {
  const trimmed = sql.trim();
  if (!trimmed) return;
  await connection.execute(trimmed);
}

/**
 * 执行一个迁移文件并写入记录
 */
async function runMigrationFile(connection, filename) {
  const filepath = path.join(MIGRATIONS_DIR, filename);
  const content = fs.readFileSync(filepath, "utf8");
  const statements = splitStatements(content);

  for (const stmt of statements) {
    await runStatement(connection, stmt);
  }

  await connection.execute(
    `INSERT INTO ${MIGRATIONS_TABLE} (name) VALUES (?)`,
    [filename]
  );
  console.log(`  [migrate] applied: ${filename}`);
}

/**
 * 确保 system 管理员用户存在（密码 Admin123）
 */
async function ensureSystemUser(connection) {
  const adminUsername = "system";
  const adminEmail = "system@local";
  const adminPasswordHash = await bcrypt.hash("Admin123", 10);
  await connection.execute(
    `INSERT INTO users (username, email, password_hash, status)
     VALUES (?, ?, ?, 1)
     ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), status = 1`,
    [adminUsername, adminEmail, adminPasswordHash]
  );
}

/**
 * 启动时执行：按顺序执行 migrations 目录下未执行过的 .sql，并更新迁移记录表
 */
async function runMigrations() {
  console.log("Starting database migrations...");
  let connection;
  try {
    connection = await pool.getConnection();
    await ensureMigrationsTable(connection);
    const applied = await getAppliedMigrations(connection);
    const files = getMigrationFiles();

    for (const filename of files) {
      if (applied.has(filename)) {
        continue;
      }
      console.log(`Running migration: ${filename}`);
      await runMigrationFile(connection, filename);
    }

    await ensureSystemUser(connection);
    console.log("Database migrations completed.");
  } catch (error) {
    console.error("Database migration failed:", error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

module.exports = { runMigrations };
