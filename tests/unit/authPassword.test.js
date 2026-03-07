import test from "node:test";
import assert from "node:assert/strict";

import {
  LOCAL_PASSWORD_ALGO_V2,
  buildLocalPasswordRecord,
  derivePasswordHash,
  hashPasswordLegacy,
  verifyLocalPasswordRecord,
} from "../../js/authPassword.js";

test("buildLocalPasswordRecord creates PBKDF2-compatible records", async () => {
  const record = await buildLocalPasswordRecord("password123");

  assert.equal(record.passwordAlgo, LOCAL_PASSWORD_ALGO_V2);
  assert.equal(typeof record.passwordSalt, "string");
  assert.equal(record.passwordSalt.length > 0, true);
  assert.equal(typeof record.passwordHash, "string");
  assert.equal(record.passwordHash.length > 0, true);
  assert.equal(Number.isInteger(record.passwordIterations), true);
});

test("verifyLocalPasswordRecord validates correct and rejects incorrect password", async () => {
  const record = await buildLocalPasswordRecord("correct horse battery staple");

  assert.equal(await verifyLocalPasswordRecord(record, "correct horse battery staple"), true);
  assert.equal(await verifyLocalPasswordRecord(record, "wrong password"), false);
});

test("derivePasswordHash is deterministic for same password/salt/iterations", async () => {
  const salt = "00112233445566778899aabbccddeeff";
  const first = await derivePasswordHash("password123", salt, 120000);
  const second = await derivePasswordHash("password123", salt, 120000);

  assert.equal(first, second);
});

test("legacy hash records remain verifiable", async () => {
  const passwordHash = await hashPasswordLegacy("legacy-password");
  const legacyUser = { passwordHash };

  assert.equal(await verifyLocalPasswordRecord(legacyUser, "legacy-password"), true);
  assert.equal(await verifyLocalPasswordRecord(legacyUser, "not-it"), false);
});
