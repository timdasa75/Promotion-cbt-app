// Admin "Question Bank" panel (V1 of docs/question-bank-management.md).
//
// Read-only browsing reuses the same entitlement-scoped content endpoint the
// quiz uses (admins resolve to premium limits, so nothing is truncated) but
// calls it directly to bypass the client-side topic cache, which would
// otherwise serve pre-edit content after a save. Overlay state comes from the
// adminQuestionEdits route; saves go to adminSaveQuestionEdit, which
// validates, upserts the overlay row, and bumps the topic's content version
// so the edge cache serves the fix on the user's next topic load.

import { getTopics, loadData } from "./data.js";
import { requestCloudflareAuth } from "./authCloudflareClient.js";
import { readSession } from "./authStorage.js";
import { collectSubcategories, getQuestionsFromSubcategory } from "./topicDataShape.js";
import { escapeHtml } from "./quiz/formatting.js";
import { showError, showSuccess, showWarning } from "./ui/notifications.js";
import {
  QUESTION_BANK_DIFFICULTY_VALUES as DIFFICULTY_VALUES,
  QUESTION_BANK_LIST_RENDER_LIMIT as LIST_RENDER_LIMIT,
  filterQuestionBankQuestions,
  normalizeQuestionBankFormValues,
} from "./adminQuestionBankModel.js";

const questionBankState = {
  initialized: false,
  topicsReady: false,
  activeTopicId: "",
  activeTopicName: "",
  questions: new Map(), // questionId -> { question, subcategoryId, subcategoryName }
  overlayByQuestionId: new Map(), // questionId -> overlay row (payload already merged server-side)
  version: 1,
  staticQuestionCount: 0,
  query: "",
  subcategoryFilter: "all",
  editingQuestionId: "",
  pendingFeedback: null, // { feedbackId, replyDraft }
  loadInFlight: null,
};

// --- DOM helpers ------------------------------------------------------------

function getEl(id) {
  return document.getElementById(id);
}

function requireSession() {
  const session = readSession();
  if (!session?.accessToken) {
    throw new Error("Session unavailable. Please log in again.");
  }
  return session;
}

// The Worker answers an unknown path with a bare 404 "Route not found.", which
// is what the admin sees when the frontend is deployed ahead of the Worker (the
// bank routes are the newest ones). Translate that server string into something
// actionable instead of surfacing it verbatim.
export function describeBankError(error, fallback) {
  const message = String(error?.message || "").trim();
  const isMissingRoute = Number(error?.httpStatus) === 404 || /route not found/i.test(message);
  if (isMissingRoute) {
    return "The admin server does not recognise the question bank routes yet. Redeploy the Worker from workers/admin-bridge/, then try again.";
  }
  return message || fallback;
}

async function ensureTopics() {
  if (questionBankState.topicsReady && getTopics().length) return;
  if (!getTopics().length) {
    await loadData();
  }
  questionBankState.topicsReady = true;
}

function fillTopicSelector() {
  const select = getEl("qbTopicSelect");
  if (!select) return;
  ensureTopics();
  const topics = getTopics();
  const currentValue = String(select?.value || "").trim();
  select.innerHTML = topics
    .map((topic) => `<option value="${escapeHtml(topic.id)}">${escapeHtml(topic.name || topic.id)}</option>`)
    .join("");
  // Re-select the active topic if it still exists; otherwise keep whatever
  // the user had chosen (or fall back to the first topic the app shipped).
  if (questionBankState.activeTopicId && topics.some((topic) => String(topic.id) === questionBankState.activeTopicId)) {
    select.value = questionBankState.activeTopicId;
  } else if (!currentValue && topics.length) {
    select.value = String(topics[0].id);
  }
}

