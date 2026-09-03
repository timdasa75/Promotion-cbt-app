// controlStates.js - Shared state vocabulary for unavailable or locked
// controls (UI/UX plan Stage 4).
//
// Every "why can't I use this?" surface should answer three questions:
//   1. label   - what state is this? (Empty / Prerequisite / Premium / Used)
//   2. reason  - why is it unavailable, in one sentence
//   3. action  - what the learner can do next (when one exists)
//
// The pure builders below keep that copy consistent across dashboard cards,
// topic cards, review queues, and Help. Rendering (DOM/CSS) lives elsewhere;
// this module must stay side-effect free so it is unit-testable in Node.

export const CONTROL_STATE_META = Object.freeze({
  empty: { tone: "is-empty", tag: "Empty" },
  prerequisite: { tone: "is-prerequisite", tag: "Prerequisite" },
  premium: { tone: "is-premium", tag: "Premium" },
  used: { tone: "is-used", tag: "Used this week" },
  loading: { tone: "is-loading", tag: "Loading" },
  error: { tone: "is-error", tag: "Needs attention" },
});

function normalizeTone(state = "prerequisite") {
  const key = String(state || "prerequisite").trim().toLowerCase();
  return CONTROL_STATE_META[key] || CONTROL_STATE_META.prerequisite;
}

/**
 * Model for a queue-based utility action (Retry Missed, Revision, Spaced
 * Practice). An enabled action has items ready; an empty queue shows the
 * unlock condition instead of a bare disabled button.
 */
export function resolveQueueUnlockNote({
  count = 0,
  emptyText = "",
  state = "prerequisite",
} = {}) {
  const enabled = Number(count || 0) > 0;
  const meta = normalizeTone(state);
  return {
    enabled,
    noteVisible: !enabled,
    tone: meta.tone,
    tag: meta.tag,
    text: enabled ? "" : String(emptyText || "").trim(),
  };
}

/**
 * Model for a premium-locked topic/subtopic card.
 */
export function resolvePremiumLockNote({
  label = "Premium topic",
  benefit = "Unlocks the full question bank, detailed analytics, and unlimited mock access.",
  actionLabel = "View access options",
} = {}) {
  const meta = normalizeTone("premium");
  return {
    tone: meta.tone,
    tag: label,
    text: String(benefit || "").trim(),
    actionLabel: String(actionLabel || "").trim(),
  };
}

/**
 * Model for a weekly/quota cap that has already been used this period.
 * `nextEligibleText` should already be human formatted, e.g. "on Mon 7 Sep".
 */
export function resolveUsedCapNote({
  itemLabel = "Free mock",
  nextEligibleText = "",
} = {}) {
  const meta = normalizeTone("used");
  const resetNote = String(nextEligibleText || "").trim();
  return {
    tone: meta.tone,
    tag: meta.tag,
    text: resetNote
      ? `${itemLabel} available again ${resetNote}.`
      : `${itemLabel} used this week.`,
  };
}

/**
 * Honest question-count label for topic/subtopic cards.
 *
 * Returns null when the plain "N Questions" label is accurate (no access
 * filter reduces the visible total). Otherwise it returns an explicit
 * available-of-total or full-bank label so premium content is never shown
 * as if it were immediately usable.
 */
export function resolveQuestionCountDisplay({
  total = 0,
  cap = null,
  locked = false,
} = {}) {
  const totalN = Math.max(0, Math.floor(Number(total) || 0));
  if (totalN <= 0) return null;

  if (locked) {
    return {
      strong: String(totalN),
      tail: "questions in full bank",
      title: `Premium content — the full bank holds ${totalN} questions.`,
    };
  }

  const capN = Math.max(0, Math.floor(Number(cap) || 0));
  if (capN > 0 && capN < totalN) {
    return {
      strong: String(capN),
      tail: `of ${totalN} Questions`,
      title: `Free plan practice covers up to ${capN} of this content's ${totalN} questions.`,
    };
  }

  return null;
}
