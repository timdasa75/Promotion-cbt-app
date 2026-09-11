-- 0010_feedback_reply_resolution_columns.sql
-- Adds the admin-reply and resolution columns that the feedback handlers and
-- the user-facing feedback list already reference. Without these columns the
-- /feedback/reply UPDATE, the resolved-status UPDATE, and /feedback/userList
-- all fail against a real D1 database.
-- Apply with: npx wrangler d1 migrations apply AUTH_DB --remote

ALTER TABLE feedback_submissions ADD COLUMN admin_reply TEXT NOT NULL DEFAULT '';
ALTER TABLE feedback_submissions ADD COLUMN replied_at TEXT NOT NULL DEFAULT '';
ALTER TABLE feedback_submissions ADD COLUMN replied_by TEXT NOT NULL DEFAULT '';
ALTER TABLE feedback_submissions ADD COLUMN resolved_at TEXT NOT NULL DEFAULT '';
ALTER TABLE feedback_submissions ADD COLUMN resolved_by TEXT NOT NULL DEFAULT '';
ALTER TABLE feedback_submissions ADD COLUMN resolution TEXT NOT NULL DEFAULT '';
