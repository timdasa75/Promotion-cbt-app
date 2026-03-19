import test from "node:test";
import assert from "node:assert/strict";

import {
  fromFirebaseMillisToIso,
  normalizeBaseUrl,
  normalizeEmail,
  normalizeEmailVerificationState,
  normalizePlan,
  normalizeRole,
  normalizeStatus,
  normalizeUpgradeRequestStatus,
  resolveCooldownMs,
  resolveRuntimeBoolean,
  toIsoTimestamp,
  toOptionalIsoTimestamp,
} from "../../js/authNormalization.js";

test("auth normalization helpers map common string values", () => {
  assert.equal(normalizeEmail("  TIMDASA75@GMAIL.COM "), "timdasa75@gmail.com");
  assert.equal(normalizePlan("premium"), "premium");
  assert.equal(normalizePlan("anything else"), "free");
  assert.equal(normalizeRole("admin"), "admin");
  assert.equal(normalizeRole("user"), "user");
  assert.equal(normalizeStatus("suspended"), "suspended");
  assert.equal(normalizeStatus("active"), "active");
  assert.equal(normalizeUpgradeRequestStatus("approved"), "approved");
  assert.equal(normalizeUpgradeRequestStatus("unknown"), "none");
});

test("auth normalization helpers coerce timestamps and booleans consistently", () => {
  assert.equal(normalizeEmailVerificationState(true, null), true);
  assert.equal(normalizeEmailVerificationState("false", true), false);
  assert.equal(resolveRuntimeBoolean("yes", false), true);
  assert.equal(resolveRuntimeBoolean("off", true), false);
  assert.equal(resolveRuntimeBoolean("maybe", true), true);

  assert.equal(toIsoTimestamp("2026-03-18T10:00:00Z", "fallback"), "2026-03-18T10:00:00.000Z");
  assert.equal(toIsoTimestamp("not-a-date", "fallback"), "fallback");
  assert.equal(toOptionalIsoTimestamp(""), "");
  assert.equal(toOptionalIsoTimestamp("2026-03-18T10:00:00Z"), "2026-03-18T10:00:00.000Z");
  assert.equal(fromFirebaseMillisToIso(1710756000000, "fallback"), "2024-03-18T10:00:00.000Z");
  assert.equal(fromFirebaseMillisToIso("bad", "fallback"), "fallback");
});

test("auth normalization helpers clamp cooldowns and clean base urls", () => {
  assert.equal(normalizeBaseUrl(" https://example.com/ "), "https://example.com");
  assert.equal(normalizeBaseUrl(""), "");
  assert.equal(resolveCooldownMs(30_000, 90_000), 60_000);
  assert.equal(resolveCooldownMs(86_400_000 * 2, 90_000), 86_400_000);
  assert.equal(resolveCooldownMs("bad", 90_000), 90_000);
});
