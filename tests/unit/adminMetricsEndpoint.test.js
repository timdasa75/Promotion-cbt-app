import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import worker, { resolveRouteHandler } from "../../workers/admin-bridge/worker.js";
import { sha256Base64Url } from "../../workers/admin-bridge/auth-hybrid.js";

const SESSION_ID = "sess-admin-123";
const SESSION_SECRET = "admin-session-secret";
const ADMIN_EMAIL = "admin@example.com";

function makeMetricsDatabase({ captures }) {
  const statsQueries = {
    session: 0,
    user: 0,
    feedback: 0,
    device: 0,
    audit: 0,
  };
  const database = {
    __statsQueries: statsQueries,
    prepare(sql) {
      const bound = [];
      const statement = {
        bind(...values) {
          bound.push(...values);
          return statement;
        },
        async first() {
          captures.push({ sql, values: [...bound] });
          if (sql.includes("COUNT(DISTINCT CASE WHEN last_seen_at")) {
            statsQueries.session += 1;
            return {
              currently_active: 2,
              hourly_active: 3,
              daily_active: 5,
              weekly_active: 7,
              monthly_active: 9,
              total_sessions: 42,
            };
          }
          if (sql.includes("SELECT s.session_id")) {
            return {
              session_id: SESSION_ID,
              user_id: "admin-1",
              session_secret_hash: await sha256Base64Url(SESSION_SECRET),
              expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
              id: "admin-1",
              email: ADMIN_EMAIL,
              role: "admin",
              status: "active",
            };
          }
          if (sql.includes("total_users")) {
            statsQueries.user += 1;
            return { total_users: 100, premium_users: 20, verified_users: 85, unverified_users: 15 };
          }
          if (sql.includes("FROM feedback_submissions")) {
            statsQueries.feedback += 1;
            return { total_feedback: 30, open_feedback: 4 };
          }
          if (sql.includes("FROM trusted_devices")) {
            statsQueries.device += 1;
            return { total_trusted_devices: 12 };
          }
          if (sql.includes("FROM login_audit_log")) {
            statsQueries.audit += 1;
            return { count: 6 };
          }
          throw new Error(`Unexpected first query: ${sql}`);
        },
        async all() {
          captures.push({ sql, values: [...bound] });
          if (sql.includes("SELECT id FROM auth_users WHERE lower(email) IN")) {
            return { results: [{ id: "admin-1" }] };
          }
          throw new Error(`Unexpected all query: ${sql}`);
        },
        async run() {
          captures.push({ sql, values: [...bound] });
          return { success: true, meta: { changes: 1 } };
        },
      };
      return statement;
    },
  };
  return database;
}

function jsonHeaders() {
  return { "Content-Type": "application/json", Origin: "https://app.example.test" };
}

function buildEnv(captures) {
  return {
    AUTH_DB: makeMetricsDatabase({ captures }),
    ADMIN_EMAILS: ADMIN_EMAIL,
    ALLOWED_ORIGINS: "https://app.example.test",
  };
}

function metricsRequest() {
  return new Request("https://worker.example.com/adminActivityMetrics", {
    method: "POST",
    headers: {
      ...jsonHeaders(),
      Authorization: `Bearer ${SESSION_ID}.${SESSION_SECRET}`,
    },
    body: JSON.stringify({}),
  });
}

test("admin activity metrics route is registered", () => {
  assert.equal(typeof resolveRouteHandler("/adminActivityMetrics"), "function");
});

test("admin activity metrics rejects unauthenticated callers", async () => {
  const env = buildEnv([]);

  const response = await worker.fetch(
    new Request("https://worker.example.com/adminActivityMetrics", {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify({}),
    }),
    env,
  );

  assert.equal(response.status, 401);
});

test("admin activity metrics consolidates stats into one query per table", async () => {
  const captures = [];
  const env = buildEnv(captures);

  const response = await worker.fetch(metricsRequest(), env);
  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.equal(payload.ok, true);

  // Payload shape must stay identical for the dashboard.
  assert.deepEqual(payload.metrics, {
    currentlyActive: 2,
    hourlyActive: 3,
    dailyActive: 5,
    weeklyActive: 7,
    monthlyActive: 9,
    totalUsers: 100,
    premiumUsers: 20,
    verifiedUsers: 85,
    unverifiedUsers: 15,
    totalFeedback: 30,
    openFeedback: 4,
    totalSessions: 42,
    totalTrustedDevices: 12,
    recentLogins: 6,
  });

  // One stats query per table — not one per metric. This is the D1
  // row-read guarantee: an unattended admin tab must not exhaust the
  // free-tier quota again.
  const stats = env.AUTH_DB.__statsQueries;
  assert.equal(stats.session, 1);
  assert.equal(stats.user, 1);
  assert.equal(stats.feedback, 1);
  assert.equal(stats.device, 1);
  assert.equal(stats.audit, 1);

  // The consolidated session query binds five window dates (?1-?5), so the
  // admin-user exclusion must start at ?6 — a ?2 start would collide.
  const sessionStats = captures.find((entry) => entry.sql.includes("COUNT(DISTINCT CASE WHEN last_seen_at"));
  assert.ok(sessionStats, "session stats query should run");
  assert.equal(sessionStats.values.length, 6);
  assert.match(sessionStats.sql, /NOT IN \(\?6\)/);
});

test("admin activity metrics serves repeat requests from the edge cache", async () => {
  const store = new Map();
  globalThis.caches = {
    default: {
      async match(request) {
        return store.get(request.url) || null;
      },
      async put(request, response) {
        store.set(request.url, response);
      },
    },
  };

  try {
    const captures = [];
    const env = buildEnv(captures);

    const first = await worker.fetch(metricsRequest(), env);
    assert.equal(first.status, 200);
    const firstPayload = await first.json();

    const statsQueriesAfterFirst = captures.filter((entry) => entry.sql.includes("COUNT(")).length;

    const second = await worker.fetch(metricsRequest(), env);
    assert.equal(second.status, 200);
    const secondPayload = await second.json();
    assert.deepEqual(secondPayload, firstPayload);

    const statsQueriesAfterSecond = captures.filter((entry) => entry.sql.includes("COUNT(")).length;
    assert.equal(statsQueriesAfterSecond, statsQueriesAfterFirst, "cached request must not run stats queries");
  } finally {
    delete globalThis.caches;
  }
});

test("metrics session index migration exists", async () => {
  const migration = await readFile(
    new URL("../../workers/admin-bridge/migrations/0009_metrics_session_index.sql", import.meta.url),
    "utf8",
  );
  assert.match(migration, /CREATE INDEX IF NOT EXISTS idx_auth_sessions_last_seen/);
});

test("feedback reply/resolution columns migration exists", async () => {
  // The reply + resolve handlers and /feedback/userList SELECT reference these
  // columns; without the migration every reply/resolve/list call would 500 on
  // a real D1 database (they existed in no prior schema or migration).
  const migration = await readFile(
    new URL("../../workers/admin-bridge/migrations/0010_feedback_reply_resolution_columns.sql", import.meta.url),
    "utf8",
  );
  for (const column of ["admin_reply", "replied_at", "replied_by", "resolved_at", "resolved_by", "resolution"]) {
    assert.match(migration, new RegExp(`ADD COLUMN ${column} `), `migration must add ${column}`);
  }
});
