-- Migration 0008: Browser-agnostic device-signals hash for cross-browser device matching
-- Each trusted row gains the hash of the physical device (screen/GPU/cores/touch/OS/
-- model/timezone). A different browser on the same device produces the same hash, so
-- the Worker can recognize it as the same device without an OTP challenge, while a
-- genuinely different device still triggers the gate.
ALTER TABLE trusted_devices ADD COLUMN device_signals_hash TEXT NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_trusted_devices_signals ON trusted_devices(user_id, device_signals_hash);