-- Add an index that serves the consolidated admin activity-metrics query.
-- The metrics endpoint filters auth_sessions by last_seen_at windows; without
-- this index each refresh scans every session row (an unattended admin tab
-- used to exhaust D1's free-tier daily row-read quota and take login down).
CREATE INDEX IF NOT EXISTS idx_auth_sessions_last_seen ON auth_sessions(last_seen_at);
