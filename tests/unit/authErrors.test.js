import test from "node:test";
import assert from "node:assert/strict";

import { mapFirebaseAuthError } from "../../js/authErrors.js";

test("mapFirebaseAuthError normalizes known Firebase auth codes", () => {
  assert.equal(
    mapFirebaseAuthError("EMAIL_NOT_FOUND: there is no user record"),
    "No account exists for this email yet. Register first.",
  );
  assert.equal(mapFirebaseAuthError("invalid_password"), "Invalid email or password.");
  assert.equal(
    mapFirebaseAuthError("quota_exceeded: too many requests"),
    "Service temporarily unavailable. Try again later.",
  );
});

test("mapFirebaseAuthError falls back to the original message", () => {
  assert.equal(mapFirebaseAuthError("Something unexpected happened"), "Something unexpected happened");
  assert.equal(mapFirebaseAuthError(""), "Authentication request failed.");
});
