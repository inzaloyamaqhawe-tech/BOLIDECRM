-- Additive migration. Back up the database first. Run once on existing installations.
ALTER TABLE deals ADD COLUMN workflow_json JSON NULL;
ALTER TABLE tasks ADD COLUMN options_json JSON NULL;
ALTER TABLE activities ADD COLUMN changes_json JSON NULL;
ALTER TABLE users ADD COLUMN saved_views_json JSON NULL;
