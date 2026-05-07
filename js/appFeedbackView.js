export function formatFeedbackCategoryLabel(category) {
  const value = String(category || "").trim().toLowerCase();
  if (value === "bug") return "Bug";
  if (value === "suggestion") return "Suggestion";
  if (value === "question_issue") return "Question Issue";
  return "Other";
}

export function formatFeedbackSourceLabel(source) {
  const value = String(source || "").trim().toLowerCase();
  if (value === "quiz") return "Quiz";
  if (value === "results") return "Results";
  return "Help";
}

export function formatFeedbackStatusLabel(status) {
  const value = String(status || "").trim().toLowerCase();
  if (value === "in_review") return "In Review";
  if (value === "resolved") return "Resolved";
  if (value === "dismissed") return "Dismissed";
  return "New";
}

export function formatSessionModeLabel(mode) {
  const value = String(mode || "").trim().toLowerCase();
  if (value === "practice") return "Practice";
  if (value === "exam") return "Exam";
  if (value === "review") return "Review";
  return value ? `${value.charAt(0).toUpperCase()}${value.slice(1)}` : "-";
}

export function feedbackStatusBadgeClass(status) {
  const value = String(status || "").trim().toLowerCase();
  if (value === "resolved") return "approved";
  if (value === "dismissed") return "rejected";
  if (value === "in_review") return "neutral";
  return "pending";
}

export function trimFeedbackPreview(value, limit = 180) {
  const text = String(value || "").trim();
  if (text.length <= limit) return text;
  return `${text.slice(0, Math.max(0, limit - 3)).trimEnd()}...`;
}

export function getFeedbackModalCopy(source) {
  const normalizedSource = String(source || "help").trim().toLowerCase();
  if (normalizedSource === "quiz") {
    return {
      title: "Report This Question",
      intro: "Tell us what is wrong with this question, answer, or explanation.",
    };
  }
  if (normalizedSource === "results") {
    return {
      title: "Share Session Feedback",
      intro: "Tell us what worked, what felt off, or what would improve this results flow.",
    };
  }
  return {
    title: "Send Feedback",
    intro: "Share what is working, what is unclear, or what should be improved.",
  };
}

export function buildFeedbackCharCountLabel(value = "", maxLength = 0) {
  const length = String(value || "").length;
  return `${length}/${Number(maxLength || 0)}`;
}

export function buildFeedbackContextSummaryHtml(context = null, { escapeHtml = (value) => String(value ?? "") } = {}) {
  const source = context && typeof context === "object" ? context : null;
  const contextItems = [];
  if (source?.topicName) {
    contextItems.push(`<div><span class="meta">Topic</span><strong>${escapeHtml(source.topicName)}</strong></div>`);
  }
  if (source?.questionId) {
    contextItems.push(`<div><span class="meta">Question ID</span><strong>${escapeHtml(source.questionId)}</strong></div>`);
  }
  if (source?.quizAttemptId) {
    contextItems.push(`<div><span class="meta">Session ID</span><strong>${escapeHtml(source.quizAttemptId)}</strong></div>`);
  }
  if (source?.sessionMode) {
    contextItems.push(`<div><span class="meta">Mode</span><strong>${escapeHtml(formatSessionModeLabel(source.sessionMode))}</strong></div>`);
  }

  const previewHtml = source?.questionPreview
    ? `<p class="feedback-context-preview"><strong>Question:</strong> ${escapeHtml(trimFeedbackPreview(source.questionPreview))}</p>`
    : "";
  const scoreSummaryHtml = source?.scoreSummary
    ? `<p class="feedback-context-preview"><strong>Summary:</strong> ${escapeHtml(trimFeedbackPreview(source.scoreSummary))}</p>`
    : "";

  if (!contextItems.length && !previewHtml && !scoreSummaryHtml) {
    return "";
  }

  return `
    <div class="feedback-context-grid">
      ${contextItems.join("")}
    </div>
    ${previewHtml}
    ${scoreSummaryHtml}
  `;
}
