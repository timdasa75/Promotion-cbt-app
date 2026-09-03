import test from "node:test";
import assert from "node:assert/strict";

import {
  handleAuthRegister,
  handleAuthLogin,
  handleAuthPasswordResetComplete,
  handleAuthVerificationComplete,
  handleAuthVerificationResend,
  hashPassword,
  resolveHybridAuthRouteHandler,
  verifyPassword,
} from "../../workers/admin-bridge/auth-hybrid.js";

test("cloudflare hybrid auth hashes and verifies passwords", async () => {
  const storedHash = await hashPassword("super-secret-password");
  assert.match(storedHash, /^pbkdf2_sha256\$/);
  assert.equal(await verifyPassword("super-secret-password", storedHash), true);
  assert.equal(await verifyPassword("wrong-password", storedHash), false);
});

test("cloudflare hybrid auth rejects short passwords early", async () => {
  await assert.rejects(
    () => hashPassword("short"),
    (error) => error?.message === "Password must be at least 8 characters." && error?.httpStatus === 400,
  );
});

test("cloudflare hybrid auth route resolver only claims auth routes", () => {
  assert.equal(typeof resolveHybridAuthRouteHandler("/auth/register"), "function");
  assert.equal(typeof resolveHybridAuthRouteHandler("/auth/login"), "function");
  assert.equal(typeof resolveHybridAuthRouteHandler("/auth/session"), "function");
  assert.equal(typeof resolveHybridAuthRouteHandler("/auth/logout"), "function");
  assert.equal(typeof resolveHybridAuthRouteHandler("/auth/password/change"), "function");
  assert.equal(typeof resolveHybridAuthRouteHandler("/auth/password/complete"), "function");
  assert.equal(typeof resolveHybridAuthRouteHandler("/auth/verification/resend"), "function");
  assert.equal(typeof resolveHybridAuthRouteHandler("/auth/verification/complete"), "function");
  assert.equal(resolveHybridAuthRouteHandler("/adminListUsers"), null);
});

test("email verification and password reset reject incomplete public input before database access", async () => {
  const noDatabaseAccess = {
    prepare() {
      throw new Error("database should not be accessed for invalid input");
    },
  };

  const request = (path, body) => new Request(`https://worker.example.com${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  await assert.rejects(
    () => handleAuthVerificationResend(request("/auth/verification/resend", { email: "not-an-email" }), { AUTH_DB: noDatabaseAccess }),
    (error) => error?.httpStatus === 400 && /valid email/i.test(error?.message),
  );
  await assert.rejects(
    () => handleAuthVerificationComplete(request("/auth/verification/complete", {}), { AUTH_DB: noDatabaseAccess }),
    (error) => error?.httpStatus === 400 && /verification token/i.test(error?.message),
  );
  await assert.rejects(
    () => handleAuthPasswordResetComplete(request("/auth/password/complete", { token: "present", password: "short" }), { AUTH_DB: noDatabaseAccess }),
    (error) => error?.httpStatus === 400 && /at least 8 characters/i.test(error?.message),
  );
});

test("cloudflare login hides missing accounts and records rate-limit attempts", async () => {
  const writes = [];
  const database = {
    prepare(sql) {
      return {
        bind(...values) {
          return {
            async first() {
              if (sql.includes("FROM auth_rate_limits")) return null;
              if (sql.includes("FROM auth_users")) return null;
              throw new Error(`Unexpected first query: ${sql}`);
            },
            async run() {
              writes.push({ sql, values });
              return { success: true };
            },
          };
        },
      };
    },
  };

  const request = new Request("https://worker.example.com/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "CF-Connecting-IP": "203.0.113.8",
    },
    body: JSON.stringify({
      email: "missing@example.com",
      password: "super-secret-password",
    }),
  });

  await assert.rejects(
    () => handleAuthLogin(request, { AUTH_DB: database }),
    (error) => error?.httpStatus === 401 && error?.message === "Invalid email or password.",
  );

  assert.equal(writes.length, 2);
  assert.equal(writes[0].values[0], "login:email:missing@example.com");
  assert.equal(writes[1].values[0], "login:ip:203.0.113.8");
});

test("cloudflare registration resets expired rate-limit buckets", async () => {
  const writes = [];
  const database = {
    prepare(sql) {
      return {
        bind(...values) {
          return {
            async first() {
              if (sql.includes("FROM auth_rate_limits")) {
                return {
                  window_started_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                  count: 5,
                };
              }
              if (sql.includes("FROM auth_users") && sql.includes("WHERE email")) return null;
              if (sql.includes("FROM auth_users") && sql.includes("WHERE id")) {
                return {
                  id: values[0],
                  email: "new@example.com",
                  role: "user",
                  plan: "free",
                  status: "active",
                  email_verified: 0,
                  created_at: "2026-05-18T00:00:00.000Z",
                  last_login_at: "",
                };
              }
              throw new Error(`Unexpected first query: ${sql}`);
            },
            async run() {
              writes.push({ sql, values });
              return { success: true };
            },
          };
        },
      };
    },
  };

  const request = new Request("https://worker.example.com/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "CF-Connecting-IP": "203.0.113.9",
    },
    body: JSON.stringify({
      email: "new@example.com",
      password: "super-secret-password",
    }),
  });

  const result = await handleAuthRegister(request, { AUTH_DB: database });
  assert.equal(result.ok, true);

  const resetWrite = writes.find((entry) =>
    entry.sql.includes("UPDATE auth_rate_limits SET window_started_at = ?2, count = 1"),
  );
  assert.ok(resetWrite, "expired registration bucket should reset to count 1");
  assert.equal(resetWrite.values[0], "register:ip:203.0.113.9");
});
