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
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_ai_mcp_tool_logs_conversation_id (conversation_id),
  KEY idx_ai_mcp_tool_logs_tool_name (tool_name),
  KEY idx_ai_mcp_tool_logs_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ai_mcp_tool_traces (
  conversation_id VARCHAR(64) PRIMARY KEY,
  total_calls INT NOT NULL DEFAULT 0,
  success_calls INT NOT NULL DEFAULT 0,
  failed_calls INT NOT NULL DEFAULT 0,
  fallback_triggered TINYINT NOT NULL DEFAULT 0,
  final_response_type ENUM('tool_enhanced', 'model_only') NOT NULL DEFAULT 'model_only',
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
