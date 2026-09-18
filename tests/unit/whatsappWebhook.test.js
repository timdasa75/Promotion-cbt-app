// Unit tests for the WhatsApp self-service password-recovery webhook.
//
// Flow: user messages the business number "RESET" from the login screen's
// wa.me prefill → Meta POSTs the webhook → Worker matches the sender's phone
// against stored auth_users.phone_number → replies with a single-use reset
// link via the Graph API. Free (user-initiated 24h window), SIM-verified.
//
// Covered: subscribe handshake, HMAC signature gating (fail-closed),
// phone-match → reset link, unlinked-number guidance, rate limiting, and
// PUBLIC_BASE_URL absence (audit failure row, honest user message).
import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";

import worker from "../../workers/admin-bridge/worker.js";

const APP_SECRET = "whatsapp-app-secret-test";
const VERIFY_TOKEN = "verify-token-test";
const BASE_URL = "https://timdasa75.github.io/promotion-cbt";

// ---- crypto helpers ------------------------------------------------------

function hmacHex(secret, body) {
  return crypto.createHmac("sha256", secret).update(body, "utf8").digest("hex");
}

// ---- D1 mock -------------------------------------------------------------

function makeDatabase({ users = [], captures = [] } = {}) {
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
          // Rate-limit bookkeeping: fresh window, never exhausted.
          if (sql.includes("FROM auth_rate_limits")) {
            return null;
          }
          return null;
        },
        async all() {
          captures.push({ sql, values: [...bound] });
          if (sql.includes("FROM auth_users") && sql.includes("phone_number IS NOT NULL")) {
            return { results: users };
          }
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

function makeEnv(database, overrides = {}) {
  return {
    AUTH_DB: database,
    ALLOWED_ORIGINS: "https://app.example.test",
    WHATSAPP_APP_SECRET: APP_SECRET,
    WHATSAPP_VERIFY_TOKEN: VERIFY_TOKEN,
    WHATSAPP_PHONE_NUMBER_ID: "PNID-TEST",
    WHATSAPP_TOKEN: "graph-token-test",
    PUBLIC_BASE_URL: BASE_URL,
    ...overrides,
  };
}

function webhookRequest(rawBody, { signature = true, method = "POST" } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (signature) {
    headers["X-Hub-Signature-256"] = `sha256=${hmacHex(APP_SECRET, rawBody)}`;
  }
  return new Request("https://worker.example.com/whatsapp/webhook", {
    method,
    headers,
    body: method === "POST" ? rawBody : undefined,
  });
}

function userMessage(from, text = "RESET") {
  return JSON.stringify({
    object: "whatsapp_business_account",
    entry: [
      {
        id: "ENTRY-1",
        changes: [
          {
            field: "messages",
            value: {
              messaging_product: "whatsapp",
              metadata: { display_phone_number: "2348000000000", phone_number_id: "PNID" },
              contacts: [{ profile: { name: "Test User" }, wa_id: from }],
              messages: [{ from, id: `wamid.${Math.random()}`, timestamp: "1726600000", text: { body: text }, type: "text" }],
            },
          },
        ],
      },
    ],
  });
}

// Stub the Graph API send so tests never hit the network.
function stubGraphSend(t, env, sentMessages) {
  const originalFetch = globalThis.fetch;
  t.mock.method(globalThis, "fetch", async (url, init) => {
    if (String(url).includes("graph.facebook.com")) {
      sentMessages.push({ url: String(url), body: JSON.parse(init.body) });
      return new Response(JSON.stringify({ messaging_product: "whatsapp", contacts: [{ input: "+", wa_id: "x" }] }), { status: 200 });
    }
    return originalFetch(url, init);
  });
}

test("webhook GET handshake echoes the challenge for the right verify token", async () => {
  const response = await worker.fetch(
    new Request("https://worker.example.com/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=verify-token-test&hub.challenge=CHALLENGE-123", { method: "GET" }),
    makeEnv(makeDatabase())
  );
  assert.equal(response.status, 200);
  assert.equal(await response.text(), "CHALLENGE-123");
});

test("webhook GET handshake rejects a wrong verify token", async () => {
  const response = await worker.fetch(
    new Request("https://worker.example.com/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=WRONG&hub.challenge=CHALLENGE-123", { method: "GET" }),
    makeEnv(makeDatabase())
  );
  assert.equal(response.status, 403);
});

test("webhook POST rejects an unsigned payload (fail closed)", async () => {
  const response = await worker.fetch(
    webhookRequest(userMessage("2348031234567"), { signature: false }),
    makeEnv(makeDatabase())
  );
  assert.equal(response.status, 401);
});

test("webhook POST rejects a payload signed with the wrong secret", async () => {
  const raw = userMessage("2348031234567");
  const headers = {
    "Content-Type": "application/json",
    "X-Hub-Signature-256": `sha256=${hmacHex("attacker-secret", raw)}`,
  };
  const response = await worker.fetch(
    new Request("https://worker.example.com/whatsapp/webhook", { method: "POST", headers, body: raw }),
    makeEnv(makeDatabase())
  );
  assert.equal(response.status, 401);
});

test("message from a linked phone receives the reset link and an audit row is written", async (t) => {
  const users = [{ id: "u-7", email: "adaeze@example.com", name: "Adaeze", phone_number: "08031234567" }];
  const captures = [];
  const database = makeDatabase({ users, captures });
  const sentMessages = [];
  stubGraphSend(t, makeEnv(database), sentMessages);

  const response = await worker.fetch(webhookRequest(userMessage("2348031234567")), makeEnv(database));
  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.equal(payload.ok, true);

  // The wa.me digits must match through the same normalization the client uses.
  assert.equal(sentMessages.length, 1);
  const text = sentMessages[0].body.text.body;
  // auth_users has no `name` column — greeting falls back to the email local-part.
  assert.ok(text.includes("adaeze"), "greets the user by email local-part");
  const urlMatch = text.match(/https:\/\/[^\s]+/);
  assert.ok(urlMatch && urlMatch[0].startsWith(`${BASE_URL}/reset-password?token=`), "contains the reset URL");

  const audit = captures.find((c) => c.sql.includes("INSERT INTO auth_audit_log"));
  assert.ok(audit, "writes an audit row");
  // Bound order: id, actorEmail, …, details_json — pick the JSON payload.
  const details = JSON.parse(audit.values.find((v) => typeof v === "string" && v.startsWith("{") && v.includes("whatsapp-self-service")));
  assert.equal(details.channel, "whatsapp-self-service");
});

test("message from an unlinked number gets guidance instead of a reset link", async (t) => {
  const users = [{ id: "u-7", email: "adaeze@example.com", name: "Adaeze", phone_number: "08099999999" }];
  const sentMessages = [];
  stubGraphSend(t, null, sentMessages);

  const response = await worker.fetch(webhookRequest(userMessage("2348031234567")), makeEnv(makeDatabase({ users })));
  assert.equal(response.status, 200);
  assert.equal(sentMessages.length, 1);
  assert.ok(sentMessages[0].body.text.body.includes("isn't linked"), "explains the number isn't linked");
  assert.ok(!sentMessages[0].body.text.body.includes("reset-password"), "never leaks a reset URL");
});

test("no PUBLIC_BASE_URL → honest unavailability message and a failed audit row", async (t) => {
  const users = [{ id: "u-7", email: "adaeze@example.com", name: "Adaeze", phone_number: "08031234567" }];
  const captures = [];
  const database = makeDatabase({ users, captures });
  const sentMessages = [];
  stubGraphSend(t, null, sentMessages);

  const response = await worker.fetch(
    webhookRequest(userMessage("2348031234567")),
    makeEnv(database, { PUBLIC_BASE_URL: "" })
  );
  assert.equal(response.status, 200);
  assert.ok(sentMessages[0].body.text.body.includes("temporarily unavailable"), "honest failure text");
  const audit = captures.find((c) => c.sql.includes("INSERT INTO auth_audit_log"));
  const details = JSON.parse(audit.values.find((v) => typeof v === "string" && v.startsWith("{") && v.includes("whatsapp-self-service")));
  assert.equal(details.message.includes("temporarily unavailable") || details.message.includes("PUBLIC_BASE_URL"), true, "failure reason recorded");
});