async function loadQuestionBankTopic(topicId) {
  if (questionBankState.loadInFlight) return questionBankState.loadInFlight;
  questionBankState.loadInFlight = (async () => {
    const session = requireSession();
    // Direct call (not fetchTopicDataFiles) to bypass the client topic cache:
    // after a save the cached payload would otherwise show stale content.
    const [content, meta] = await Promise.all([
      requestCloudflareAuth("content/topic-data", {
        accessToken: session.accessToken,
        body: { topicId },
      }),
      requestCloudflareAuth("adminQuestionEdits", {
        accessToken: session.accessToken,
        body: { topicId },
      }),
    ]);

    const questions = new Map();
    const subcategories = [];
    for (const payload of Array.isArray(content?.payloads) ? content.payloads : []) {
      for (const subcategory of collectSubcategories(payload)) {
        subcategories.push({
          id: subcategory?.id || "",
          name: subcategory?.name || subcategory?.id || "",
        });
        for (const question of getQuestionsFromSubcategory(subcategory)) {
          const id = String(question?.id || "").trim();
          if (!id) continue;
          questions.set(id, {
            question,
            subcategoryId: subcategory?.id || "",
            subcategoryName: subcategory?.name || subcategory?.id || "",
          });
        }
      }
    }

    questionBankState.activeTopicId = topicId;
    questionBankState.activeTopicName = meta?.topicName || topicId;
    questionBankState.questions = questions;
    questionBankState.subcategories = subcategories;
    questionBankState.staticQuestionCount = Number(meta?.staticQuestionCount || questions.size);
    questionBankState.version = Number(meta?.version || 1);
    questionBankState.overlayByQuestionId = new Map(
      (Array.isArray(meta?.edits) ? meta.edits : [])
        .filter((row) => String(row?.status || "active") === "active" && row?.question_id)
        .map((row) => [String(row.question_id), row]),
    );
    questionBankState.subcategoryFilter = "all";
    questionBankState.editingQuestionId = "";
  })();
  try {
    await questionBankState.loadInFlight;
  } finally {
    questionBankState.loadInFlight = null;
  }
}

// --- Rendering ---------------------------------------------------------------

function renderSummary() {
  const summary = getEl("qbSummary");
  if (!summary) return;
  const editedCount = questionBankState.overlayByQuestionId.size;
  summary.textContent = questionBankState.activeTopicId
    ? `${questionBankState.questions.size} questions · ${editedCount} overlay edit${editedCount === 1 ? "" : "s"} · content v${questionBankState.version}`
    : "Select a topic to browse its question bank.";
}

function renderQuestionList() {
  const list = getEl("qbQuestionList");
  if (!list) return;
  list.innerHTML = "";
  if (!questionBankState.activeTopicId) {
    list.innerHTML = `<p class="meta">Choose a topic above to inspect its questions.</p>`;
    return;
  }

  const items = filterQuestionBankQuestions({
    questions: questionBankState.questions,
    query: questionBankState.query,
    subcategoryFilter: questionBankState.subcategoryFilter,
  });

  const total = questionBankState.questions.size;
  if (!items.length) {
    list.innerHTML = `<p class="meta">No questions match the current filters.</p>`;
    return;
  }

  const fragment = document.createDocumentFragment();
  for (const entry of items) {
    const overlay = questionBankState.overlayByQuestionId.get(entry.questionId);
    const card = document.createElement("article");
    card.className = "admin-feedback-item qb-question-row";
    const stem = String(entry.question?.question || "");
    const statusBadge = String(entry.question?.reviewStatus || "") === "needs_review"
      ? `<span class="admin-badge warn">needs review</span>`
      : "";
    card.innerHTML = `
      <div class="qb-question-row-head">
        <span class="chip">${escapeHtml(entry.subcategoryName || entry.subcategoryId || "")}</span>
        <code class="qb-question-id">${escapeHtml(entry.questionId)}</code>
        ${overlay ? `<span class="admin-badge neutral" title="Served from the admin overlay until canonized into the static bank">edited</span>` : ""}
        ${statusBadge}
      </div>
      <p class="qb-question-stem">${escapeHtml(stem.length > 220 ? `${stem.slice(0, 220)}…` : stem)}</p>
      <div class="qb-question-row-actions">
        <button class="btn btn-ghost btn-sm qb-edit-btn" data-question-id="${escapeHtml(entry.questionId)}" type="button">Edit</button>
        ${overlay ? `<button class="btn btn-ghost btn-sm qb-revert-btn" data-question-id="${escapeHtml(entry.questionId)}" type="button">Revert</button>` : ""}
      </div>`;
    fragment.appendChild(card);
  }
  list.appendChild(fragment);
  if (items.length >= LIST_RENDER_LIMIT && total > LIST_RENDER_LIMIT) {
    const note = document.createElement("p");
    note.className = "meta";
    note.textContent = `Showing the first ${LIST_RENDER_LIMIT} matches — refine the search to see more.`;
    list.appendChild(note);
  }
}

