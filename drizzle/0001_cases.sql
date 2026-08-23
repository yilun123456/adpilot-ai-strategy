CREATE TABLE IF NOT EXISTS cases (
  id TEXT PRIMARY KEY,
  brand TEXT NOT NULL,
  title TEXT NOT NULL,
  industry TEXT NOT NULL DEFAULT '',
  objective TEXT NOT NULL DEFAULT '',
  audience TEXT NOT NULL DEFAULT '',
  budget REAL NOT NULL DEFAULT 0 CHECK (budget >= 0),
  channels TEXT NOT NULL DEFAULT '',
  period TEXT NOT NULL DEFAULT '',
  result_metric TEXT NOT NULL DEFAULT '',
  result_value TEXT NOT NULL DEFAULT '',
  summary TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cases_industry_created_at
ON cases(industry, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_cases_brand
ON cases(brand);

PRAGMA optimize;

