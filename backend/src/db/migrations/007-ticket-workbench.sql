CREATE TABLE IF NOT EXISTS ticket_drafts (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  draft_id VARCHAR(64) NOT NULL UNIQUE,
  user_id BIGINT NOT NULL,
  source VARCHAR(32) NOT NULL DEFAULT 'ai_assistant',
  from_city VARCHAR(64) NOT NULL,
  from_station_code VARCHAR(16) NULL,
  to_city VARCHAR(64) NOT NULL,
  to_station_code VARCHAR(16) NULL,
  travel_date DATE NOT NULL,
  train_types JSON NULL,
  departure_time_range VARCHAR(32) NULL,
  seat_types JSON NULL,
  strategy VARCHAR(24) NULL,
  status ENUM('collecting', 'ready', 'expired') NOT NULL DEFAULT 'ready',
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_ticket_drafts_user_id (user_id),
  KEY idx_ticket_drafts_status (status),
  KEY idx_ticket_drafts_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ticket_query_logs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  draft_id VARCHAR(64) NOT NULL,
  user_id BIGINT NOT NULL,
  query_status ENUM('success', 'partial', 'timeout', 'error') NOT NULL DEFAULT 'success',
  result_count INT NOT NULL DEFAULT 0,
  duration_ms INT NOT NULL DEFAULT 0,
  error_code VARCHAR(64) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_ticket_query_logs_draft_id (draft_id),
  KEY idx_ticket_query_logs_user_id (user_id),
  KEY idx_ticket_query_logs_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
