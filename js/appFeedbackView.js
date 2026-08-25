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

export function formatFeedbackDifficultyLabel(difficulty) {
  const value = String(difficulty || "").trim().toLowerCase();
  if (value === "easy") return "Easy";
  if (value === "medium") return "Medium";
  if (value === "hard") return "Hard";
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : "";
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
  if (source?.difficulty) {
    contextItems.push(`<div><span class="meta">Difficulty</span><strong>${escapeHtml(formatFeedbackDifficultyLabel(source.difficulty))}</strong></div>`);
  }
  const sourceMetaParts = [
    String(source?.sourceDocument || "").trim(),
    String(source?.sourceSection || "").trim(),
  ].filter(Boolean);
  if (sourceMetaParts.length) {
    contextItems.push(`<div><span class="meta">Source</span><strong>${escapeHtml(sourceMetaParts.join(" · "))}</strong></div>`);
  }
  if (source?.subcategoryName) {
    contextItems.push(`<div><span class="meta">Subcategory</span><strong>${escapeHtml(source.subcategoryName)}</strong></div>`);
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

export function buildFeedbackAccessUiModel(access = {}) {
  const allowed = Boolean(access?.allowed);
  const message = String(access?.message || "").trim();
  return {
    buttonDisabled: !allowed,
    buttonAriaDisabled: String(!allowed),
    buttonTitle: allowed ? "Send feedback" : message,
    helpNoteHidden: allowed,
    helpNoteText: allowed ? "" : message,
    quizHidden: !allowed,
    resultsHidden: !allowed,
    shouldCloseModal: !allowed,
  };
}

export function filterAdminFeedbackSubmissions(submissions = [], { query = "", status = "all", category = "all", source = "all" } = {}) {
  const normalizedQuery = String(query || "").trim().toLowerCase();
  const normalizedStatus = String(status || "all").trim().toLowerCase();
  const normalizedCategory = String(category || "all").trim().toLowerCase();
  const normalizedSource = String(source || "all").trim().toLowerCase();
  return (Array.isArray(submissions) ? submissions : []).filter((entry) => {
    const matchesStatus = normalizedStatus === "all" || String(entry?.status || "").toLowerCase() === normalizedStatus;
    const matchesCategory = normalizedCategory === "all" || String(entry?.category || "").toLowerCase() === normalizedCategory;
    const matchesSource = normalizedSource === "all" || String(entry?.sourceScreen || "").toLowerCase() === normalizedSource;
    if (!matchesStatus || !matchesCategory || !matchesSource) return false;
    if (!normalizedQuery) return true;
    return [
      entry?.email,
      entry?.message,
      entry?.topicName,
      entry?.topicId,
      entry?.questionId,
      entry?.quizAttemptId,
    ].some((value) => String(value || "").toLowerCase().includes(normalizedQuery));
  });
}

export function buildAdminFeedbackEmptyState(totalCount = 0) {
  return totalCount > 0 ? "No feedback matches the current filter." : "No feedback submitted yet.";
}

export function buildAdminFeedbackStatusMessage(nextStatus) {
  return `Feedback marked as ${formatFeedbackStatusLabel(nextStatus)}.`;
}

export function buildAdminFeedbackItemModel(entry = {}, {
  formatDateTime = () => "-",
  formatRelativeTime = () => "",
  escapeHtml = (value) => String(value ?? ""),
} = {}) {
  const safeId = escapeHtml(entry?.feedbackId || "");
  const safeEmail = escapeHtml(entry?.email || "-");
  const safeMessage = escapeHtml(entry?.message || "");
  const createdLabel = escapeHtml(formatDateTime(entry?.createdAt));
  const relativeLabel = escapeHtml(formatRelativeTime(entry?.createdAt) || createdLabel);
  const reviewedLabel = entry?.reviewedAt
    ? `${escapeHtml(formatDateTime(entry.reviewedAt))}${entry?.reviewedBy ? ` by ${escapeHtml(entry.reviewedBy)}` : ""}`
    : "Not reviewed yet";
  const contextChips = [];
  if (entry?.topicName) contextChips.push(`<span class="chip">Topic: ${escapeHtml(entry.topicName)}</span>`);
  if (entry?.questionId) contextChips.push(`<span class="chip">Question ID: ${escapeHtml(entry.questionId)}</span>`);
  if (entry?.quizAttemptId) contextChips.push(`<span class="chip">Session ID: ${escapeHtml(entry.quizAttemptId)}</span>`);
  if (entry?.sessionMode) contextChips.push(`<span class="chip">Mode: ${escapeHtml(formatSessionModeLabel(entry.sessionMode))}</span>`);
  if (entry?.difficulty) contextChips.push(`<span class="chip">Difficulty: ${escapeHtml(formatFeedbackDifficultyLabel(entry.difficulty))}</span>`);
  if (entry?.subcategoryName) contextChips.push(`<span class="chip">${escapeHtml(entry.subcategoryName)}</span>`);
  const sourceMetaParts = [
    String(entry?.sourceDocument || "").trim(),
    String(entry?.sourceSection || "").trim(),
  ].filter(Boolean);
  if (sourceMetaParts.length) {
    contextChips.push(`<span class="chip">Source: ${escapeHtml(sourceMetaParts.join(" · "))}</span>`);
  }
  const clientInfo = entry?.clientInfo && typeof entry.clientInfo === "object" ? entry.clientInfo : {};
  const clientParts = [
    String(clientInfo.provider || "").trim(),
    String(clientInfo.plan || "").trim(),
    String(clientInfo.viewport || "").trim(),
  ].filter(Boolean);
  const clientInfoLine = clientParts.length
    ? `<p class="admin-feedback-client-info" title="${escapeHtml(String(clientInfo.userAgent || ""))}">${escapeHtml(clientParts.join(" · "))}</p>`
    : "";
  const previewLine = entry?.questionPreview
    ? `<p class="admin-feedback-preview admin-feedback-message-truncate" title="${escapeHtml(entry.questionPreview)}">${escapeHtml(entry.questionPreview)}</p>`
    : "";
  const scoreLine = entry?.scoreSummary
    ? `<p class="admin-feedback-score">${escapeHtml(entry.scoreSummary)}</p>`
    : "";
  return {
    feedbackId: String(entry?.feedbackId || ""),
    html: `
      <div class="admin-feedback-row">
        <div class="admin-feedback-title-wrap">
          <h4 class="admin-feedback-title">${safeEmail}</h4>
          <p class="meta">${relativeLabel}</p>
        </div>
        <div class="admin-user-badges">
          <span class="admin-badge ${feedbackStatusBadgeClass(entry?.status)}">Status: ${escapeHtml(formatFeedbackStatusLabel(entry?.status))}</span>
          <span class="admin-badge neutral">Category: ${escapeHtml(formatFeedbackCategoryLabel(entry?.category))}</span>
          <span class="admin-badge neutral">Source: ${escapeHtml(formatFeedbackSourceLabel(entry?.sourceScreen))}</span>
        </div>
        <div class="admin-feedback-meta" title="${reviewedLabel}">${reviewedLabel}</div>
        <div class="button-row compact-actions admin-feedback-actions">
          <button class="btn btn-ghost btn-sm" data-feedback-id="${safeId}" data-feedback-status="in_review" type="button" ${entry?.status === "in_review" ? 'disabled aria-disabled="true"' : ""}>Mark In Review</button>
          <button class="btn btn-ghost btn-sm" data-feedback-id="${safeId}" data-feedback-status="resolved" type="button" ${entry?.status === "resolved" ? 'disabled aria-disabled="true"' : ""}>Resolve</button>
          <button class="btn btn-ghost btn-sm" data-feedback-id="${safeId}" data-feedback-status="dismissed" type="button" ${entry?.status === "dismissed" ? 'disabled aria-disabled="true"' : ""}>Dismiss</button>
        </div>
      </div>
      <p class="admin-feedback-message admin-feedback-message-truncate" title="${safeMessage}">${safeMessage}</p>
      ${previewLine}
      ${scoreLine}
      ${contextChips.length ? `<div class="chip-row admin-feedback-context-row">${contextChips.join("")}</div>` : ""}
      ${clientInfoLine}
      <div class="admin-feedback-reply-section">
        <textarea class="admin-feedback-reply-input" placeholder="Reply to this feedback..." rows="2" data-feedback-id="${safeId}"></textarea>
        <button class="btn btn-primary btn-sm admin-feedback-reply-btn" data-feedback-id="${safeId}" type="button">Send Reply</button>
      </div>
    `,
  };
}
