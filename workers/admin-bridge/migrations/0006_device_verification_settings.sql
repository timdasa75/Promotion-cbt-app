-- Device verification settings: global recovery mode and per-user bypass.
-- Global recovery mode disables device verification for all users until expires_at.
-- Per-user bypass disables device verification for a specific user until expires_at.

CREATE TABLE IF NOT EXISTS device_verification_settings (
  id TEXT PRIMARY KEY,
  setting_type TEXT NOT NULL CHECK(setting_type IN ('global', 'per_user')),
  user_id TEXT NOT NULL DEFAULT '',
  enabled INTEGER NOT NULL DEFAULT 1,
  created_by TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  reason TEXT NOT NULL DEFAULT '',
  FOREIGN KEY (user_id) REFERENCES auth_users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_dvs_global_active
  ON device_verification_settings(setting_type, enabled, expires_at);

CREATE INDEX IF NOT EXISTS idx_dvs_user_active
  ON device_verification_settings(setting_type, user_id, enabled, expires_at);
