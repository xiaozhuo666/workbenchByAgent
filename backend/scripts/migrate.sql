CREATE DATABASE IF NOT EXISTS ai_workbench CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ai_workbench;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(32) NOT NULL,
  email VARCHAR(128) NULL,
  password_hash VARCHAR(255) NOT NULL,
  status TINYINT NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_users_username (username),
  UNIQUE KEY uk_users_email (email)
);

CREATE TABLE IF NOT EXISTS sessions (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  jti VARCHAR(64) NOT NULL,
  token_expires_at DATETIME NOT NULL,
  revoked_at DATETIME NULL,
  ip VARCHAR(45) NULL,
  user_agent VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_sessions_jti (jti),
  KEY idx_sessions_user_id (user_id),
  KEY idx_sessions_token_expires_at (token_expires_at),
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS todos (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NULL,
  status ENUM('pending', 'completed') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_todos_user_id (user_id),
  CONSTRAINT fk_todos_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS schedules (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NULL,
  start_time DATETIME NOT NULL,
  end_time DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_schedules_user_id (user_id),
  KEY idx_schedules_start_time (start_time),
  CONSTRAINT fk_schedules_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS ai_command_logs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  raw_text TEXT NOT NULL,
  parsed_json JSON NULL,
  command_type ENUM('generate_todo', 'batch_update', 'chat', 'generate_task') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_ai_command_logs_user_id (user_id),
  CONSTRAINT fk_ai_command_logs_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS ai_conversations (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  conversation_id VARCHAR(64) NOT NULL,
  role ENUM('user', 'assistant') NOT NULL,
  content LONGTEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_ai_conversations_user_id (user_id),
  KEY idx_ai_conversations_conversation_id (conversation_id),
  KEY idx_ai_conversations_created_at (created_at),
  CONSTRAINT fk_ai_conversations_user FOREIGN KEY (user_id) REFERENCES users(id)
);

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
  KEY idx_ai_mcp_tool_logs_conversation_id (conversation_id),
  KEY idx_ai_mcp_tool_logs_tool_name (tool_name)
);

CREATE TABLE IF NOT EXISTS ai_mcp_tool_traces (
  conversation_id VARCHAR(64) PRIMARY KEY,
  total_calls INT NOT NULL DEFAULT 0,
  success_calls INT NOT NULL DEFAULT 0,
  failed_calls INT NOT NULL DEFAULT 0,
  fallback_triggered TINYINT NOT NULL DEFAULT 0,
  final_response_type ENUM('tool_enhanced', 'model_only') NOT NULL DEFAULT 'model_only',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_mcp_tool_toggles (
  tool_name VARCHAR(128) PRIMARY KEY,
  enabled TINYINT NOT NULL DEFAULT 1,
  updated_by BIGINT NULL,
  reason VARCHAR(255) NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_mcp_toggle_audits (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  tool_name VARCHAR(128) NOT NULL,
  before_enabled TINYINT NOT NULL,
  after_enabled TINYINT NOT NULL,
  operator_id BIGINT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_ai_mcp_toggle_audits_tool_name (tool_name)
);

INSERT INTO users (username, email, password_hash, status)
VALUES (
  'system',
  'system@local',
  '$2b$10$NA5i31JSWMPk9Tpm2gHZHOT3zJ4kTuQaHe3o6T2b08S0v6vqNP96i',
  1
)
ON DUPLICATE KEY UPDATE
password_hash = VALUES(password_hash),
status = 1;
