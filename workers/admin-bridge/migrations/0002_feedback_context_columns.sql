-- 0002_feedback_context_columns.sql
-- Adds richer context columns to feedback_submissions so admins can resolve
-- issues without needing the reporter to paste extra detail.
-- Apply with: npx wrangler d1 execute AUTH_DB --remote --file=migrations/0002_feedback_context_columns.sql

ALTER TABLE feedback_submissions ADD COLUMN question_preview TEXT NOT NULL DEFAULT '';
ALTER TABLE feedback_submissions ADD COLUMN score_summary TEXT NOT NULL DEFAULT '';
ALTER TABLE feedback_submissions ADD COLUMN difficulty TEXT NOT NULL DEFAULT '';
ALTER TABLE feedback_submissions ADD COLUMN source_document TEXT NOT NULL DEFAULT '';
ALTER TABLE feedback_submissions ADD COLUMN source_section TEXT NOT NULL DEFAULT '';
ALTER TABLE feedback_submissions ADD COLUMN subcategory_name TEXT NOT NULL DEFAULT '';
ALTER TABLE feedback_submissions ADD COLUMN client_info TEXT NOT NULL DEFAULT '';
