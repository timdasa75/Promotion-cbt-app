import test from "node:test";
import assert from "node:assert/strict";

import worker from "../../workers/admin-bridge/worker.js";

const RECOVERY_URL = "https://worker.example.com/auth/password/request";

function createMockDatabase() {
  const writes = [];
  const rateLimitBuckets = new Map(); // bucketKey -> { window_started_at, count }
  const database = {
    prepare(sql) {
      return {
        bind(...values) {
          return {
            async first() {
              if (sql.includes("FROM auth_rate_limits")) {
                const row = rateLimitBuckets.get(values[0]);
                return row ? { ...row } : null;
              }
              if (sql.includes("FROM auth_users")) {
                return { id: "u1", email: "recover@example.com", status: "active" };
              }
              throw new Error(`Unexpected first query: ${sql}`);
            },
            async run() {
              writes.push({ sql, values });
              if (sql.includes("INSERT INTO auth_rate_limits")) {
                rateLimitBuckets.set(values[0], { window_started_at: values[2], count: 1 });
              } else if (sql.includes("UPDATE auth_rate_limits SET window_started_at")) {
                const row = rateLimitBuckets.get(values[0]) || { count: 1 };
                rateLimitBuckets.set(values[0], { window_started_at: values[1], count: row.count || 1 });
              } else if (sql.includes("UPDATE auth_rate_limits SET count = count + 1")) {
                const row = rateLimitBuckets.get(values[0]) || { count: 0 };
                rateLimitBuckets.set(values[0], { ...row, count: row.count + 1 });
              }
              return { success: true };
            },
          };
        },
      };
    },
  };
  return { database, writes, rateLimitBuckets };
}

async function callRecovery(ip, env) {
  const request = new Request(RECOVERY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "CF-Connecting-IP": ip },
    body: JSON.stringify({ email: "recover@example.com" }),
  });
  const response = await worker.fetch(request, env);
  let payload = {};
  try {
    payload = await response.json();
  } catch {
    // non-JSON body
  }
  return { status: response.status, payload };
}

test("password recovery records an audit log and returns an honest warning when no email sender is configured", async () => {
  const { database, writes } = createMockDatabase();
  const { status, payload } = await callRecovery("203.0.113.21", { AUTH_DB: database });

  assert.equal(status, 200);
  assert.equal(payload.ok, true);
  assert.equal(payload.accepted, true);
  assert.match(payload.warning, /Contact an administrator/i);
  assert.ok(writes.some((entry) => entry.sql.includes("INSERT INTO auth_audit_log")));
});

test("password recovery returns a dispatch promise only when the sender is configured", async () => {
  const { database } = createMockDatabase();
  const { payload } = await callRecovery("203.0.113.22", {
    AUTH_DB: database,
    AUTH_PASSWORD_RECOVERY_SENDER: "true",
  });
  assert.match(payload.warning, /recovery instructions will follow shortly/i);
});

test("password recovery rate-limits repeated requests from the same IP", async () => {
  const { database } = createMockDatabase();
  const env = { AUTH_DB: database };

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const { status } = await callRecovery("203.0.113.23", env);
    assert.equal(status, 200);
  }

  const { status, payload } = await callRecovery("203.0.113.23", env);
  assert.equal(status, 429);
  assert.match(payload.error, /Too many recovery requests/);
});