function collectEditorForm() {
  return {
    question: getEl("qbEditStem")?.value || "",
    options: Array.from(document.querySelectorAll(".qb-option-input")).map((input) => input.value),
    correct: Number(getEl("qbEditCorrect")?.value || "0"),
    explanation: getEl("qbEditExplanation")?.value || "",
    difficulty: getEl("qbEditDifficulty")?.value || "medium",
    reviewStatus: getEl("qbEditReviewStatus")?.value || "approved",
  };
}

function renderEditorErrors(errors) {
  const box = getEl("qbEditErrors");
  if (!box) return;
  if (!errors.length) {
    box.classList.add("hidden");
    box.innerHTML = "";
    return;
  }
  box.classList.remove("hidden");
  box.innerHTML = errors.map((error) => `<p>${escapeHtml(error)}</p>`).join("");
}

function openEditor(questionId) {
  const entry = questionBankState.questions.get(questionId);
  if (!entry) return;
  questionBankState.editingQuestionId = questionId;
  const question = entry.question || {};
  const wrapper = getEl("qbEditorWrapper");
  if (!wrapper) return;

  const overlay = questionBankState.overlayByQuestionId.get(questionId);
  const feedbackNotice = questionBankState.pendingFeedback
    ? `<p class="inline-warning">Opened from feedback <code>${escapeHtml(questionBankState.pendingFeedback.feedbackId)}</code> — saving can auto-resolve it.</p>`
    : overlay
      ? `<p class="meta">This question has an active overlay edit${overlay.edited_by ? ` by ${escapeHtml(overlay.edited_by)}` : ""}${overlay.updated_at ? ` at ${escapeHtml(overlay.updated_at)}` : ""}. Saving replaces it; Revert restores the static bank.</p>`
      : "";

  const optionsHtml = (Array.isArray(question.options) ? question.options : [])
    .map((option, index) => `
      <div class="qb-option-row">
        <label class="qb-option-correct">
          <input type="radio" name="qbCorrectOption" value="${index}" ${index === Number(question.correct) ? "checked" : ""} />
          <span class="meta">Correct</span>
        </label>
        <input class="qb-option-input" type="text" value="${escapeHtml(option)}" aria-label="Option ${index + 1}" />
      </div>`)
    .join("");

  wrapper.innerHTML = `
    <div class="qb-editor">
      <div class="admin-card-head">
        <h4>Edit question <code>${escapeHtml(questionId)}</code></h4>
        <button class="btn btn-ghost btn-sm" id="qbEditCancelBtn" type="button">Cancel</button>
      </div>
      ${feedbackNotice}
      <div class="inline-error hidden" id="qbEditErrors"></div>
      <label class="qb-field">
        <span class="meta">Question stem</span>
        <textarea id="qbEditStem" rows="3">${escapeHtml(question.question || "")}</textarea>
      </label>
      <div class="qb-field">
        <span class="meta">Answer options (option count is locked to protect the scramble manifest)</span>
        <div class="qb-options">${optionsHtml}</div>
      </div>
      <div class="qb-field">
        <span class="meta">Explanation</span>
        <textarea id="qbEditExplanation" rows="4">${escapeHtml(question.explanation || "")}</textarea>
      </div>
      <div class="qb-toolbar-row">
        <label class="qb-field qb-field-inline">
          <span class="meta">Difficulty</span>
          <select id="qbEditDifficulty">
            ${DIFFICULTY_VALUES.map((value) => `<option value="${value}" ${value === String(question.difficulty || "medium") ? "selected" : ""}>${value}</option>`).join("")}
          </select>
        </label>
        <label class="qb-field qb-field-inline">
          <span class="meta">Review status</span>
          <select id="qbEditReviewStatus">
            <option value="approved" ${String(question.reviewStatus || "approved") === "approved" ? "selected" : ""}>approved</option>
            <option value="needs_review" ${String(question.reviewStatus) === "needs_review" ? "selected" : ""}>needs_review</option>
          </select>
        </label>
      </div>
      ${questionBankState.pendingFeedback ? `
      <label class="qb-field">
        <span class="meta">Feedback reply (stored on the submission; the user sees it on their profile)</span>
        <textarea id="qbEditFeedbackReply" rows="2">${escapeHtml(questionBankState.pendingFeedback.replyDraft || "")}</textarea>
      </label>
      <label class="qb-check">
        <input type="checkbox" id="qbEditResolveFeedback" checked />
        <span>Resolve the feedback submission after saving</span>
      </label>` : ""}
      <div class="qb-editor-actions">
        <button class="btn btn-primary btn-sm" id="qbEditSaveBtn" type="button">Save edit</button>
      </div>
    </div>`;
  wrapper.classList.remove("hidden");
  getEl("qbEditStem")?.focus();

  getEl("qbEditCancelBtn")?.addEventListener("click", () => closeEditor());
  getEl("qbEditSaveBtn")?.addEventListener("click", () => {
    saveEditor(questionId).catch((error) => showError(describeBankError(error, "Failed to save the question edit.")));
  });
}

