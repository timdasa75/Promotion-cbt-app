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
function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Block-level container state (loading / error / empty) for sections that
 * fetch or build their content asynchronously, e.g. the topic grid or a
 * review queue. Returns an HTML string ready for innerHTML.
 */
export function buildStatePanelHtml({
  tone = "loading",
  text = "",
  actionLabel = "",
  actionTarget = "",
} = {}) {
  const key = String(tone || "loading").trim().toLowerCase();
  const meta = CONTROL_STATE_META[key] || CONTROL_STATE_META.loading;
  const textHtml = text ? `<span class="state-note-text">${escapeHtml(text)}</span>` : "";
  const actionHtml =
    actionLabel && actionTarget
      ? `<button type="button" class="state-note-action" data-state-action="${escapeHtml(actionTarget)}">${escapeHtml(actionLabel)}</button>`
      : "";
  return `<div class="state-panel ${meta.tone}" role="status"><span class="state-note-tag">${escapeHtml(meta.tag)}</span>${textHtml}${actionHtml}</div>`;
}

export function resolveActivityRefreshNote({
  everLoaded = false,
  failureTimeLabel = "",
  lastSuccessTimeLabel = "",
  detail = "",
} = {}) {
  const when = String(failureTimeLabel || "").trim();
  const staleFrom = String(lastSuccessTimeLabel || "").trim();
  let text;
  if (everLoaded) {
    text = `Couldn't refresh activity metrics${when ? ` at ${when}` : ""}.`;
    text += staleFrom
      ? ` Showing data from ${staleFrom}.`
      : " Showing the last successful load.";
  } else {
    text = `Couldn't load activity metrics${when ? ` at ${when}` : ""}. Check your connection and try again.`;
    const detailText = String(detail || "").trim();
    if (detailText) text += ` (${detailText})`;
  }
  return {
    tone: "error",
    text,
    actionLabel: "Try again",
    actionTarget: "retry-activity-metrics",
  };
}

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
