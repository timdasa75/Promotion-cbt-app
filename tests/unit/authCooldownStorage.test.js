import test from "node:test";
import assert from "node:assert/strict";

import {
  readPasswordResetCooldowns,
  readVerificationResendCooldowns,
  writePasswordResetCooldowns,
  writeVerificationResendCooldowns,
} from "../../js/authCooldownStorage.js";

function createStorage(initial = {}) {
  const store = { ...initial };
  return {
    getItem(key) {
      return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null;
    },
    setItem(key, value) {
      store[key] = String(value);
    },
    snapshot() {
      return { ...store };
    },
  };
}

test("cooldown storage helpers round-trip and sanitize payloads", () => {
  const storage = createStorage({
    cbt_verification_resend_cooldown_v1: "{\"user@example.com\":123}",
    cbt_password_reset_cooldown_v1: "not-json",
  });

  assert.deepEqual(readVerificationResendCooldowns(storage), { "user@example.com": 123 });
  assert.deepEqual(readPasswordResetCooldowns(storage), {});

  writeVerificationResendCooldowns({ "user@example.com": 456 }, storage);
  writePasswordResetCooldowns({ "user@example.com": 789 }, storage);

  assert.deepEqual(JSON.parse(storage.snapshot().cbt_verification_resend_cooldown_v1), {
    "user@example.com": 456,
  });
  assert.deepEqual(JSON.parse(storage.snapshot().cbt_password_reset_cooldown_v1), {
    "user@example.com": 789,
  });
});
