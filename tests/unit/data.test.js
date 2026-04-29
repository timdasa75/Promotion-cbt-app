import test from "node:test";
import assert from "node:assert/strict";

import { getTopicQuestionCounts, getTotalQuestionCountForTopic } from "../../js/data.js";

test("topic question counts use public metadata before falling back to file fetches", async () => {
  const previousFetch = global.fetch;
  global.fetch = async () => {
    throw new Error("metadata path should not hit fetch");
  };

  try {
    const counts = await getTopicQuestionCounts([
      { id: "psr", questionCount: 1443 },
      { id: "ict", questionCount: 373 },
    ]);
    assert.deepEqual(counts, {
      psr: 1443,
      ict: 373,
    });

    const total = await getTotalQuestionCountForTopic({ id: "psr", questionCount: 1443 });
    assert.equal(total, 1443);
  } finally {
    global.fetch = previousFetch;
  }
});
