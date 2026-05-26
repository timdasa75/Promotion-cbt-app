CREATE TABLE IF NOT EXISTS feedback_submissions (
  feedback_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('bug', 'suggestion', 'question_issue', 'other')),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_review', 'resolved', 'dismissed')),
  source_screen TEXT NOT NULL DEFAULT 'help' CHECK (source_screen IN ('help', 'quiz', 'results')),
  message TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  reviewed_at TEXT NOT NULL DEFAULT '',
  reviewed_by TEXT NOT NULL DEFAULT '',
  topic_id TEXT NOT NULL DEFAULT '',
  topic_name TEXT NOT NULL DEFAULT '',
  question_id TEXT NOT NULL DEFAULT '',
  quiz_attempt_id TEXT NOT NULL DEFAULT '',
  session_mode TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback_submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback_submissions(status);
CREATE INDEX IF NOT EXISTS idx_feedback_email ON feedback_submissions(email);
