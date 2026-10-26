ALTER TABLE deals ADD COLUMN connect_details_json JSON NULL;
CREATE TABLE IF NOT EXISTS deal_save_requests (
 id VARCHAR(64) NOT NULL,
 user_id VARCHAR(64) NOT NULL,
 payload_hash CHAR(64) NOT NULL,
 saved_ids_json JSON NOT NULL,
 created_at DATETIME NOT NULL,
 PRIMARY KEY (id,user_id),
 CONSTRAINT fk_deal_save_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS deal_import_history (
 id VARCHAR(64) PRIMARY KEY,
 deal_id VARCHAR(64) NULL,
 source_key VARCHAR(255) NOT NULL UNIQUE,
 before_json JSON NULL,
 after_json JSON NOT NULL,
 source_json JSON NOT NULL,
 imported_at DATETIME NOT NULL,
 CONSTRAINT fk_deal_import_deal FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