function closeEditor() {
  questionBankState.editingQuestionId = "";
  const wrapper = getEl("qbEditorWrapper");
  if (wrapper) {
    wrapper.innerHTML = "";
    wrapper.classList.add("hidden");
  }
}

async function saveEditor(questionId) {
  const entry = questionBankState.questions.get(questionId);
  if (!entry) return;
  const form = collectEditorForm();
  // correct is chosen by radio; collectEditorForm's select fallback is unused.
  const checked = document.querySelector('input[name="qbCorrectOption"]:checked');
  form.correct = Number(checked?.value || "0");

  const { errors, value } = normalizeQuestionBankFormValues(form, { staticQuestion: entry.question });
  renderEditorErrors(errors);
  if (errors.length) return;

  const session = requireSession();
  const feedback = questionBankState.pendingFeedback;
  const replyText = String(getEl("qbEditFeedbackReply")?.value || "").trim();
  const resolveFeedback = feedback && Boolean(getEl("qbEditResolveFeedback")?.checked);

  if (resolveFeedback && !replyText) {
    showWarning("Write the feedback reply (or untick resolve) before saving.");
    return;
  }

  await requestCloudflareAuth("adminSaveQuestionEdit", {
    accessToken: session.accessToken,
    body: {
      topicId: questionBankState.activeTopicId,
      questionId,
      question: value,
      origin: feedback ? "feedback" : "manual",
      feedbackId: feedback?.feedbackId || null,
    },
  });

  if (resolveFeedback && feedback) {
    // Reply first (stores the user-visible message), then resolve with the
    // same text as the resolution note. Emails stay flag-gated on the Worker.
    await requestCloudflareAuth("feedback/reply", {
      accessToken: session.accessToken,
      body: { feedbackId: feedback.feedbackId, reply: replyText },
    });
    await requestCloudflareAuth("feedback/status", {
      accessToken: session.accessToken,
      body: {
        feedbackId: feedback.feedbackId,
        status: "resolved",
        reviewer: session.user?.email || "",
        resolution: replyText,
      },
    });
  }

  // Optimistic local update: the saved payload IS the merged question.
  questionBankState.questions.set(questionId, {
    ...entry,
    question: { ...entry.question, ...value, id: questionId, lastReviewed: new Date().toISOString().slice(0, 10) },
  });
  questionBankState.overlayByQuestionId.set(questionId, {
    question_id: questionId,
    status: "active",
    edited_by: session.user?.email || "",
  });
  questionBankState.version += 1;
  questionBankState.pendingFeedback = null;
  closeEditor();
  renderSummary();
  renderQuestionList();
  showSuccess(`Saved. Users get the fix on their next ${questionBankState.activeTopicName} load.`);
}

