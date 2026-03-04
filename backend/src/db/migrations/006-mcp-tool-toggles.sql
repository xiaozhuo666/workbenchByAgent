CREATE TABLE IF NOT EXISTS ai_mcp_tool_toggles (
  tool_name VARCHAR(128) PRIMARY KEY,
  enabled TINYINT NOT NULL DEFAULT 1,
  updated_by BIGINT NULL,
  reason VARCHAR(255) NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ai_mcp_toggle_audits (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  tool_name VARCHAR(128) NOT NULL,
  before_enabled TINYINT NOT NULL,
  after_enabled TINYINT NOT NULL,
  operator_id BIGINT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_ai_mcp_toggle_audits_tool_name (tool_name),
  KEY idx_ai_mcp_toggle_audits_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
