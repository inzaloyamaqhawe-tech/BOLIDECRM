ALTER TABLE deals ADD COLUMN created_by_id VARCHAR(64) NULL;
ALTER TABLE deals ADD COLUMN duplicate_details_json JSON NULL;
CREATE TABLE IF NOT EXISTS deal_merge_history (
 id VARCHAR(64) PRIMARY KEY,
 kept_deal_id VARCHAR(64) NULL,
 source_deal_id VARCHAR(64) NULL,
 snapshot_json JSON NOT NULL,
 merged_by VARCHAR(64) NULL,
 merged_at DATETIME NOT NULL,
 KEY idx_merge_kept (kept_deal_id, merged_at),
 CONSTRAINT fk_merge_kept FOREIGN KEY (kept_deal_id) REFERENCES deals(id) ON DELETE SET NULL,
 CONSTRAINT fk_merge_user FOREIGN KEY (merged_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
