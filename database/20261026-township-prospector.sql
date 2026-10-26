CREATE TABLE IF NOT EXISTS township_leads (
  id VARCHAR(64) NOT NULL,
  business_name VARCHAR(190) NOT NULL,
  brand VARCHAR(160) NULL,
  industry VARCHAR(160) NOT NULL,
  township VARCHAR(160) NOT NULL,
  suburb VARCHAR(160) NULL,
  address TEXT NULL,
  standalone TINYINT(1) NULL,
  lat DECIMAL(10,7) NULL,
  lng DECIMAL(10,7) NULL,
  phone VARCHAR(80) NULL,
  email VARCHAR(190) NULL,
  website VARCHAR(255) NULL,
  contact_person VARCHAR(160) NULL,
  owner_operator VARCHAR(160) NULL,
  energy_profile TEXT NULL,
  notes TEXT NULL,
  source_url VARCHAR(500) NULL,
  electricity_provider VARCHAR(160) NULL,
  water_provider VARCHAR(160) NULL,
  utility_confidence VARCHAR(40) NULL,
  utility_rule VARCHAR(255) NULL,
  utility_source VARCHAR(500) NULL,
  utility_confirmed VARCHAR(255) NULL,
  rooftop_solar VARCHAR(20) NOT NULL DEFAULT 'unknown',
  roof_area_m2 DECIMAL(12,2) NULL,
  marketing_consent DATETIME NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'New',
  owner_external_id VARCHAR(64) NULL,
  score SMALLINT NULL,
  tier VARCHAR(4) NULL,
  created_by VARCHAR(190) NULL,
  crm_deal_id VARCHAR(64) NULL,
  version INT UNSIGNED NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_tp_leads_status (status, updated_at),
  KEY idx_tp_leads_area (township, suburb),
  KEY idx_tp_leads_crm (crm_deal_id),
  CONSTRAINT fk_tp_leads_crm_deal FOREIGN KEY (crm_deal_id) REFERENCES deals(id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS township_lead_activity (
  id VARCHAR(64) NOT NULL,
  lead_id VARCHAR(64) NOT NULL,
  body TEXT NOT NULL,
  created_by_external VARCHAR(64) NULL,
  created_by_name VARCHAR(190) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_tp_activity_lead (lead_id, created_at),
  CONSTRAINT fk_tp_activity_lead FOREIGN KEY (lead_id) REFERENCES township_leads(id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS township_lead_photos (
  id VARCHAR(64) NOT NULL,
  lead_id VARCHAR(64) NOT NULL,
  storage_path VARCHAR(500) NOT NULL,
  caption VARCHAR(255) NULL,
  uploaded_by_external VARCHAR(64) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_tp_photos_lead (lead_id, created_at),
  CONSTRAINT fk_tp_photos_lead FOREIGN KEY (lead_id) REFERENCES township_leads(id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS township_lead_promotions (
  id VARCHAR(64) NOT NULL,
  request_id VARCHAR(64) NOT NULL,
  lead_id VARCHAR(64) NOT NULL,
  crm_deal_id VARCHAR(64) NOT NULL,
  decision ENUM('created','linked','separate') NOT NULL,
  promoted_by_external VARCHAR(64) NULL,
  promoted_by_name VARCHAR(190) NULL,
  snapshot_json JSON NOT NULL,
  promoted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_tp_promotion_request (request_id),
  UNIQUE KEY uq_tp_promotion_lead (lead_id),
  KEY idx_tp_promotion_deal (crm_deal_id),
  CONSTRAINT fk_tp_promotion_lead FOREIGN KEY (lead_id) REFERENCES township_leads(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_tp_promotion_deal FOREIGN KEY (crm_deal_id) REFERENCES deals(id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
