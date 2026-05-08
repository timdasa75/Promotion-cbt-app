import { test } from "node:test";
import assert from "node:assert/strict";
import {
  getDashboardRecommendationDismissalKey,
  readDismissedDashboardRecommendationSignature,
  writeDismissedDashboardRecommendationSignature,
} from "../../js/appRecommendationDismissals.js";

function createMemoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  };
}

test("dashboard recommendation dismissal key is scoped by user id", () => {
  assert.equal(
    getDashboardRecommendationDismissalKey({ id: " user-1 " }),
    "cbt_dashboard_recommendation_dismissed_v1_user-1",
  );
  assert.equal(getDashboardRecommendationDismissalKey({ id: "" }), "");
  assert.equal(getDashboardRecommendationDismissalKey(null), "");
});

test("dashboard recommendation dismissal storage round-trips signatures", () => {
  const storage = createMemoryStorage();
  const user = { id: "admin-1" };

  writeDismissedDashboardRecommendationSignature(user, " topic-a|hard ", storage);
  assert.equal(
    readDismissedDashboardRecommendationSignature(user, storage),
    "topic-a|hard",
  );

  writeDismissedDashboardRecommendationSignature(user, "", storage);
  assert.equal(readDismissedDashboardRecommendationSignature(user, storage), "");
});

test("dashboard recommendation dismissal helpers tolerate unavailable storage", () => {
  const originalWarn = console.warn;
  console.warn = () => {};
  try {
    const throwingStorage = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
      removeItem: () => {
        throw new Error("blocked");
      },
    };

    assert.equal(
      readDismissedDashboardRecommendationSignature({ id: "admin-1" }, throwingStorage),
      "",
    );
    assert.doesNotThrow(() =>
      writeDismissedDashboardRecommendationSignature(
        { id: "admin-1" },
        "signature",
        throwingStorage,
      ),
    );
  } finally {
    console.warn = originalWarn;
  }
});
