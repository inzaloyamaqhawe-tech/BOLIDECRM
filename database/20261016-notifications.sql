CREATE TABLE IF NOT EXISTS notifications (
  recipient_id VARCHAR(64) NOT NULL,
  id VARCHAR(190) NOT NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  url VARCHAR(255) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  read_at DATETIME NULL,
  PRIMARY KEY (recipient_id, id),
  KEY idx_notifications_unread (recipient_id, read_at, created_at),
  CONSTRAINT fk_notifications_recipient FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
