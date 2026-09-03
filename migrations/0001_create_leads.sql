-- Lead capture for the Get started form.
-- Apply with:  npx wrangler d1 execute intentshark --remote --file=./migrations/0001_create_leads.sql

CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  site TEXT,
  name TEXT,
  company TEXT,
  intent TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads (created_at);
