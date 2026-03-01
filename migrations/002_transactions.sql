CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  item_id TEXT NOT NULL,
  unique_key TEXT NOT NULL UNIQUE,
  month TEXT NOT NULL,
  amount REAL NOT NULL,
  due_day INTEGER,
  paid TEXT,
  source TEXT NOT NULL DEFAULT 'csv',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_transactions_item_id ON transactions (item_id);
CREATE INDEX IF NOT EXISTS idx_transactions_month ON transactions (month);
CREATE INDEX IF NOT EXISTS idx_transactions_updated_at ON transactions (updated_at);
