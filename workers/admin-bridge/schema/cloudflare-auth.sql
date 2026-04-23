-- Cloudflare hybrid auth schema (phase 1 foundation)
--
-- Why this exists:
-- The current production app still authenticates against Firebase Auth.
-- This schema gives us the D1 target for a gradual hybrid migration where Cloudflare becomes the primary
-- auth/session store while Firebase remains a temporary fallback for legacy users.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS auth_users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'premium')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
  email_verified INTEGER NOT NULL DEFAULT 0 CHECK (email_verified IN (0, 1)),
  legacy_provider TEXT NOT NULL DEFAULT '',
  legacy_user_id TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  last_login_at TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_auth_users_status ON auth_users(status);
CREATE INDEX IF NOT EXISTS idx_auth_users_plan ON auth_users(plan);
CREATE INDEX IF NOT EXISTS idx_auth_users_legacy_provider ON auth_users(legacy_provider, legacy_user_id);

CREATE TABLE IF NOT EXISTS auth_sessions (
  session_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  session_secret_hash TEXT NOT NULL,
  refresh_secret_hash TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  user_agent TEXT NOT NULL DEFAULT '',
  ip_address TEXT NOT NULL DEFAULT '',
  FOREIGN KEY (user_id) REFERENCES auth_users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_id ON auth_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires_at ON auth_sessions(expires_at);

CREATE TABLE IF NOT EXISTS auth_email_tokens (
  token_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token_type TEXT NOT NULL CHECK (token_type IN ('verify_email', 'password_reset')),
  token_secret_hash TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  consumed_at TEXT NOT NULL DEFAULT '',
  FOREIGN KEY (user_id) REFERENCES auth_users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_auth_email_tokens_user_id ON auth_email_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_email_tokens_type ON auth_email_tokens(token_type, expires_at);

CREATE TABLE IF NOT EXISTS auth_rate_limits (
  bucket_key TEXT PRIMARY KEY,
  bucket_type TEXT NOT NULL,
  window_started_at TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_auth_rate_limits_type ON auth_rate_limits(bucket_type, window_started_at);

CREATE TABLE IF NOT EXISTS auth_audit_log (
  id TEXT PRIMARY KEY,
  actor_user_id TEXT NOT NULL DEFAULT '',
  actor_email TEXT NOT NULL DEFAULT '',
  target_user_id TEXT NOT NULL DEFAULT '',
  action TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'success',
  details_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_auth_audit_log_created_at ON auth_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_auth_audit_log_target_user_id ON auth_audit_log(target_user_id, created_at);
