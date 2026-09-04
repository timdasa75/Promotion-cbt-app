// quizTopicIds.js - eager, tiny module holding the virtual (synthetic) topic IDs.
// app.js needs these at module-evaluation time to build the virtual topic
// definitions, but quiz.js is lazy-loaded. Keeping the IDs here lets app.js
// reference them without pulling the quiz chunk into the boot graph.
export const RETRY_MISSED_TOPIC_ID = "retry_missed";
export const SPACED_PRACTICE_TOPIC_ID = "spaced_practice";
export const REVISION_TOPIC_ID = "topic_revision";