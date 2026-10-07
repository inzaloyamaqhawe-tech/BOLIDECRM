-- Bolide CRM, Xneelo-ready MySQL schema
-- Run this in phpMyAdmin or the MySQL console after creating the Xneelo database.
-- Target: MySQL 8 / MariaDB 10.x, InnoDB, utf8mb4.

SET NAMES utf8mb4;
SET time_zone = '+00:00';

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) NOT NULL,
  name VARCHAR(160) NOT NULL,
  email VARCHAR(190) NOT NULL,
  password_hash VARCHAR(255) NULL,
  role ENUM('admin', 'rep') NOT NULL DEFAULT 'rep',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  KEY idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS companies (
  id VARCHAR(64) NOT NULL,
  name VARCHAR(190) NOT NULL,
  industry VARCHAR(160) NOT NULL DEFAULT '',
  status ENUM('Prospect', 'Customer', 'Churned') NOT NULL DEFAULT 'Prospect',
  website VARCHAR(255) NULL,
  phone VARCHAR(80) NULL,
  address TEXT NULL,
  divisions_json JSON NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_companies_name (name),
  KEY idx_companies_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS contacts (
  id VARCHAR(64) NOT NULL,
  company_id VARCHAR(64) NOT NULL,
  name VARCHAR(160) NOT NULL,
  email VARCHAR(190) NOT NULL,
  phone VARCHAR(80) NULL,
  role VARCHAR(160) NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_contacts_company (company_id),
  KEY idx_contacts_email (email),
  CONSTRAINT fk_contacts_company FOREIGN KEY (company_id) REFERENCES companies(id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS deals (
  id VARCHAR(64) NOT NULL,
  title VARCHAR(220) NOT NULL,
  company_id VARCHAR(64) NOT NULL,
  primary_contact_id VARCHAR(64) NULL,
  primary_contact_name VARCHAR(160) NULL,
  site VARCHAR(190) NULL,
  division ENUM('energy', 'secure', 'connect', 'water', 'saas') NOT NULL,
  segment ENUM('Commercial', 'Industrial', 'Forecourt', 'MDU') NULL,
  product_line VARCHAR(160) NULL,
  stage ENUM('lead', 'qualified', 'quote', 'final_proposal', 'negotiation', 'won', 'lost') NOT NULL DEFAULT 'lead',
  once_off DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  mrr DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  owner_id VARCHAR(64) NOT NULL,
  close_date DATE NULL,
  notes TEXT NULL,
  lost_reason TEXT NULL,
  received_at DATETIME NULL,
  proposal_sent_at DATETIME NULL,
  stage_changed_at DATETIME NULL,
  secure_details_json JSON NULL,
  energy_details_json JSON NULL,
  water_details_json JSON NULL,
  financing_details_json JSON NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  KEY idx_deals_company (company_id),
  KEY idx_deals_owner (owner_id),
  KEY idx_deals_stage (stage),
  KEY idx_deals_division (division),
  KEY idx_deals_close_date (close_date),
  CONSTRAINT chk_lost_reason CHECK (stage <> 'lost' OR (lost_reason IS NOT NULL AND CHAR_LENGTH(TRIM(lost_reason)) > 0)),
  CONSTRAINT fk_deals_company FOREIGN KEY (company_id) REFERENCES companies(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_deals_contact FOREIGN KEY (primary_contact_id) REFERENCES contacts(id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_deals_owner FOREIGN KEY (owner_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS activities (
  id VARCHAR(64) NOT NULL,
  deal_id VARCHAR(64) NULL,
  company_id VARCHAR(64) NULL,
  type ENUM('note', 'call', 'task', 'stage-change', 'update', 'system') NOT NULL DEFAULT 'note',
  body TEXT NOT NULL,
  user_id VARCHAR(64) NULL,
  created_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  KEY idx_activities_deal (deal_id, created_at),
  KEY idx_activities_company (company_id, created_at),
  KEY idx_activities_created (created_at),
  CONSTRAINT fk_activities_deal FOREIGN KEY (deal_id) REFERENCES deals(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_activities_company FOREIGN KEY (company_id) REFERENCES companies(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_activities_user FOREIGN KEY (user_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tasks (
  id VARCHAR(64) NOT NULL,
  title VARCHAR(220) NOT NULL,
  due_date DATE NULL,
  deal_id VARCHAR(64) NULL,
  done TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_tasks_deal (deal_id),
  KEY idx_tasks_due (due_date, done),
  CONSTRAINT fk_tasks_deal FOREIGN KEY (deal_id) REFERENCES deals(id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS division_overrides (
  division_key ENUM('energy', 'secure', 'connect', 'water', 'saas') NOT NULL,
  description TEXT NULL,
  product_lines_json JSON NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (division_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS stage_overrides (
  stage_key ENUM('lead', 'qualified', 'quote', 'final_proposal', 'negotiation', 'won', 'lost') NOT NULL,
  label VARCHAR(80) NULL,
  probability TINYINT UNSIGNED NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (stage_key),
  CONSTRAINT chk_stage_probability CHECK (probability IS NULL OR probability <= 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS attachments (
  id VARCHAR(64) NOT NULL,
  deal_id VARCHAR(64) NOT NULL,
  filename VARCHAR(255) NOT NULL,
  mime_type VARCHAR(120) NOT NULL DEFAULT 'application/octet-stream',
  size_bytes INT UNSIGNED NOT NULL,
  data_url LONGTEXT NOT NULL,
  created_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  KEY idx_attachments_deal (deal_id, created_at),
  CONSTRAINT fk_attachments_deal FOREIGN KEY (deal_id) REFERENCES deals(id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS crm_revision (id INT PRIMARY KEY, revision BIGINT NOT NULL DEFAULT 0) ENGINE=InnoDB;
INSERT IGNORE INTO crm_revision (id, revision) VALUES (1, 0);
