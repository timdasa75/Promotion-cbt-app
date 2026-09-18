import assert from "node:assert/strict";
import { test } from "node:test";

import { toWhatsAppNumber, buildWhatsAppResetMessage, buildWhatsAppClickToChatUrl } from "../../js/adminWhatsApp.js";

test("toWhatsAppNumber converts local Nigerian formats to international digits", () => {
  assert.equal(toWhatsAppNumber("08031234567"), "2348031234567");
  assert.equal(toWhatsAppNumber("8031234567"), "2348031234567");
  assert.equal(toWhatsAppNumber("+234 803 123 4567"), "2348031234567");
  assert.equal(toWhatsAppNumber("2348031234567"), "2348031234567");
  assert.equal(toWhatsAppNumber("00 234 803 123 4567"), "2348031234567");
  assert.equal(toWhatsAppNumber("0803-123-4567"), "2348031234567");
});

test("toWhatsAppNumber handles non-Nigerian numbers and rejects junk", () => {
  // A full international number with a different country code passes through.
  assert.equal(toWhatsAppNumber("+12025550123"), "12025550123");
  assert.equal(toWhatsAppNumber(""), null);
  assert.equal(toWhatsAppNumber("abc"), null);
  assert.equal(toWhatsAppNumber("123"), null); // too short
  assert.equal(toWhatsAppNumber("0"), null); // trunk zero only
  assert.equal(toWhatsAppNumber(null), null);
  assert.equal(toWhatsAppNumber(undefined), null);
});

test("buildWhatsAppResetMessage includes the link and stays short enough for wa.me", () => {
  const url = "https://promotioncbt.com/reset-password?token=abc123def456";
  const msg = buildWhatsAppResetMessage(url, "Adaeze", "adaeze@example.com");
  assert.ok(msg.includes(url), "message contains the reset link");
  assert.ok(msg.includes("Adaeze"), "message greets by name");
  assert.ok(msg.includes("24 hours"), "message states the expiry");
  // wa.me reliably handles a few hundred characters; keep a conservative cap.
  assert.ok(msg.length < 400, `message is ${msg.length} chars, under the wa.me safe envelope`);
});

test("buildWhatsAppResetMessage falls back to the email local-part and requires a URL", () => {
  const url = "https://x.test/reset-password?token=t";
  assert.ok(buildWhatsAppResetMessage(url, "", "chidi@example.com").includes("Hi chidi"));
  assert.throws(() => buildWhatsAppResetMessage("", "A", "a@b.c"), /resetUrl is required/);
});

test("buildWhatsAppClickToChatUrl encodes the message and returns null for bad numbers", () => {
  const url = buildWhatsAppClickToChatUrl("08031234567", "https://x.test/reset?token=abc", {
    name: "Ngozi",
    email: "ngozi@example.com",
  });
  assert.ok(url.startsWith("https://wa.me/2348031234567?text="), "uses international digits");
  const decoded = decodeURIComponent(url.split("text=")[1]);
  assert.ok(decoded.includes("https://x.test/reset?token=abc"), "link survives URL encoding");
  assert.ok(decoded.includes("Ngozi"));

  assert.equal(buildWhatsAppClickToChatUrl("not-a-phone", "https://x.test/r"), null);
  assert.equal(buildWhatsAppClickToChatUrl("", "https://x.test/r"), null);
});
