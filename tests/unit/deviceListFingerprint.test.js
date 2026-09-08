import assert from "node:assert/strict";
import test from "node:test";
import { createHash, randomUUID } from "node:crypto";

import worker from "../../workers/admin-bridge/worker.js";

const ALLOWED_ORIGINS = "https://app.example.test";
const DEVICE_LIST_URL = "https://worker.example.test/device/list";

// ---- Table-backed D1 mock (auth_sessions + auth_users + trusted_devices) ----
function makeDatabase({ viewerEmail, otherEmail = "other@example.com" }) {
  const sessionId = randomUUID();
  const sessionSecret = `${randomUUID().replace(/-/g, "")}${randomUUID().replace(/-/g, "")}`;
  const sessionSecretHash = createHash("sha256").update(sessionSecret).digest("base64url");
  const token = `${sessionId}.${sessionSecret}`;

  const users = [
    {
      id: "user-learner",
      email: viewerEmail,
      password_hash: "unused",
      role: "user",
      plan: "free",
      status: "active",
      email_verified: 1,
      legacy_provider: "",
      legacy_user_id: "",
      created_at: "",
      updated_at: "",
      last_login_at: "",
    },
    {
      id: "user-other",
      email: otherEmail,
      password_hash: "unused",
      role: "user",
      plan: "free",
      status: "active",
      email_verified: 1,
      legacy_provider: "",
      legacy_user_id: "",
      created_at: "",
      updated_at: "",
      last_login_at: "",
    },
  ];

  const sessions = [
    {
      session_id: sessionId,
      user_id: "user-learner",
      session_secret_hash: sessionSecretHash,
      refresh_secret_hash: "",
      created_at: "",
      expires_at: new Date(Date.now() + 3600_000).toISOString(),
      last_seen_at: "",
    },
  ];

  const devices = [
    {
      id: "dev-desktop",
      user_id: "user-learner",
      device_name: "Chrome on Windows",
      device_info: "{}",
      device_fingerprint: "fp-desktop",
      ip_address: "1.2.3.4",
      user_agent: "Mozilla/5.0",
      trusted_at: new Date(Date.now() - 86400_000).toISOString(),
      expires_at: "",
      last_used_at: new Date(Date.now() - 3600_000).toISOString(),
      is_permanent: 1,
      revoked_at: "",
    },
    {
      id: "dev-mobile",
      user_id: "user-learner",
      device_name: "Mobile Safari on iPhone",
      device_info: "{}",
      device_fingerprint: "fp-mobile",
      ip_address: "5.6.7.8",
      user_agent: "Mobile Safari",
      trusted_at: new Date(Date.now() - 7200_000).toISOString(),
      expires_at: new Date(Date.now() + 30 * 86400_000).toISOString(),
      last_used_at: new Date(Date.now() - 60_000).toISOString(),
      is_permanent: 0,
      revoked_at: "",
    },
    {
      // Revoked rows must be excluded from the user-facing list.
      id: "dev-revoked",
      user_id: "user-learner",
      device_name: "Old Laptop",
      device_info: "{}",
      device_fingerprint: "fp-revoked",
      ip_address: "",
      user_agent: "",
      trusted_at: "",
      expires_at: "",
      last_used_at: "",
      is_permanent: 0,
      revoked_at: new Date().toISOString(),
    },
  ];

  const database = {
    prepare(sql) {
      const text = String(sql);
      return {
        bind(...params) {
          return {
            async first() {
              if (text.includes("FROM auth_sessions")) {
                return sessions.find((s) => s.session_id === params[0]) || null;
              }
              if (text.includes("FROM auth_users")) {
                if (text.includes("WHERE email")) {
                  return users.find((u) => u.email === params[0]) || null;
                }
                return users.find((u) => u.id === params[0]) || null;
              }
              return null;
            },
            async all() {
              if (text.includes("FROM trusted_devices")) {
                const rows = devices
                  .filter(
                    (d) => d.user_id === params[0] && !d.revoked_at,
                  )
                  .sort((a, b) => String(b.last_used_at).localeCompare(String(a.last_used_at)));
                return { results: rows };
              }
              return { results: [] };
            },
            async run() {
              return { meta: { changes: 0 } };
            },
          };
        },
      };
    },
  };

  return { database, token };
}

function makeEnv({ viewerEmail = "learner@example.com" } = {}) {
  const { database, token } = makeDatabase({ viewerEmail });
  return {
    env: {
      ALLOWED_ORIGINS,
      AUTH_DB: database,
    },
    token,
  };
}

function deviceListRequest(token, email, { headers = {} } = {}) {
  return new Request(`${DEVICE_LIST_URL}?email=${encodeURIComponent(email)}`, {
    method: "GET",
    headers: {
      Origin: "https://app.example.test",
      Authorization: `Bearer ${token}`,
      ...headers,
    },
  });
}

test("device/list returns the stored fingerprint field for the profile badge", async () => {
  const { env, token } = makeEnv();
  const response = await worker.fetch(
    deviceListRequest(token, "learner@example.com"),
    env,
    {},
  );

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.ok, true);
  assert.equal(body.count, 2, "revoked rows are excluded");
  assert.equal(body.maxDevices, 3);

  // The badge regression: each device must carry its stored fingerprint so the
  // profile page can compare it against the current device's fingerprint.
  const byId = new Map(body.devices.map((d) => [d.id, d]));
  assert.equal(byId.get("dev-desktop").fingerprint, "fp-desktop");
  assert.equal(byId.get("dev-mobile").fingerprint, "fp-mobile");
  assert.equal(byId.has("dev-revoked"), false);

  // Sanity on the shape the profile page renders.
  assert.equal(byId.get("dev-desktop").deviceName, "Chrome on Windows");
  assert.equal(byId.get("dev-desktop").isPermanent, true);
  assert.equal(byId.get("dev-mobile").isPermanent, false);
  assert.ok(byId.get("dev-mobile").expiresAt, "30-day rows carry an expiry date");
  assert.equal(byId.get("dev-desktop").expiresAt, "", "primary devices never expire");
});

test("device/list rejects an invalid session token", async () => {
  const { env } = makeEnv();
  const response = await worker.fetch(
    deviceListRequest("invalid.token", "learner@example.com"),
    env,
    {},
  );

  assert.notEqual(response.status, 200);
  const body = await response.json();
  assert.equal(body.ok, false);
  assert.ok(!Array.isArray(body.devices), "no device data leaks on auth failure");
});

test("device/list refuses another user's devices for a non-admin viewer", async () => {
  const { env, token } = makeEnv({ viewerEmail: "learner@example.com" });
  const response = await worker.fetch(
    deviceListRequest(token, "other@example.com"),
    env,
    {},
  );

  // The viewer is not the target account and lacks admin credentials, so the
  // handler must never return the other user's devices.
  assert.equal(response.status, 403);
  const body = await response.json();
  assert.equal(body.ok, false);
  assert.ok(!Array.isArray(body.devices), "cross-account device data must not leak");
});

test("device/list requires an allowed origin", async () => {
  const { env, token } = makeEnv();
  const request = new Request(`${DEVICE_LIST_URL}?email=learner@example.com`, {
    method: "GET",
    headers: {
      Origin: "https://evil.example.test",
      Authorization: `Bearer ${token}`,
    },
  });
  const response = await worker.fetch(request, env, {});
  assert.equal(response.status, 403);
});