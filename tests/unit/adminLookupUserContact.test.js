// Unit tests for the adminLookupUserContact route — the admin-gated lookup
// that returns the FULL stored phone number so the admin panel can build a
// wa.me click-to-chat link for password-reset handoff. (The user directory
// masks phones by design; only this admin route exposes the real digits.)
//
// Also covers the WhatsApp channel mode of adminSendPasswordReset
// (channel:"whatsapp" issues the token + audits the send but skips the email
// leg — no Resend attempt, no spurious "failed" row).
import test from "node:test";
import assert from "node:assert/strict";

import worker from "../../workers/admin-bridge/worker.js";
import { sha256Base64Url } from "../../workers/admin-bridge/auth-hybrid.js";

const SESSION_ID = "sess-lookup-123";
const SESSION_SECRET = "lookup-session-secret";
const ADMIN_EMAIL = "admin@example.com";

function adminAuthHeaders() {
  return {
    "Content-Type": "application/json",
    Origin: "https://app.example.test",
    Authorization: `Bearer ${SESSION_ID}.${SESSION_SECRET}`,
  };
}

// Mock D1: answers admin-session verification, user lookups by email, and the
// phone-column probe. Records every statement so tests can assert on SQL.
function makeDatabase({ userRow = null, captures = [] } = {}) {
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
          if (sql.includes("SELECT id, phone_number FROM auth_users") && sql.includes("WHERE email = ?1 LIMIT 1")) {
            return userRow;
          }
          if (sql.includes("FROM auth_users WHERE email = ?1 LIMIT 1")) {
            // adminSendPasswordReset's user lookup (id, email, name, status)
            return userRow ? { id: userRow.id, email: userRow.email, name: "", status: "active" } : null;
          }
          if (sql.includes("SELECT phone_number FROM auth_users LIMIT 1")) {
            return { phone_number: userRow?.phone_number || "" }; // column-exists probe
          }
          return null;
        },
        async all() {
          captures.push({ sql, values: [...bound] });
          return { results: [] };
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

function buildRequest(path, body) {
  return new Request(`https://worker.example.com/${path}`, {
    method: "POST",
    headers: adminAuthHeaders(),
    body: JSON.stringify(body),
  });
}

function makeEnv(database) {
  return { AUTH_DB: database, ADMIN_EMAILS: ADMIN_EMAIL, ALLOWED_ORIGINS: "https://app.example.test" };
}

test("adminLookupUserContact rejects unauthenticated callers", async () => {
  const headers = adminAuthHeaders();
  delete headers.Authorization;
  const response = await worker.fetch(
    new Request("https://worker.example.com/adminLookupUserContact", {
      method: "POST",
      headers,
      body: JSON.stringify({ email: "u@example.com" }),
    }),
    makeEnv(makeDatabase())
  );
  assert.equal(response.status, 401);
});

test("adminLookupUserContact returns the full stored phone for wa.me", async () => {
  const userRow = { id: "u-9", email: "adaeze@example.com", phone_number: "+2348031234567" };
  const captures = [];
  const response = await worker.fetch(
    buildRequest("adminLookupUserContact", { email: "adaeze@example.com" }),
    makeEnv(makeDatabase({ userRow, captures }))
  );
  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.equal(payload.ok, true);
  assert.equal(payload.found, true);
  assert.equal(payload.hasPhone, true);
  // Full digits, unmasked — the whole point of this route.
  assert.equal(payload.phone, "+2348031234567");
  const lookup = captures.find((c) => c.sql.includes("WHERE email = ?1") && c.sql.includes("phone_number"));
  assert.ok(lookup, "looks up the user by email including the phone column");
  assert.equal(lookup.values[0], "adaeze@example.com");
});

test("adminLookupUserContact reports hasPhone:false when no number is stored", async () => {
  const response = await worker.fetch(
    buildRequest("adminLookupUserContact", { email: "nophone@example.com" }),
    makeEnv(makeDatabase({ userRow: { id: "u-1", email: "nophone@example.com", phone_number: "" } }))
  );
  const payload = await response.json();
  assert.equal(payload.ok, true);
  assert.equal(payload.found, true);
  assert.equal(payload.hasPhone, false);
  assert.equal(payload.phone, "");
});

test("adminLookupUserContact rejects requests without an email", async () => {
  const response = await worker.fetch(
    buildRequest("adminLookupUserContact", {}),
    makeEnv(makeDatabase())
  );
  assert.equal(response.status, 400);
});

test("adminSendPasswordReset with channel:whatsapp skips email delivery and audits the WhatsApp send", async () => {
  const userRow = { id: "u-9", email: "adaeze@example.com", phone_number: "+2348031234567" };
  const captures = [];
  const database = makeDatabase({ userRow, captures });
  const response = await worker.fetch(
    buildRequest("adminSendPasswordReset", { email: "adaeze@example.com", baseUrl: "https://app.example.test", channel: "whatsapp" }),
    makeEnv(database)
  );
  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.equal(payload.ok, true, "WhatsApp mode succeeds without an email provider");
  assert.equal(payload.channel, "whatsapp");
  assert.ok(String(payload.resetUrl).startsWith("https://app.example.test/reset-password?token="), "returns the reset URL for the wa.me draft");

  // No Resend call side-effects to assert directly here, but the audit row
  // must be the WhatsApp action (not a "failed" email row).
  const audit = captures.find((c) => c.sql.includes("INSERT INTO auth_audit_log"));
  assert.ok(audit, "writes an audit row");
  const details = JSON.parse(audit.values.find((v) => typeof v === "string" && v.includes("channel")));
  assert.equal(details.channel, "admin-whatsapp");
  assert.ok(details.message.includes("via WhatsApp"));
});

test("adminSendPasswordReset still requires a known account in WhatsApp mode", async () => {
  const response = await worker.fetch(
    buildRequest("adminSendPasswordReset", { email: "ghost@example.com", baseUrl: "https://app.example.test", channel: "whatsapp" }),
    makeEnv(makeDatabase({ userRow: null }))
  );
  assert.equal(response.status, 404);
});
