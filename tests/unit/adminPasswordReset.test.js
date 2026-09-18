// Unit tests for the admin-driven password reset route (adminSendPasswordReset):
// - route registered + admin-gated (401 without credentials)
// - happy path: issues a password_reset token, sends email, writes audit rows
// - unknown email → 404, no email sent
// - missing baseUrl → 400
// - email delivery failure → ok:false with warning, audit status "failed"
import test from "node:test";
import assert from "node:assert/strict";

import worker from "../../workers/admin-bridge/worker.js";
import { sha256Base64Url } from "../../workers/admin-bridge/auth-hybrid.js";

const SESSION_ID = "sess-reset-123";
const SESSION_SECRET = "reset-session-secret";
const ADMIN_EMAIL = "admin@example.com";
const USER_ID = "user-42";
const USER_EMAIL = "learner@example.com";

function jsonHeaders() {
  return { "Content-Type": "application/json", Origin: "https://app.example.test" };
}

function adminAuthHeaders() {
  return { ...jsonHeaders(), Authorization: `Bearer ${SESSION_ID}.${SESSION_SECRET}` };
}

// Minimal D1 mock: admin session + target user + audit/token writes.
function makeDatabase({ captures = [], userRow = null, fetchImpl = null } = {}) {
  const sessionSecretHashPromise = sha256Base64Url(SESSION_SECRET);
  return {
    prepare(sql) {
      const bound = [];
      const statement = {
        bind(...values) {
          bound.push(...values);
          return statement;
        },
        async first() {
          captures.push({ sql, values: [...bound] });
          if (sql.includes("FROM auth_sessions s") && sql.includes("INNER JOIN auth_users u")) {
            return {
              session_id: SESSION_ID,
              user_id: "admin-1",
              session_secret_hash: await sessionSecretHashPromise,
              expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
              id: "admin-1",
              email: ADMIN_EMAIL,
              role: "admin",
              status: "active",
            };
          }
          if (sql.includes("FROM auth_users") && sql.includes("WHERE email = ?1")) {
            return userRow;
          }
          return null;
        },
        async all() {
          captures.push({ sql, values: [...bound] });
          return { results: [] };
        },
        async run() {
          captures.push({ sql, values: [...bound] });
          return { success: true, meta: { changes: 1 } };
        },
      };
      return statement;
    },
  };
}

