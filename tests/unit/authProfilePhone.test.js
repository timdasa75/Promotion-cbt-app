// Unit tests for the self-service profile phone route (auth/profile/phone):
// - route registered + auth-gated (401 without credentials)
// - GET returns the masked stored number
// - POST validates, normalizes, and saves; rejects invalid numbers
// - reject-clears: empty string removes the stored number
import test from "node:test";
import assert from "node:assert/strict";

import worker from "../../workers/admin-bridge/worker.js";
import { sha256Base64Url } from "../../workers/admin-bridge/auth-hybrid.js";

const SESSION_ID = "sess-phone-123";
const SESSION_SECRET = "phone-session-secret";
const USER_EMAIL = "learner@example.com";
const USER_ID = "user-42";

function makeDatabase({ storedPhone = "", captures = [] } = {}) {
  const sessionSecretHashPromise = sha256Base64Url(SESSION_SECRET);
  let phone = storedPhone;
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
          if (sql.includes("FROM auth_sessions") && sql.includes("WHERE session_id = ?1")) {
            return {
              session_id: SESSION_ID,
              user_id: USER_ID,
              session_secret_hash: await sessionSecretHashPromise,
              refresh_secret_hash: "",
              expires_at: new Date(Date.now() + 3600_000).toISOString(),
            };
          }
          if (sql.includes("SELECT phone_number FROM auth_users")) {
            return { phone_number: phone };
          }
          if (sql.includes("FROM auth_users") && sql.includes("WHERE id = ?1")) {
            return {
              id: USER_ID,
              email: USER_EMAIL,
              name: "Learner",
              password_hash: "",
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
          return null;
        },
        async run() {
          captures.push({ sql, values: [...bound] });
          if (sql.startsWith("UPDATE auth_users SET phone_number")) {
            phone = String(bound[0] || "");
          }
          return { success: true };
        },
        async all() {
          captures.push({ sql, values: [...bound] });
          return { results: [] };
        },
      };
      return statement;
    },
  };
}

function buildRequest(body, method = "POST", withAuth = true) {
  const headers = { "Content-Type": "application/json", Origin: "https://app.example.test" };
  if (withAuth) headers.Authorization = `Bearer ${SESSION_ID}.${SESSION_SECRET}`;
  return new Request("https://worker.example.com/auth/profile/phone", {
    method,
    headers,
    body: method === "GET" ? undefined : JSON.stringify(body || {}),
  });
}

const ENV = () => ({
  AUTH_DB: makeDatabase(),
  ADMIN_EMAILS: "admin@example.com",
  ALLOWED_ORIGINS: "https://app.example.test",
});

test("auth/profile/phone rejects unauthenticated callers", async () => {
  const env = ENV();
  const response = await worker.fetch(buildRequest({ phone: "+2348030000000" }, "POST", false), env);
  assert.equal(response.status, 401);
});

test("saves a valid phone number and returns it masked", async () => {
  const captures = [];
  const env = { AUTH_DB: makeDatabase({ captures }), ADMIN_EMAILS: "admin@example.com", ALLOWED_ORIGINS: "https://app.example.test" };
  const response = await worker.fetch(buildRequest({ phone: "+234 803 000 0000" }), env);
  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.equal(payload.ok, true);
  assert.equal(payload.phone, "+234***00");
  const update = captures.find((c) => c.sql.startsWith("UPDATE auth_users SET phone_number"));
  assert.equal(update.values[0], "+2348030000000", "separator characters are stripped before storing");
});

test("rejects invalid phone numbers with a 400", async () => {
  for (const bad of ["abc", "12", "+2348030000000123456789", "phone"]) {
    const response = await worker.fetch(buildRequest({ phone: bad }), ENV());
    assert.equal(response.status, 400, `"${bad}" should be rejected`);
  }
});

test("clearing the field removes the stored number", async () => {
  const captures = [];
  const env = { AUTH_DB: makeDatabase({ storedPhone: "+2348030000000", captures }), ADMIN_EMAILS: "admin@example.com", ALLOWED_ORIGINS: "https://app.example.test" };
  const response = await worker.fetch(buildRequest({ phone: "" }), env);
  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.equal(payload.cleared, true);
  // The clear statement hardcodes phone_number = '' and binds (timestamp, userId).
  const update = captures.find((c) => c.sql.includes("phone_number = ''"));
  assert.ok(update, "clear statement expected");
  assert.equal(update.values[1], USER_ID);
});

test("GET returns the masked stored number", async () => {
  const env = { AUTH_DB: makeDatabase({ storedPhone: "+2348030000000" }), ADMIN_EMAILS: "admin@example.com", ALLOWED_ORIGINS: "https://app.example.test" };
  const response = await worker.fetch(buildRequest(null, "GET"), env);
  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.equal(payload.ok, true);
  assert.equal(payload.phone, "+234***00");
});
