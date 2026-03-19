import test from "node:test";
import assert from "node:assert/strict";

import { buildProfilePayloadFromSession, resolveCloudPlan } from "../../js/authCloudProfile.js";

test("profile payload builder derives admin and verification state", () => {
  const payload = buildProfilePayloadFromSession(
    {
      user: {
        id: "u1",
        name: "Test User",
        email: "USER@EXAMPLE.COM",
        plan: "free",
        emailVerified: true,
        createdAt: "2026-03-18T10:00:00Z",
      },
    },
    { plan: "premium", emailVerified: false },
    ["user@example.com"],
  );

  assert.equal(payload.id, "u1");
  assert.equal(payload.email, "user@example.com");
  assert.equal(payload.plan, "premium");
  assert.equal(payload.role, "admin");
  assert.equal(payload.emailVerified, true);
});

test("resolveCloudPlan prefers profile data and falls back to session plan", async () => {
  const session = { accessToken: "token", user: { id: "u1", email: "user@example.com", plan: "free" } };
  const plan = await resolveCloudPlan(session, {
    getProfileById: async () => ({ plan: "premium" }),
    findProfilesByEmail: async () => [],
  });
  assert.equal(plan, "premium");

  const fallbackPlan = await resolveCloudPlan({ user: { plan: "free" } });
  assert.equal(fallbackPlan, "free");
});
