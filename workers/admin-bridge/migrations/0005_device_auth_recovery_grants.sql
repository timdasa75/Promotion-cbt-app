-- One-time, administrator-issued recovery grants for device-authentication email failures.
-- A grant can only be consumed by the target user's authenticated session and expires quickly.

CREATE TABLE IF NOT EXISTS device_auth_recovery_grants (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  issued_by_user_id TEXT NOT NULL DEFAULT '',
  issued_by_email TEXT NOT NULL DEFAULT '',
  reason TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  consumed_at TEXT NOT NULL DEFAULT '',
  revoked_at TEXT NOT NULL DEFAULT '',
  consumed_device_fingerprint TEXT NOT NULL DEFAULT '',
  FOREIGN KEY (user_id) REFERENCES auth_users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_device_auth_recovery_active
  ON device_auth_recovery_grants(user_id, consumed_at, revoked_at, expires_at);
