-- Required once for databases created before these columns were added to initDB.js.
-- Check with `SHOW COLUMNS FROM users` before running against an unknown schema.
ALTER TABLE users
  ADD COLUMN reset_token TEXT NULL,
  ADD COLUMN reset_token_expires TIMESTAMP NULL;
