export function getReviewMistakeTopicKey(entry) {
  return String(entry?.sourceTopicId || entry?.question?.sourceTopicId || entry?.sourceTopicName || "").trim();
}

export function getReviewMistakeTopicLabel(entry, { getTopicNameById = () => "" } = {}) {
  return String(entry?.sourceTopicName || getTopicNameById(getReviewMistakeTopicKey(entry)) || "Mixed Queue").trim();
}

export function getReviewMistakeSubcategoryLabel(question = {}) {
  return String(
    question?.sourceSubcategoryName ||
      question?.sourceSection ||
      question?.topic ||
      "",
  ).trim();
}

export function getReviewMistakeDifficultyValue(question = {}) {
  return String(question?.difficulty || "").trim().toLowerCase();
}

export function getReviewMistakeDifficultyLabel(question = {}, { formatDifficultyLabel = (value) => String(value || "") } = {}) {
  return formatDifficultyLabel(getReviewMistakeDifficultyValue(question));
}

export function getReviewMistakeFilterOptions(
  entries = [],
  { getTopicNameById = () => "", formatDifficultyLabel = (value) => String(value || "") } = {},
) {
  const topicMap = new Map();
  const subcategorySet = new Set();
  const difficultySet = new Set();

  entries.forEach((entry) => {
    const question = entry?.question || {};
    const topicKey = getReviewMistakeTopicKey(entry);
    const topicLabel = getReviewMistakeTopicLabel(entry, { getTopicNameById });
    if (topicKey && topicLabel && !topicMap.has(topicKey)) {
      topicMap.set(topicKey, topicLabel);
    }

    const subcategory = getReviewMistakeSubcategoryLabel(question);
    if (subcategory) {
      subcategorySet.add(subcategory);
    }

    const difficulty = getReviewMistakeDifficultyValue(question);
    if (difficulty) {
      difficultySet.add(difficulty);
    }
  });

  return {
    topics: Array.from(topicMap.entries())
      .sort((left, right) => left[1].localeCompare(right[1]))
      .map(([value, label]) => ({ value, label })),
    subcategories: Array.from(subcategorySet)
      .sort((left, right) => left.localeCompare(right))
      .map((value) => ({ value, label: value })),
    difficulties: Array.from(difficultySet)
      .sort((left, right) => left.localeCompare(right))
      .map((value) => ({ value, label: formatDifficultyLabel(value) || value })),
  };
}

export function applyReviewMistakeFilters(entries = [], filters = {}) {
  const activeFilters = {
    topic: String(filters?.topic || "all"),
    subcategory: String(filters?.subcategory || "all"),
    difficulty: String(filters?.difficulty || "all"),
  };

  return entries.filter((entry) => {
    const question = entry?.question || {};
    if (activeFilters.topic !== "all" && getReviewMistakeTopicKey(entry) !== activeFilters.topic) {
      return false;
    }
    if (
      activeFilters.subcategory !== "all" &&
      getReviewMistakeSubcategoryLabel(question) !== activeFilters.subcategory
    ) {
      return false;
    }
    if (
      activeFilters.difficulty !== "all" &&
      getReviewMistakeDifficultyValue(question) !== activeFilters.difficulty
    ) {
      return false;
    }
    return true;
  });
}

export function renderReviewMistakeInlineMarkdown(
  text,
  { fallback = "", parseMarkdown = (value) => `<p>${String(value || "")}</p>` } = {},
) {
  const value = String(text || fallback || "").trim() || String(fallback || "").trim();
  return String(parseMarkdown(value || ""))
    .replace(/^<p>/, "")
    .replace(/<\/p>$/, "");
}

export function getReviewMistakeOptionPresentation(
  question = {},
  answerIndex = null,
  { parseMarkdown = (value) => `<p>${String(value || "")}</p>` } = {},
) {
  const normalizedIndex = Number(answerIndex);
  const options = Array.isArray(question?.options) ? question.options : [];
  if (!Number.isInteger(normalizedIndex) || normalizedIndex < 0 || normalizedIndex >= options.length) {
    return {
      text: "Answer choice unavailable.",
      html: "<p>Answer choice unavailable.</p>",
    };
  }
  const optionLetter = String.fromCharCode(65 + normalizedIndex);
  const optionText = String(options[normalizedIndex] || "").trim();
  const text = optionText ? `Option ${optionLetter} - ${optionText}` : `Option ${optionLetter}`;
  return {
    text,
    html: parseMarkdown(text),
  };
}

export function getReviewMistakePreviousResponse(
  entry,
  { parseMarkdown = (value) => `<p>${String(value || "")}</p>` } = {},
) {
  const question = entry?.question || {};
  const wasUnanswered = String(entry?.lastOutcome || "").trim().toLowerCase() === "unanswered";
  if (wasUnanswered) {
    return {
      title: "Previous Response",
      html: "<p>This question was left unanswered in a prior session.</p>",
    };
  }

  if (!Number.isInteger(entry?.lastUserAnswerIndex)) {
    return {
      title: "Previous Response",
      html: "<p>This miss was saved before answer capture was added, so only the question is available.</p>",
    };
  }

  return {
    title: "Previous Response",
    html: getReviewMistakeOptionPresentation(question, entry.lastUserAnswerIndex, { parseMarkdown }).html,
  };
}

export function renderReviewMistakesEmptyState(
  { title, body, primaryAction, secondaryAction = null },
  { escapeHtml = (value) => String(value || "") } = {},
) {
  const actions = [primaryAction, secondaryAction]
    .filter(Boolean)
    .map(
      (action) => `
        <button
          class="btn ${escapeHtml(action.variant || "btn-secondary") }"
          data-review-action="${escapeHtml(action.action)}"
          type="button"
        >${escapeHtml(action.label)}</button>
      `,
    )
    .join("");

  return `
    <article class="mistake-item review-mistake-card review-mistakes-empty review-mistake-case review-mistake-case-primary">
      <p class="eyebrow">Review Queue</p>
      <h3>${escapeHtml(title)}</h3>
      <p>${escapeHtml(body)}</p>
      <div class="button-row compact-actions review-mistake-actions">
        ${actions}
      </div>
    </article>
  `;
}
