import test from "node:test";
import assert from "node:assert/strict";

import worker from "../../workers/admin-bridge/worker.js";
import { sha256Base64Url } from "../../workers/admin-bridge/auth-hybrid.js";

const SESSION_ID = "sess-123";
const SESSION_SECRET = "session-secret-value";
const USER_ID = "user-42";

async function buildToken() {
  return `${SESSION_ID}.${SESSION_SECRET}`;
}

function createAuthDatabase({ captures, sessionOverrides = {} } = {}) {
  const writes = Array.isArray(captures) ? captures : [];
  return {
    prepare(sql) {
      const statement = {
        bind(...values) {
          return {
            async first() {
              if (sql.includes("FROM auth_sessions")) {
                return {
                  session_id: SESSION_ID,
                  user_id: USER_ID,
                  session_secret_hash: await sha256Base64Url(SESSION_SECRET),
                  refresh_secret_hash: "refresh-hash",
                  created_at: new Date().toISOString(),
                  expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
                  last_seen_at: new Date().toISOString(),
                  ...sessionOverrides,
                };
              }
              if (sql.includes("FROM auth_users")) {
                return {
                  id: USER_ID,
                  email: "reporter@example.com",
                  password_hash: "pbkdf2_sha256$mock",
                  role: "user",
                  plan: "free",
                  status: "active",
                  email_verified: 1,
                  legacy_provider: "",
                  legacy_user_id: "",
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                  last_login_at: "",
                };
              }
              throw new Error(`Unexpected first query: ${sql}`);
            },
            async run() {
              writes.push({ sql, values });
              return { success: true, meta: { changes: 1 } };
            },
            async all() {
              return { results: [] };
            },
          };
        },
      };
      return statement;
    },
  };
}

function jsonHeaders() {
  return { "Content-Type": "application/json" };
}

test("feedback submit stores richer question context and client info", async () => {
  const captures = [];
  const env = { AUTH_DB: createAuthDatabase({ captures }) };
  const token = await buildToken();

  const request = new Request("https://worker.example.com/feedback/submit", {
    method: "POST",
    headers: { ...jsonHeaders(), Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      sourceScreen: "quiz",
      category: "question_issue",
      message: "The answer key looks wrong.",
      topicId: "psr",
      topicName: "Public Service Rules",
      questionId: "psr-001",
      quizAttemptId: "run-abc123",
      sessionMode: "practice",
      questionPreview: "What is the primary objective of the handbook?",
      scoreSummary: "",
      difficulty: "hard",
      sourceDocument: "Civil Service Handbook",
      sourceSection: "Chapter 4",
      subcategoryName: "Ethics",
      clientInfo: { provider: "cloudflare", plan: "free", viewport: "1280x720", userAgent: "Mozilla/5.0" },
    }),
  });

  const response = await worker.fetch(request, env);
  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.equal(payload.ok, true);
  assert.ok(payload.feedbackId);

  const insert = captures.find((entry) => entry.sql.includes("INSERT INTO feedback_submissions"));
  assert.ok(insert, "feedback submit should run an INSERT");
  assert.match(insert.sql, /question_preview/);
  assert.match(insert.sql, /score_summary/);
  assert.match(insert.sql, /difficulty/);
  assert.match(insert.sql, /source_document/);
  assert.match(insert.sql, /source_section/);
  assert.match(insert.sql, /subcategory_name/);
  assert.match(insert.sql, /client_info/);

  // Values: ...14 base fields, then ?15 questionPreview ... ?21 clientInfo
  assert.equal(insert.values[14], "What is the primary objective of the handbook?");
  assert.equal(insert.values[16], "hard");
  assert.equal(insert.values[17], "Civil Service Handbook");
  assert.equal(insert.values[18], "Chapter 4");
  assert.equal(insert.values[19], "Ethics");
  const clientInfo = JSON.parse(insert.values[20]);
  assert.equal(clientInfo.provider, "cloudflare");
  assert.equal(clientInfo.plan, "free");
  assert.equal(clientInfo.viewport, "1280x720");
  assert.equal(clientInfo.userAgent, "Mozilla/5.0");
});

test("feedback submit rejects when email does not match the signed-in account", async () => {
  const captures = [];
  const env = { AUTH_DB: createAuthDatabase({ captures }) };
  const token = await buildToken();

  const request = new Request("https://worker.example.com/feedback/submit", {
    method: "POST",
    headers: { ...jsonHeaders(), Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      sourceScreen: "help",
      category: "suggestion",
      message: "Hi",
      email: "someone-else@example.com",
    }),
  });

  const response = await worker.fetch(request, env);
  assert.equal(response.status, 403);
});
