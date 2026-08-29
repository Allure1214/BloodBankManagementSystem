-- Run against an existing database before deploying the hardened API.
-- These statements intentionally fail if duplicate profiles, permission rows,
-- duplicate inventory keys, NULL bank IDs, or negative stock already exist.
-- Resolve such data first instead of silently discarding it.

ALTER TABLE user_profiles
  ADD CONSTRAINT uq_user_profiles_user_id UNIQUE (user_id);

ALTER TABLE admin_permissions
  ADD COLUMN can_manage_notifications BOOLEAN NOT NULL DEFAULT FALSE,
  ADD CONSTRAINT uq_admin_permissions_user_id UNIQUE (user_id);

ALTER TABLE blood_inventory
  MODIFY blood_bank_id INT NOT NULL,
  MODIFY units_available INT NOT NULL DEFAULT 0,
  ADD CONSTRAINT chk_inventory_nonnegative CHECK (units_available >= 0),
  ADD CONSTRAINT uq_bank_blood_type UNIQUE (blood_bank_id, blood_type);

