const pool = require("./index");
const bcrypt = require("bcrypt");

/**
 * Database Migration Script
 * Ensures that necessary AI tables and columns exist.
 */
async function runMigrations() {
  console.log("Starting database migrations...");
  let connection;
  try {
    connection = await pool.getConnection();

    // 1. Ensure ai_conversations table exists
    // We check and create with correct schema
    console.log("Checking ai_conversations table...");
    
    // Check if table exists
    const [tables] = await connection.execute("SHOW TABLES LIKE 'ai_conversations'");
    
    if (tables.length === 0) {
      console.log("Creating ai_conversations table...");
      await connection.execute(`
        CREATE TABLE ai_conversations (
          id VARCHAR(64) PRIMARY KEY,
          user_id BIGINT NOT NULL,
          title VARCHAR(255),
          model VARCHAR(50),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_user_id (user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
    } else {
      // Table exists, check for missing columns
      const [cols] = await connection.execute("SHOW COLUMNS FROM ai_conversations");
      const colNames = cols.map(c => c.Field);
      
      // Fix potential schema issues (from current manual edits)
      if (!colNames.includes("title")) {
        await connection.execute("ALTER TABLE ai_conversations ADD COLUMN title VARCHAR(255) AFTER user_id");
        console.log("Added 'title' column to ai_conversations");
      }
      if (!colNames.includes("model")) {
        await connection.execute("ALTER TABLE ai_conversations ADD COLUMN model VARCHAR(50) AFTER title");
        console.log("Added 'model' column to ai_conversations");
      }
      if (!colNames.includes("updated_at")) {
        await connection.execute("ALTER TABLE ai_conversations ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at");
        console.log("Added 'updated_at' column to ai_conversations");
      }
    }

    // 2. Ensure ai_messages table exists
    console.log("Checking ai_messages table...");
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS ai_messages (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        conversation_id VARCHAR(64) NOT NULL,
        role ENUM('user', 'assistant') NOT NULL,
        content LONGTEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_conversation_id (conversation_id),
        FOREIGN KEY (conversation_id) REFERENCES ai_conversations(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 3. Ensure MCP tables exist
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS ai_mcp_tool_logs (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        conversation_id VARCHAR(64) NOT NULL,
        user_id BIGINT NULL,
        round_index INT NOT NULL DEFAULT 1,
        tool_name VARCHAR(128) NOT NULL,
        args_summary TEXT NULL,
        status ENUM('success', 'failed', 'timeout', 'rejected') NOT NULL,
        duration_ms INT NOT NULL DEFAULT 0,
        error_message TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_ai_mcp_tool_logs_conversation_id (conversation_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS ai_mcp_tool_traces (
        conversation_id VARCHAR(64) PRIMARY KEY,
        total_calls INT NOT NULL DEFAULT 0,
        success_calls INT NOT NULL DEFAULT 0,
        failed_calls INT NOT NULL DEFAULT 0,
        fallback_triggered TINYINT NOT NULL DEFAULT 0,
        final_response_type ENUM('tool_enhanced', 'model_only') NOT NULL DEFAULT 'model_only',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS ai_mcp_tool_toggles (
        tool_name VARCHAR(128) PRIMARY KEY,
        enabled TINYINT NOT NULL DEFAULT 1,
        updated_by BIGINT NULL,
        reason VARCHAR(255) NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS ai_mcp_toggle_audits (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        tool_name VARCHAR(128) NOT NULL,
        before_enabled TINYINT NOT NULL,
        after_enabled TINYINT NOT NULL,
        operator_id BIGINT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_ai_mcp_toggle_audits_tool_name (tool_name)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 4. Ensure MCP admin account exists (system / Admin123)
    const adminUsername = "system";
    const adminEmail = "system@local";
    const adminPasswordHash = await bcrypt.hash("Admin123", 10);
    await connection.execute(
      `INSERT INTO users (username, email, password_hash, status)
       VALUES (?, ?, ?, 1)
       ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), status = 1`,
      [adminUsername, adminEmail, adminPasswordHash]
    );

    console.log("Database migrations completed successfully.");
  } catch (error) {
    console.error("Database migration failed:", error);
    // Don't crash the server, just log the error
  } finally {
    if (connection) connection.release();
  }
}

module.exports = { runMigrations };