async function revertQuestion(questionId) {
  const session = requireSession();
  await requestCloudflareAuth("adminRevertQuestionEdit", {
    accessToken: session.accessToken,
    body: { topicId: questionBankState.activeTopicId, questionId },
  });
  questionBankState.overlayByQuestionId.delete(questionId);
  questionBankState.version += 1;
  renderSummary();
  renderQuestionList();
  showSuccess("Reverted to the static bank content.");
}

// --- Public API ---------------------------------------------------------------

export function renderAdminQuestionBank() {
  const view = getEl("adminViewBank");
  if (!view) return;
  fillTopicSelector();
  renderSummary();
  renderQuestionList();
}

export function initializeAdminQuestionBank() {
  if (questionBankState.initialized) return;
  const view = getEl("adminViewBank");
  if (!view) return;
  questionBankState.initialized = true;

  getEl("qbTopicSelect")?.addEventListener("change", async (event) => {
    const topicId = String(event.target.value || "").trim();
    if (!topicId) return;
    try {
      await loadQuestionBankTopic(topicId);
      closeEditor();
      renderSummary();
      renderQuestionList();
    } catch (error) {
      showError(describeBankError(error, "Failed to load the question bank."));
    }
  });

  getEl("qbSearch")?.addEventListener("input", (event) => {
    questionBankState.query = String(event.target.value || "");
    renderQuestionList();
  });

  getEl("qbSubcategoryFilter")?.addEventListener("change", (event) => {
    questionBankState.subcategoryFilter = String(event.target.value || "all");
    renderQuestionList();
  });

  getEl("qbRefreshBtn")?.addEventListener("click", () => {
    if (!questionBankState.activeTopicId) return;
    loadQuestionBankTopic(questionBankState.activeTopicId)
      .then(() => {
        closeEditor();
        renderSummary();
        renderQuestionList();
      })
      .catch((error) => showError(describeBankError(error, "Failed to refresh.")));
  });

  getEl("qbQuestionList")?.addEventListener("click", (event) => {
    const editBtn = event.target.closest(".qb-edit-btn");
    if (editBtn) {
      openEditor(String(editBtn.getAttribute("data-question-id") || ""));
      return;
    }
    const revertBtn = event.target.closest(".qb-revert-btn");
    if (revertBtn) {
      revertQuestion(String(revertBtn.getAttribute("data-question-id") || "")).catch((error) => {
        showError(describeBankError(error, "Failed to revert the question edit."));
      });
    }
  });

  ensureTopics()
    .then(fillTopicSelector)
    .catch(() => {
      // Topics load failures surface through the app's normal boot path.
    });
}

// Entry point for the feedback inbox "Fix question" button: opens the bank on
// the right topic and pre-loads the editor with the flagged question.
export async function openQuestionBankEditorForFeedback({ topicId, questionId, feedbackId, replyDraft = "" } = {}) {
  const targetTopicId = String(topicId || "").trim();
  const targetQuestionId = String(questionId || "").trim();
  if (!targetTopicId || !targetQuestionId) {
    showWarning("This feedback has no linked question to fix.");
    return;
  }
  await ensureTopics();
  fillTopicSelector();
  if (questionBankState.activeTopicId !== targetTopicId) {
    await loadQuestionBankTopic(targetTopicId);
  }
  questionBankState.pendingFeedback = { feedbackId: String(feedbackId || ""), replyDraft: String(replyDraft || "") };
  renderSummary();
  renderQuestionList();
  if (!questionBankState.questions.has(targetQuestionId)) {
    showWarning(`Question ${targetQuestionId} was not found in ${questionBankState.activeTopicName || targetTopicId}.`);
    return;
  }
  openEditor(targetQuestionId);
}
