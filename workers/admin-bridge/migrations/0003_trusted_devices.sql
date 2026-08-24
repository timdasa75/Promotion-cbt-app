-- Migration 0003: Add trusted devices and login audit log tables
-- This migration adds device trust management for subscription sharing prevention

-- Trusted devices table
CREATE TABLE IF NOT EXISTS trusted_devices (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  device_fingerprint TEXT NOT NULL,
  device_name TEXT NOT NULL DEFAULT '',
  device_info TEXT NOT NULL DEFAULT '{}',
  ip_address TEXT NOT NULL DEFAULT '',
  user_agent TEXT NOT NULL DEFAULT '',
  trusted_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  last_used_at TEXT NOT NULL,
  is_permanent INTEGER DEFAULT 0,
  revoked_at TEXT DEFAULT '',
  FOREIGN KEY (user_id) REFERENCES auth_users(id) ON DELETE CASCADE
);

-- Indexes for trusted_devices
CREATE INDEX IF NOT EXISTS idx_trusted_devices_user ON trusted_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_trusted_devices_fingerprint ON trusted_devices(device_fingerprint);
CREATE INDEX IF NOT EXISTS idx_trusted_devices_expires ON trusted_devices(expires_at);
CREATE INDEX IF NOT EXISTS idx_trusted_devices_active ON trusted_devices(user_id, revoked_at, expires_at);

-- Login audit log table
CREATE TABLE IF NOT EXISTS login_audit_log (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  email TEXT NOT NULL,
  event_type TEXT NOT NULL,
  device_fingerprint TEXT DEFAULT '',
  device_name TEXT DEFAULT '',
  ip_address TEXT DEFAULT '',
  user_agent TEXT DEFAULT '',
  details TEXT DEFAULT '{}',
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES auth_users(id) ON DELETE CASCADE
);

-- Indexes for login_audit_log
CREATE INDEX IF NOT EXISTS idx_login_audit_user ON login_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_login_audit_email ON login_audit_log(email);
CREATE INDEX IF NOT EXISTS idx_login_audit_event ON login_audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_login_audit_created ON login_audit_log(created_at);

-- OTP codes table (for email verification)
CREATE TABLE IF NOT EXISTS otp_codes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  email TEXT NOT NULL,
  otp_hash TEXT NOT NULL,
  otp_type TEXT NOT NULL DEFAULT 'login',
  device_fingerprint TEXT DEFAULT '',
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 5,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  consumed_at TEXT DEFAULT '',
  FOREIGN KEY (user_id) REFERENCES auth_users(id) ON DELETE CASCADE
);

-- Indexes for otp_codes
CREATE INDEX IF NOT EXISTS idx_otp_user ON otp_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_otp_email ON otp_codes(email);
CREATE INDEX IF NOT EXISTS idx_otp_expires ON otp_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_otp_active ON otp_codes(user_id, consumed_at, expires_at);
