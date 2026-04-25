import test from "node:test";
import assert from "node:assert/strict";

import {
  listUsersViaCloudFunction,
  sendVerificationViaAdminApi,
  setUserStatusViaAdminApi,
} from "../../js/authAdminApi.js";

test("admin API helpers use custom base URL and normalize payloads", async () => {
  const originalWindow = global.window;
  global.window = {
    PROMOTION_CBT_AUTH: {
      adminApiBaseUrl: "https://admin.example.com///",
    },
  };

  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url, options });
    return {
      ok: true,
      json: async () => ({
        ok: true,
        users: [
          {
            uid: "user-1",
            email: " USER@Example.com ",
            displayName: "User One",
            emailVerified: "true",
            disabled: 0,
            createdAt: "2026-03-01T00:00:00Z",
            lastSignInAt: "2026-03-02T00:00:00Z",
          },
        ],
        warning: " sync-lag ",
        authDisabledSynced: 1,
      }),
    };
  };

  try {
    const users = await listUsersViaCloudFunction("token-1", fetchImpl);
    const statusResult = await setUserStatusViaAdminApi("user-1", "SUSPENDED", "token-2", fetchImpl);
    await sendVerificationViaAdminApi(" USER@Example.com ", " https://example.com/next ", "token-3", fetchImpl);

    assert.deepEqual(users, [
      {
        id: "user-1",
        email: "user@example.com",
        name: "User One",
        role: "",
        plan: "",
        status: "",
        source: "",
        emailVerified: true,
        disabled: false,
        createdAt: "2026-03-01T00:00:00.000Z",
        lastSignInAt: "2026-03-02T00:00:00.000Z",
      },
    ]);
    assert.deepEqual(statusResult, {
      warning: "sync-lag",
      authDisabledSynced: true,
    });

    assert.equal(calls[0].url, "https://admin.example.com/adminListUsers");
    assert.equal(calls[0].options.headers.Authorization, "Bearer token-1");
    assert.deepEqual(JSON.parse(calls[1].options.body), {
      userId: "user-1",
      status: "suspended",
    });
    assert.deepEqual(JSON.parse(calls[2].options.body), {
      email: "user@example.com",
      continueUrl: "https://example.com/next",
    });
  } finally {
    global.window = originalWindow;
  }
});
