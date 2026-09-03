import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CONTROL_STATE_META,
  resolvePremiumLockNote,
  resolveQuestionCountDisplay,
  resolveQueueUnlockNote,
  resolveUsedCapNote,
} from "../../js/controlStates.js";

test("control state meta exposes the six documented tones", () => {
  assert.deepEqual(Object.keys(CONTROL_STATE_META).sort(), [
    "empty",
    "error",
    "loading",
    "premium",
    "prerequisite",
    "used",
  ]);
  assert.equal(CONTROL_STATE_META.prerequisite.tone, "is-prerequisite");
  assert.equal(CONTROL_STATE_META.premium.tone, "is-premium");
  assert.equal(CONTROL_STATE_META.used.tone, "is-used");
});

test("resolveQueueUnlockNote shows the unlock copy only when the queue is empty", () => {
  const empty = resolveQueueUnlockNote({
    count: 0,
    emptyText: "Complete a quiz to build your retry queue.",
  });
  assert.equal(empty.enabled, false);
  assert.equal(empty.noteVisible, true);
  assert.equal(empty.tone, "is-prerequisite");
  assert.equal(empty.tag, "Prerequisite");
  assert.equal(empty.text, "Complete a quiz to build your retry queue.");

  const ready = resolveQueueUnlockNote({
    count: 4,
    emptyText: "Complete a quiz to build your retry queue.",
  });
  assert.equal(ready.enabled, true);
  assert.equal(ready.noteVisible, false);
  assert.equal(ready.text, "");
});

test("resolveQueueUnlockNote honours a custom state tone", () => {
  const empty = resolveQueueUnlockNote({
    count: 0,
    state: "premium",
    emptyText: "Premium feature.",
  });
  assert.equal(empty.noteVisible, true);
  assert.equal(empty.tone, "is-premium");
  assert.equal(empty.tag, "Premium");
});

test("resolvePremiumLockNote provides label, benefit and action copy", () => {
  const premium = resolvePremiumLockNote();
  assert.equal(premium.tone, "is-premium");
  assert.equal(premium.tag, "Premium topic");
  assert.match(premium.text, /question bank/);
  assert.equal(premium.actionLabel, "View access options");

  const custom = resolvePremiumLockNote({
    label: "Premium subtopic",
    actionLabel: "Upgrade",
  });
  assert.equal(custom.tag, "Premium subtopic");
  assert.equal(custom.actionLabel, "Upgrade");
});

test("resolveUsedCapNote names the reset date when one is provided", () => {
  const withDate = resolveUsedCapNote({
    itemLabel: "Free mock",
    nextEligibleText: "on Mon 7 Sep",
  });
  assert.equal(withDate.tone, "is-used");
  assert.equal(withDate.tag, "Used this week");
  assert.equal(withDate.text, "Free mock available again on Mon 7 Sep.");

  const withoutDate = resolveUsedCapNote({ itemLabel: "Free mock" });
  assert.equal(withoutDate.text, "Free mock used this week.");
});

test("resolveQuestionCountDisplay keeps plain totals when no filter applies", () => {
  assert.equal(resolveQuestionCountDisplay({ total: 600 }), null);
  assert.equal(resolveQuestionCountDisplay({ total: 600, cap: 1000 }), null);
  assert.equal(resolveQuestionCountDisplay({ total: 0 }), null);
  assert.equal(resolveQuestionCountDisplay({ total: 0, cap: 100 }), null);
});

test("resolveQuestionCountDisplay labels free-plan caps as available of total", () => {
  const split = resolveQuestionCountDisplay({ total: 1466, cap: 100 });
  assert.deepEqual(split, {
    strong: "100",
    tail: "of 1466 Questions",
    title: "Free plan practice covers up to 100 of this content's 1466 questions.",
  });
});

test("resolveQuestionCountDisplay never advertises locked premium totals as usable", () => {
  const locked = resolveQuestionCountDisplay({ total: 1466, locked: true });
  assert.equal(locked.strong, "1466");
  assert.equal(locked.tail, "questions in full bank");
  assert.match(locked.title, /full bank/);
});
