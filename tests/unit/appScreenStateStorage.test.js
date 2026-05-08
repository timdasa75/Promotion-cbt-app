import { test } from "node:test";
import assert from "node:assert/strict";
import {
  clearScreenState,
  readScreenState,
  writeScreenState,
} from "../../js/appScreenStateStorage.js";

const SCREEN_STATE_STORAGE_KEY = "cbt_screen_state_v1";

function createMemoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  };
}

test("screen state storage round-trips object state", () => {
  const storage = createMemoryStorage();
  const state = {
    userId: "user-1",
    screenId: "modeSelectionScreen",
    topicId: "psr",
  };

  writeScreenState(state, storage);
  assert.deepEqual(readScreenState(storage), state);
});

test("screen state storage ignores missing, malformed, and non-object values", () => {
  const storage = createMemoryStorage();

  assert.equal(readScreenState(storage), null);

  storage.setItem(SCREEN_STATE_STORAGE_KEY, "{not-json");
  assert.equal(readScreenState(storage), null);

  storage.setItem(SCREEN_STATE_STORAGE_KEY, "[]");
  assert.equal(readScreenState(storage), null);
});

test("screen state storage clears saved state", () => {
  const storage = createMemoryStorage();

  writeScreenState({ screenId: "topicSelectionScreen" }, storage);
  clearScreenState(storage);

  assert.equal(readScreenState(storage), null);
});

test("screen state storage tolerates unavailable storage", () => {
  assert.equal(readScreenState(null), null);
  assert.doesNotThrow(() => writeScreenState({ screenId: "helpScreen" }, null));
  assert.doesNotThrow(() => clearScreenState(null));
});
