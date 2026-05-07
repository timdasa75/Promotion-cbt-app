import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildHeaderSummaryModel,
  buildSupportStateCardsModel,
  buildUtilityActionButtonModel,
  getHeaderSyncSummary,
} from "../../js/appSupportView.js";

test("getHeaderSyncSummary reflects auth and cloud sync states", () => {
  assert.deepEqual(getHeaderSyncSummary(null), {
    label: "Signed out",
    tone: "muted",
    title: "Login to enable saved progress and sync guidance.",
  });

  assert.deepEqual(
    getHeaderSyncSummary({ id: "u1" }, { providerLabel: "Local", syncEnabled: false }),
    {
      label: "Device only",
      tone: "muted",
      title: "Progress stays on this device until Cloud auth and sync are available.",
    },
  );

  assert.deepEqual(
    getHeaderSyncSummary(
      { id: "u1" },
      {
        providerLabel: "Cloud",
        syncEnabled: true,
        syncStatus: { synced: true, lastSuccessAt: "2026-05-07T09:00:00Z" },
        formatRelativeTime: () => "today",
        formatDateTime: () => "May 7",
      },
    ),
    {
      label: "Synced",
      tone: "high",
      title: "Last synced today.",
    },
  );
});

test("buildHeaderSummaryModel composes display name and pills", () => {
  const model = buildHeaderSummaryModel({
    user: { name: "Tim", email: "tim@example.com" },
    planLabel: "Premium",
    providerLabel: "Cloud",
    syncSummary: { label: "Synced", tone: "high", title: "Last synced today." },
  });

  assert.equal(model.displayName, "Tim");
  assert.deepEqual(model.pills, [
    { text: "Premium", className: "summary-pill summary-pill-plan" },
    { text: "Cloud", className: "summary-pill" },
    { text: "Synced", className: "summary-pill summary-pill-high" },
  ]);
  assert.equal(model.syncTitle, "Last synced today.");
});
test("buildSupportStateCardsModel summarizes attempts, review queues, and sync copy", () => {
  const model = buildSupportStateCardsModel({
    attempts: [{ attemptId: "a1" }, { attemptId: "a2" }],
    retryCount: 3,
    spacedDueCount: 1,
    syncSummary: { title: "Last synced today." },
    hasUser: true,
  });

  assert.equal(model.attemptsMeta, "You have 2 scored sessions saved. Open Analytics to review your trend.");
  assert.equal(model.reviewQueueMeta, "3 retry questions and 1 spaced-review item are ready right now.");
  assert.equal(model.syncMeta, "Last synced today.");
});

test("buildUtilityActionButtonModel handles available and empty states", () => {
  assert.deepEqual(
    buildUtilityActionButtonModel({ label: "Retry Missed", count: 4, emptyTitle: "Empty" }),
    {
      hasCount: true,
      countText: "4",
      text: "Retry Missed (4)",
      disabled: false,
      ariaLabel: "Retry Missed, 4 ready",
      title: "Retry Missed: 4 ready",
    },
  );

  assert.deepEqual(
    buildUtilityActionButtonModel({ label: "Revision (Flagged)", count: 0, emptyTitle: "Flag questions during a quiz to review them here." }),
    {
      hasCount: false,
      countText: "0",
      text: "Revision (Flagged)",
      disabled: true,
      ariaLabel: "Revision (Flagged), unavailable until you complete more sessions",
      title: "Flag questions during a quiz to review them here.",
    },
  );
});

