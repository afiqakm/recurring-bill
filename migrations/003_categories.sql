CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_categories_name ON categories (name);

INSERT INTO categories (id, name, created_at, updated_at)
SELECT
  category,
  category,
  MIN(created_at),
  MAX(updated_at)
FROM items
WHERE TRIM(category) <> ''
GROUP BY category
ON CONFLICT(name) DO NOTHING;
