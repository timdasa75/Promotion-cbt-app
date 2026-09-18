// Unit tests for the adminListResetRequests route — the dedicated, action-filtered
// audit query that feeds the admin dashboard's Password Reset Requests card.
//
// Regression context: the card originally read the mixed adminListOperations
// LIMIT window; unrelated audit rows (logins, plan changes, …) pushed older
// reset rows out, so the displayed count shrank between loads. This route
// filters to reset-flow actions server-side.
import test from "node:test";
import assert from "node:assert/strict";

import worker from "../../workers/admin-bridge/worker.js";
import { sha256Base64Url } from "../../workers/admin-bridge/auth-hybrid.js";

const SESSION_ID = "sess-listreset-123";
const SESSION_SECRET = "listreset-session-secret";
const ADMIN_EMAIL = "admin@example.com";

function adminAuthHeaders() {
  return {
    "Content-Type": "application/json",
    Origin: "https://app.example.test",
    Authorization: `Bearer ${SESSION_ID}.${SESSION_SECRET}`,
  };
}

function makeDatabase({ rows = [], captures = [] } = {}) {
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
          return null;
        },
        async all() {
          captures.push({ sql, values: [...bound] });
          return { results: rows };
        },
        async run() {
          captures.push({ sql, values: [...bound] });
          return { success: true };
        },
      };
      return statement;
    },
  };
}

function buildRequest(body = { limit: 200 }) {
  return new Request("https://worker.example.com/adminListResetRequests", {
    method: "POST",
    headers: adminAuthHeaders(),
    body: JSON.stringify(body),
  });
}

test("adminListResetRequests rejects unauthenticated callers", async () => {
  const database = makeDatabase();
  const headers = adminAuthHeaders();
  delete headers.Authorization;
  const response = await worker.fetch(
    new Request("https://worker.example.com/adminListResetRequests", {
      method: "POST",
      headers,
      body: JSON.stringify({ limit: 200 }),
    }),
    { AUTH_DB: database, ADMIN_EMAILS: ADMIN_EMAIL, ALLOWED_ORIGINS: "https://app.example.test" }
  );
  assert.equal(response.status, 401);
});

test("filters the audit query to reset-flow actions and maps rows", async () => {
  const rows = [
    {
      id: "r1",
      actor_user_id: "u1",
      actor_email: "self-service",
      target_user_id: "u1",
      action: "Password recovery requested",
      status: "pending",
      details_json: JSON.stringify({ target: "waiter@example.com" }),
      created_at: "2026-09-17T10:00:00.000Z",
    },
    {
      id: "r2",
      actor_user_id: "admin-1",
      actor_email: ADMIN_EMAIL,
      target_user_id: "u1",
      action: "Password reset email sent",
      status: "failed",
      details_json: JSON.stringify({ target: "waiter@example.com", message: "delivery failed" }),
      created_at: "2026-09-17T11:00:00.000Z",
    },
    // An unrelated row should be filtered out server-side — the D1 query's
    // WHERE clause would exclude it; included here only to document shape.
  ];
  const captures = [];
  const database = makeDatabase({ rows, captures });
  const response = await worker.fetch(buildRequest(), {
    AUTH_DB: database,
    ADMIN_EMAILS: ADMIN_EMAIL,
    ALLOWED_ORIGINS: "https://app.example.test",
  });
  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.equal(payload.ok, true);
  assert.equal(payload.operations.length, 2);
  assert.equal(payload.operations[0].target, "waiter@example.com");
  assert.equal(payload.operations[0].status, "pending");
  assert.equal(payload.operations[1].status, "failed");

  const query = captures.find((c) => c.sql.includes("FROM auth_audit_log"));
  assert.ok(query, "audit query captured");
  assert.ok(query.sql.includes("WHERE action IN"), "query filters by action");
  assert.ok(/LIMIT \?1/i.test(query.sql), "query still limits");
  const actionValues = query.values.slice(1);
  assert.ok(actionValues.includes("Password recovery requested"));
  assert.ok(actionValues.includes("Password reset email sent"));
});

test("clamps the limit into the allowed range", async () => {
  const captures = [];
  const database = makeDatabase({ captures });
  const response = await worker.fetch(buildRequest({ limit: 100000 }), {
    AUTH_DB: database,
    ADMIN_EMAILS: ADMIN_EMAIL,
    ALLOWED_ORIGINS: "https://app.example.test",
  });
  assert.equal(response.status, 200);
  const query = captures.find((c) => c.sql.includes("FROM auth_audit_log"));
  assert.equal(query.values[0], 500);
});
