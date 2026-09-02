-- Migrate Firestore data to D1 as primary source.
-- These tables mirror the Firestore 'profiles' and 'payments' collections.
-- During transition, Worker dual-writes to both Firestore and D1.
-- Once migration is complete, Firestore reads are removed.

-- User profiles (mirrors Firestore 'profiles/{userId}')
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id TEXT PRIMARY KEY,
  email TEXT NOT NULL DEFAULT '',
  plan TEXT NOT NULL DEFAULT 'free',
  plan_source TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active',
  plan_expires_at TEXT NOT NULL DEFAULT '',
  billing_cycle TEXT NOT NULL DEFAULT '',
  last_payment_at TEXT NOT NULL DEFAULT '',
  flw_transaction_id TEXT NOT NULL DEFAULT '',
  flw_customer_email TEXT NOT NULL DEFAULT '',
  flw_payment_plan TEXT NOT NULL DEFAULT '',
  selar_order_ref TEXT NOT NULL DEFAULT '',
  selar_product_name TEXT NOT NULL DEFAULT '',
  last_seen_at TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT '',
  synced_from_firestore INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_plan ON user_profiles(plan);
CREATE INDEX IF NOT EXISTS idx_user_profiles_status ON user_profiles(status);

-- Payment receipts (mirrors Firestore 'payments/{paymentId}')
CREATE TABLE IF NOT EXISTS payment_receipts (
  payment_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  amount REAL NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'NGN',
  billing_cycle TEXT NOT NULL DEFAULT '',
  plan TEXT NOT NULL DEFAULT 'premium',
  status TEXT NOT NULL DEFAULT 'successful',
  flw_transaction_id TEXT NOT NULL DEFAULT '',
  flw_customer_email TEXT NOT NULL DEFAULT '',
  flw_tx_ref TEXT NOT NULL DEFAULT '',
  selar_order_ref TEXT NOT NULL DEFAULT '',
  selar_product_name TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT '',
  expires_at TEXT NOT NULL DEFAULT '',
  raw_json TEXT NOT NULL DEFAULT '{}',
  synced_from_firestore INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_payment_receipts_user ON payment_receipts(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_receipts_email ON payment_receipts(email);
CREATE INDEX IF NOT EXISTS idx_payment_receipts_status ON payment_receipts(status);
CREATE INDEX IF NOT EXISTS idx_payment_receipts_created ON payment_receipts(created_at);

-- Migration tracking
CREATE TABLE IF NOT EXISTS firestore_sync_log (
  id TEXT PRIMARY KEY,
  collection TEXT NOT NULL,
  document_id TEXT NOT NULL,
  action TEXT NOT NULL DEFAULT 'synced',
  synced_at TEXT NOT NULL,
  error TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_sync_log_collection ON firestore_sync_log(collection, synced_at);