function buildRequest(body, headers = adminAuthHeaders()) {
  return new Request("https://worker.example.com/adminSendPasswordReset", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

test("adminSendPasswordReset rejects unauthenticated callers", async () => {
  const database = makeDatabase();
  const response = await worker.fetch(buildRequest({ email: USER_EMAIL, baseUrl: "https://app.example.test" }, jsonHeaders()), {
    AUTH_DB: database,
    ADMIN_EMAILS: ADMIN_EMAIL,
    ALLOWED_ORIGINS: "https://app.example.test",
  });
  assert.equal(response.status, 401);
});

test("adminSendPasswordReset sends reset email and writes audit rows", async () => {
  const captures = [];
  const sends = [];
  const database = makeDatabase({
    captures,
    userRow: { id: USER_ID, email: USER_EMAIL, name: "Learner", status: "active" },
  });
  const env = {
    AUTH_DB: database,
    ADMIN_EMAILS: ADMIN_EMAIL,
    ALLOWED_ORIGINS: "https://app.example.test",
    RESEND_API_KEY: "re_test_key",
    EMAIL_FROM: "Promotion CBT <test@example.test>",
    __testFetchImpl: async (url, init) => {
      sends.push({ url, body: JSON.parse(init?.body || "{}") });
      return new Response(JSON.stringify({ id: "email-1" }), { status: 200 });
    },
  };

  // sendEmail uses global fetch; stub it for the duration of the call.
  const originalFetch = globalThis.fetch;
  globalThis.fetch = env.__testFetchImpl;
  try {
    const response = await worker.fetch(buildRequest({ email: USER_EMAIL, baseUrl: "https://app.example.test" }), env);
    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.equal(payload.ok, true);
    assert.equal(payload.emailDelivered, true);
    assert.match(payload.resetUrl, /^https:\/\/app\.example\.test\/reset-password\?token=/, "resetUrl accompanies the success payload for manual-send fallback");
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(sends.length, 1, "one Resend call expected");
  assert.match(sends[0].url, /api\.resend\.com\/emails/);
  assert.deepEqual(sends[0].body.to, [USER_EMAIL]);
  assert.match(sends[0].body.html, /reset-password\?token=/);

  const tokenInsert = captures.find((c) => c.sql.includes("INSERT INTO auth_email_tokens"));
  assert.ok(tokenInsert, "password_reset token should be issued");
  assert.equal(tokenInsert.values[2], "password_reset");

  const auditInsert = captures.find((c) => c.sql.includes("INSERT INTO auth_audit_log"));
  assert.ok(auditInsert, "audit log row expected");
  assert.equal(auditInsert.values[4], "Password reset email sent");
  assert.equal(auditInsert.values[5], "success");
});

test("adminSendPasswordReset returns resetUrl for manual sending when delivery fails", async () => {
  const captures = [];
  const database = makeDatabase({
    captures,
    userRow: { id: USER_ID, email: USER_EMAIL, name: "Learner", status: "active" },
  });
  const env = {
    AUTH_DB: database,
    ADMIN_EMAILS: ADMIN_EMAIL,
    ALLOWED_ORIGINS: "https://app.example.test",
    RESEND_API_KEY: "re_test_key",
    EMAIL_FROM: "Promotion CBT <test@example.test>",
    __testFetchImpl: async () => new Response(JSON.stringify({ message: "You can only send testing emails to your own email address" }), { status: 403 }),
  };
  const originalFetch = globalThis.fetch;
  globalThis.fetch = env.__testFetchImpl;
  try {
    const response = await worker.fetch(buildRequest({ email: USER_EMAIL, baseUrl: "https://app.example.test" }), env);
    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.equal(payload.ok, false);
    assert.equal(payload.tokenIssued, true);
    assert.match(payload.resetUrl, /reset-password\?token=/);
    const auditInsert = captures.find((c) => c.sql.includes("INSERT INTO auth_audit_log"));
    assert.equal(auditInsert.values[5], "failed");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("adminSendPasswordReset works with no RESEND_API_KEY (manual-send path)", async () => {
  const database = makeDatabase({ userRow: { id: USER_ID, email: USER_EMAIL, name: "Learner", status: "active" } });
  const response = await worker.fetch(buildRequest({ email: USER_EMAIL, baseUrl: "https://app.example.test" }), {
    AUTH_DB: database,
    ADMIN_EMAILS: ADMIN_EMAIL,
    ALLOWED_ORIGINS: "https://app.example.test",
  });
  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.equal(payload.ok, false);
  assert.equal(payload.emailConfigured, false);
  assert.match(payload.resetUrl, /reset-password\?token=/);
});

test("adminSendPasswordReset returns 404 for unknown email", async () => {
  const database = makeDatabase({ userRow: null });
  const response = await worker.fetch(buildRequest({ email: "ghost@example.com", baseUrl: "https://app.example.test" }), {
    AUTH_DB: database,
    ADMIN_EMAILS: ADMIN_EMAIL,
    ALLOWED_ORIGINS: "https://app.example.test",
    RESEND_API_KEY: "re_test_key",
  });
  assert.equal(response.status, 404);
});

test("adminSendPasswordReset falls back to the Origin header when baseUrl is omitted", async () => {
  const captures = [];
  const sends = [];
  const database = makeDatabase({
    captures,
    userRow: { id: USER_ID, email: USER_EMAIL, name: "Learner", status: "active" },
  });
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    sends.push({ url, body: JSON.parse(init?.body || "{}") });
    return new Response(JSON.stringify({ id: "email-2" }), { status: 200 });
  };
  try {
    // No baseUrl in the body: the handler falls back to the request Origin
    // (same behavior as the public forgot-password endpoint).
    const response = await worker.fetch(
      new Request("https://worker.example.com/adminSendPasswordReset", {
        method: "POST",
        headers: adminAuthHeaders(),
        body: JSON.stringify({ email: USER_EMAIL }),
      }),
      {
        AUTH_DB: database,
        ADMIN_EMAILS: ADMIN_EMAIL,
        ALLOWED_ORIGINS: "https://app.example.test",
        RESEND_API_KEY: "re_test_key",
      },
    );
    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.equal(payload.ok, true);
  } finally {
    globalThis.fetch = originalFetch;
  }
  assert.equal(sends.length, 1);
  assert.match(sends[0].body.html, /reset-password\?token=/);
});

test("adminSendPasswordReset reports delivery failure with failed audit status", async () => {
  const captures = [];
  const database = makeDatabase({
    captures,
    userRow: { id: USER_ID, email: USER_EMAIL, name: "Learner", status: "active" },
  });
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ message: "quota exceeded" }), { status: 429 });
  try {
    const response = await worker.fetch(buildRequest({ email: USER_EMAIL, baseUrl: "https://app.example.test" }), {
      AUTH_DB: database,
      ADMIN_EMAILS: ADMIN_EMAIL,
    ALLOWED_ORIGINS: "https://app.example.test",
      RESEND_API_KEY: "re_test_key",
    });
    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.equal(payload.ok, false);
    assert.ok(payload.warning);
    assert.equal(payload.tokenIssued, true);
  } finally {
    globalThis.fetch = originalFetch;
  }

  const auditInsert = captures.find((c) => c.sql.includes("INSERT INTO auth_audit_log"));
  assert.ok(auditInsert, "audit log row expected");
  assert.equal(auditInsert.values[5], "failed");
});
