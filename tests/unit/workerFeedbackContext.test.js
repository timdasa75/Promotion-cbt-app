import test from "node:test";
import assert from "node:assert/strict";

import worker, { resolveRouteHandler } from "../../workers/admin-bridge/worker.js";
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
              if (sql.includes("FROM feedback_submissions") && sql.includes("SELECT email")) {
                return { email: "reporter@example.com", status: "resolved", resolution: "" };
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
  return { "Content-Type": "application/json", Origin: "https://app.example.test" };
}

test("feedback submit stores richer question context and client info", async () => {
  const captures = [];
  const env = { AUTH_DB: createAuthDatabase({ captures }), ALLOWED_ORIGINS: "https://app.example.test" };
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
  const env = { AUTH_DB: createAuthDatabase({ captures }), ALLOWED_ORIGINS: "https://app.example.test" };
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

test("feedback reply and notify routes are registered", () => {
  // These routes back the admin feedback inbox (reply + user notification).
  // If a refactor drops one, the frontend keeps calling it and admins see
  // silent failures, so each registration is asserted explicitly.
  assert.equal(typeof resolveRouteHandler("/feedback/status"), "function");
  assert.equal(typeof resolveRouteHandler("/feedback/notify"), "function");
  assert.equal(typeof resolveRouteHandler("/feedback/reply"), "function");
});

test("feedback reply rejects unauthenticated callers", async () => {
  const env = { AUTH_DB: createAuthDatabase({ captures: [] }), ALLOWED_ORIGINS: "https://app.example.test" };

  const request = new Request("https://worker.example.com/feedback/reply", {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({ feedbackId: "fbk_123", reply: "Thanks for the report." }),
  });

  const response = await worker.fetch(request, env);
  assert.equal(response.status, 401);
});

test("resolving feedback does not email the user by default (free-tier suspension)", async () => {
  const captures = [];
  const env = {
    AUTH_DB: createAuthDatabase({
      captures,
      sessionOverrides: { id: "admin-1", email: "admin@example.com", role: "admin", status: "active" },
    }),
    ALLOWED_ORIGINS: "https://app.example.test",
    ADMIN_EMAILS: "admin@example.com",
    // Key is deliberately set: proves the suspension flag, not the missing key,
    // is what suppresses the email.
    RESEND_API_KEY: "re_test_key",
  };
  const token = await buildToken();

  const request = new Request("https://worker.example.com/feedback/status", {
    method: "POST",
    headers: { ...jsonHeaders(), Authorization: `Bearer ${token}` },
    body: JSON.stringify({ feedbackId: "fbk_001", status: "resolved", resolution: "Fixed in the latest build.", reviewer: "admin@example.com" }),
  });

  const sent = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    if (String(url).includes("api.resend.com")) {
      sent.push({ url: String(url), body: JSON.parse(init?.body || "{}") });
      return { ok: true, status: 200, json: async () => ({}) };
    }
    return originalFetch(url, init);
  };
  try {
    const response = await worker.fetch(request, env);
    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.equal(payload.ok, true);
    assert.equal(payload.status, "resolved");
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(sent.length, 0, "resolve emails are suspended by default to conserve D1 free-tier reads");
  // The personalization name lookup is suspended along with the email — one fewer
  // auth_users row read per resolution.
  assert.ok(
    !captures.some((entry) => entry.sql.includes("SELECT id, name FROM auth_users")),
    "name lookup should not run while resolve emails are suspended",
  );
  const update = captures.find((entry) => entry.sql.includes("UPDATE feedback_submissions"));
  assert.ok(update, "status update should still run");
  assert.equal(update.values[4], "Fixed in the latest build.");
});

test("resolving feedback emails the user when FEEDBACK_EMAILS_ENABLED=true", async () => {
  const captures = [];
  const env = {
    AUTH_DB: createAuthDatabase({
      captures,
      sessionOverrides: { id: "admin-1", email: "admin@example.com", role: "admin", status: "active" },
    }),
    ALLOWED_ORIGINS: "https://app.example.test",
    ADMIN_EMAILS: "admin@example.com",
    RESEND_API_KEY: "re_test_key",
    FEEDBACK_EMAILS_ENABLED: "true",
  };
  const token = await buildToken();

  const request = new Request("https://worker.example.com/feedback/status", {
    method: "POST",
    headers: { ...jsonHeaders(), Authorization: `Bearer ${token}` },
    body: JSON.stringify({ feedbackId: "fbk_001", status: "resolved", resolution: "Fixed in the latest build." }),
  });

  const sent = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    if (String(url).includes("api.resend.com")) {
      sent.push({ url: String(url), body: JSON.parse(init?.body || "{}") });
      return { ok: true, status: 200, json: async () => ({}) };
    }
    return originalFetch(url, init);
  };
  try {
    const response = await worker.fetch(request, env);
    assert.equal(response.status, 200);
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(sent.length, 1, "opt-in flag restores the resolve email");
  assert.equal(sent[0].body.to[0], "reporter@example.com");
  assert.match(sent[0].body.subject, /resolved/i);
});

test("feedback reply does not email the user by default (free-tier suspension)", async () => {
  const captures = [];
  const env = {
    AUTH_DB: createAuthDatabase({
      captures,
      sessionOverrides: { id: "admin-1", email: "admin@example.com", role: "admin", status: "active" },
    }),
    ALLOWED_ORIGINS: "https://app.example.test",
    ADMIN_EMAILS: "admin@example.com",
    // Key is deliberately set: proves the suspension flag, not the missing key,
    // is what suppresses the email.
    RESEND_API_KEY: "re_test_key",
  };
  const token = await buildToken();

  const request = new Request("https://worker.example.com/feedback/reply", {
    method: "POST",
    headers: { ...jsonHeaders(), Authorization: `Bearer ${token}` },
    body: JSON.stringify({ feedbackId: "fbk_001", reply: "Thanks — this is fixed in the latest build." }),
  });

  const sent = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    if (String(url).includes("api.resend.com")) {
      sent.push({ url: String(url), body: JSON.parse(init?.body || "{}") });
      return { ok: true, status: 200, json: async () => ({}) };
    }
    return originalFetch(url, init);
  };
  try {
    const response = await worker.fetch(request, env);
    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.equal(payload.ok, true);
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(sent.length, 0, "reply emails are suspended by default to conserve D1 free-tier reads");
  // The reply is still stored — the user sees it on the profile page instead of
  // their inbox (see the unread badge in the "My Feedback" card).
  const update = captures.find((entry) => entry.sql.includes("UPDATE feedback_submissions"));
  assert.ok(update, "reply should still be stored");
  assert.match(update.sql, /admin_reply/);
  assert.equal(update.values[1], "Thanks — this is fixed in the latest build.");
  // The personalization name lookup is suspended along with the email.
  assert.ok(
    !captures.some((entry) => entry.sql.includes("SELECT id, name FROM auth_users")),
    "name lookup should not run while reply emails are suspended",
  );
});

test("feedback reply emails the user when FEEDBACK_EMAILS_ENABLED=true", async () => {
  const captures = [];
  const env = {
    AUTH_DB: createAuthDatabase({
      captures,
      sessionOverrides: { id: "admin-1", email: "admin@example.com", role: "admin", status: "active" },
    }),
    ALLOWED_ORIGINS: "https://app.example.test",
    ADMIN_EMAILS: "admin@example.com",
    RESEND_API_KEY: "re_test_key",
    FEEDBACK_EMAILS_ENABLED: "true",
  };
  const token = await buildToken();

  const request = new Request("https://worker.example.com/feedback/reply", {
    method: "POST",
    headers: { ...jsonHeaders(), Authorization: `Bearer ${token}` },
    body: JSON.stringify({ feedbackId: "fbk_001", reply: "Thanks — this is fixed in the latest build." }),
  });

  const sent = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    if (String(url).includes("api.resend.com")) {
      sent.push({ url: String(url), body: JSON.parse(init?.body || "{}") });
      return { ok: true, status: 200, json: async () => ({}) };
    }
    return originalFetch(url, init);
  };
  try {
    const response = await worker.fetch(request, env);
    assert.equal(response.status, 200);
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(sent.length, 1, "opt-in flag restores the reply email");
  assert.equal(sent[0].body.to[0], "reporter@example.com");
  assert.match(sent[0].body.subject, /replied/i);
});

test("feedback notify rejects unauthenticated callers", async () => {
  const env = { AUTH_DB: createAuthDatabase({ captures: [] }), ALLOWED_ORIGINS: "https://app.example.test" };

  const request = new Request("https://worker.example.com/feedback/notify", {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({ email: "user@example.com", subject: "Update", body: "<p>Hi</p>" }),
  });

  const response = await worker.fetch(request, env);
  assert.equal(response.status, 401);
});
