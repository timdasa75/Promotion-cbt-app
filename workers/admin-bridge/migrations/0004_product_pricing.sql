-- Product pricing table for dynamic price management
CREATE TABLE IF NOT EXISTS product_pricing (
  id TEXT PRIMARY KEY DEFAULT 'default',
  monthly_price INTEGER NOT NULL DEFAULT 2500,
  quarterly_price INTEGER NOT NULL DEFAULT 5500,
  bi_annual_price INTEGER NOT NULL DEFAULT 7500,
  annual_price INTEGER NOT NULL DEFAULT 12000,
  currency TEXT NOT NULL DEFAULT 'NGN',
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_by TEXT DEFAULT ''
);

-- Insert default pricing if not exists
INSERT OR IGNORE INTO product_pricing (id, monthly_price, quarterly_price, bi_annual_price, annual_price)
VALUES ('default', 2500, 5500, 7500, 12000);
