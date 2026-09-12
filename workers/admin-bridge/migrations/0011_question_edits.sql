-- Question bank overlay (V1 of docs/question-bank-management.md).
-- One row per *changed* question; the Worker merges these payloads onto the
-- immutable static bank at serve time, so admin fixes go live without a
-- redeploy while git + static assets stay the canonical source.
CREATE TABLE IF NOT EXISTS question_edits (
  topic_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  payload TEXT NOT NULL,
  origin TEXT NOT NULL DEFAULT 'manual',
  feedback_id TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  edited_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (topic_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_question_edits_feedback ON question_edits(feedback_id);

-- Version counter per topic: bumped on every save/revert so the entitlement
-- edge cache key changes and users immediately see corrected content.
CREATE TABLE IF NOT EXISTS content_meta (
  topic_id TEXT PRIMARY KEY,
  version INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL
);
