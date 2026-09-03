// ui.js - Module for UI management

import {
  countQuestionsFromTopicData,
  collectSubcategories,
  extractQuestionsByCategory,
  fetchTopicDataFilesWithReport,
  getQuestionsFromSubcategory,
} from "./topicSources.js";
import {
  getExamTemplateById,
  getTopicQuestionCounts,
  getTotalQuestionCountForTopic,
  getVisibleExamTemplates,
} from "./data.js";
import { DEFAULT_MOCK_EXAM_TEMPLATE_ID } from "./mockExamTemplates.js";
import { normalizeStudyFilters, summarizeStudyFilterOptions } from "./studyFilters.js";
import {
  getAccessibleTopics,
  getCurrentEntitlement,
  getFreeMockExamEligibility,
  isAuthenticated,
} from "./auth.js";
import { getPaymentProvider } from "./authRuntime.js";
import { debugLog } from "./logger.js";
import { escapeHtml } from "./quiz/formatting.js";
import {
  buildStatePanelHtml,
  resolveQuestionCountDisplay,
  resolveUsedCapNote,
} from "./controlStates.js";
import { showError, showSuccess, showWarning } from "./ui/notifications.js";
import {
  initializeScreenAccessibility,
  initializeScreenRouting,
  showScreen,
} from "./ui/screen.js";

export {
  initializeScreenAccessibility,
  initializeScreenRouting,
  showScreen,
  showError,
  showSuccess,
  showWarning,
};

let confirmPromiseResolve = null;
let confirmBindingsInitialized = false;
let confirmLastFocusedElement = null;

// Stage-4 premium lock badge shared by topic and subtopic cards. The inline
// action opens the pricing modal without triggering the card's own click.
function premiumLockBadgeHtml(label = "Premium topic") {
  return `
    <span class="lock-badge premium-lock">
      <span class="state-tag">${escapeHtml(label)}</span>
      <button type="button" class="state-action" data-open-pricing>View access options</button>
    </span>`;
}

// Honest question-count footer for topic cards: plain "N Questions" when the
// number is fully usable, otherwise an available-of-total or full-bank label.
function buildQuestionCountMarkup(model, fallbackTotal) {
  const svg =
    '<svg class="icon-nudge-right" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>';
  if (!model) {
    return `<div class="question-count">${svg}<strong>${fallbackTotal}</strong> Questions</div>`;
  }
  const titleAttr = model.title ? ` title="${escapeHtml(model.title)}"` : "";
  return `<div class="question-count"${titleAttr}>${svg}<strong>${escapeHtml(model.strong)}</strong> ${escapeHtml(model.tail)}</div>`;
}

function buildCategoryCountMarkup(model, fallbackTotal) {
  if (!model) {
    return `<div class="question-count"><strong>${fallbackTotal}</strong> Questions</div>`;
  }
  const titleAttr = model.title ? ` title="${escapeHtml(model.title)}"` : "";
  return `<div class="question-count"${titleAttr}><strong>${escapeHtml(model.strong)}</strong> ${escapeHtml(model.tail)}</div>`;
}

export function openPricingModal() {
  const modal = document.getElementById("pricingModal");
  if (!modal) return;
  // Reflect the active payment provider on the select-plan button label so the
  // UI never names a provider the click handler won't use.
  const selectBtn = modal.querySelector(".select-plan-btn");
  if (selectBtn) {
    selectBtn.textContent =
      getPaymentProvider() === "flutterwave"
        ? "Pay Monthly via Flutterwave"
        : "Pay Monthly on Selar";
  }
  modal.classList.remove("hidden");
}

function getConfirmModalElements() {
  return {
    modal: document.getElementById("confirmModal"),
    titleEl: document.getElementById("confirmTitle"),
    messageEl: document.getElementById("confirmMessage"),
    okBtn: document.getElementById("confirmOkBtn"),
    cancelBtn: document.getElementById("confirmCancelBtn"),
  };
}

function initializeConfirmBindings() {
  if (confirmBindingsInitialized) return;

  const { modal, okBtn, cancelBtn } = getConfirmModalElements();
  if (!modal || !okBtn || !cancelBtn) return;

  okBtn.addEventListener("click", () => closeConfirm(true));
  cancelBtn.addEventListener("click", () => closeConfirm(false));
  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeConfirm(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !modal.classList.contains("hidden")) {
      closeConfirm(false);
    }
  });

  confirmBindingsInitialized = true;
}

export function showConfirm({ title, message, okText = "Confirm", cancelText = "Cancel" }) {
  const { modal, titleEl, messageEl, okBtn, cancelBtn } = getConfirmModalElements();

  if (!modal || !titleEl || !messageEl || !okBtn || !cancelBtn) {
    return Promise.resolve(window.confirm(message));
  }

  initializeConfirmBindings();

  if (confirmPromiseResolve) {
    const resolvePending = confirmPromiseResolve;
    confirmPromiseResolve = null;
    resolvePending(false);
  }

  confirmLastFocusedElement =
    document.activeElement instanceof HTMLElement ? document.activeElement : null;

  titleEl.textContent = title;
  messageEl.textContent = message;
  okBtn.textContent = okText;
  cancelBtn.textContent = cancelText;

  modal.classList.remove("hidden");
  okBtn.focus();

  return new Promise((resolve) => {
    confirmPromiseResolve = resolve;
  });
}

export function closeConfirm(result = false) {
  const { modal } = getConfirmModalElements();
  if (modal) modal.classList.add("hidden");
  if (confirmPromiseResolve) {
    const resolvePending = confirmPromiseResolve;
    confirmPromiseResolve = null;
    resolvePending(Boolean(result));
  }
  confirmLastFocusedElement?.focus?.();
  confirmLastFocusedElement = null;
}


function clearStudyFiltersForTopic(topic) {
  if (!topic || typeof topic !== "object") return;
  topic.availableStudyFilters = null;
  topic.studyFilters = normalizeStudyFilters(topic?.studyFilters);
}

function attachStudyFiltersToTopic(topic, topicDataFiles = []) {
  if (!topic || typeof topic !== "object") return;

  const extractionOptions = {
    allowedCategoryIds:
      Array.isArray(topic.allowedCategoryIds) && topic.allowedCategoryIds.length
        ? topic.allowedCategoryIds
        : null,
    maxQuestionsPerSubcategory:
      typeof topic.entitlement?.maxQuestionsPerSubcategory === "number"
        ? topic.entitlement.maxQuestionsPerSubcategory
        : null,
  };
  const selectedCategory = String(topic.selectedCategory || "all");
  const questions = [];

  topicDataFiles.forEach((topicData) => {
    questions.push(...extractQuestionsByCategory(topicData, selectedCategory, extractionOptions));
  });

  const availableStudyFilters = summarizeStudyFilterOptions(questions, {
    currentFilters: topic.studyFilters,
    defaultQuestionCount: 40,
  });

  topic.availableStudyFilters = availableStudyFilters;
  topic.studyFilters = availableStudyFilters.defaults;
}


function formatShortDate(iso) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getMockExamTemplatesForFeature() {
  const templates = getVisibleExamTemplates();
  if (templates.length) {
    return templates;
  }

  const fallback = getExamTemplateById(DEFAULT_MOCK_EXAM_TEMPLATE_ID);
  if (fallback) {
    return [fallback];
  }

  return [
    {
      id: DEFAULT_MOCK_EXAM_TEMPLATE_ID,
      name: "General Mock",
      glBand: "general",
      totalQuestions: 40,
    },
  ];
}

function getMockShortcutLabel(template) {
  const name = String(template?.name || "").trim();
  if (!name) return "General";
  return name.replace(/\s+Mock$/i, "");
}
function notifySessionSetupReady(topic) {
  document.dispatchEvent(
    new CustomEvent("sessionsetupchange", {
      detail: { topic },
    }),
  );
}
function getSessionSetupCopy(topic) {
  const topicName = String(topic?.name || "this topic").trim() || "this topic";
  const isMockExam = topic?.id === "mock_exam" || topic?.type === "mock_exam";

  if (isMockExam) {
    return {
      title: "Directorate Mock Setup",
      description: "Choose the profile for this timed mock.",
      selectedName: topicName,
    };
  }

  return {
    title: "Session Setup",
    description: "Choose how you want to study " + topicName + ".",
    selectedName: topicName,
  };
}

export function applySessionSetupCopy(topic) {
  const quizTitle = document.getElementById("modeQuizTitle");
  const quizDescription = document.getElementById("modeQuizDescription");
  const selectedTopicName = document.getElementById("selectedTopicName");
  const copy = getSessionSetupCopy(topic);

  if (quizTitle) quizTitle.textContent = copy.title;
  if (selectedTopicName) selectedTopicName.textContent = copy.selectedName;
  if (quizDescription && selectedTopicName) {
    const textBefore = quizDescription.firstChild;
    const textAfter = selectedTopicName.nextSibling;
    if (textBefore && textBefore.nodeType === Node.TEXT_NODE) {
      textBefore.textContent = copy.description.substring(0, copy.description.indexOf(copy.selectedName));
    }
    if (textAfter && textAfter.nodeType === Node.TEXT_NODE) {
      const indexAfterName = copy.description.indexOf(copy.selectedName) + copy.selectedName.length;
      textAfter.textContent = copy.description.substring(indexAfterName);
    }
  } else if (quizDescription) {
    quizDescription.textContent = copy.description;
  }
}
// Display categories for a topic
export async function displayCategories(topic, onSelect) {
  const categoryList = document.getElementById("categoryList");
  let unlockedSubcategories = [];
  if (!categoryList) {
    console.error("Category list container not found");
    return;
  }

  categoryList.innerHTML = buildStatePanelHtml({ tone: "loading", text: "Loading categories…" });

  try {
    const sourceLoadResult = await fetchTopicDataFilesWithReport(topic, {
      tolerateFailures: true,
    });

    const { payloads: topicDataFiles, failedFiles, totalFiles } = sourceLoadResult;

    if (failedFiles.length > 0) {
      showWarning(`Some topic sources could not be loaded (${totalFiles - failedFiles.length}/${totalFiles} available).`);
    }

    if (!topicDataFiles.length) {
      throw new Error("No topic data sources could be loaded.");
    }

    categoryList.innerHTML = "";

    if (failedFiles.length > 0) {
      const warning = document.createElement("div");
      warning.className = "warning-message inline-warning";
      warning.textContent = `Some content sources are unavailable for now (${totalFiles - failedFiles.length}/${totalFiles} loaded).`;
      categoryList.appendChild(warning);
    }

    let subcategoriesToDisplay = [];

    topicDataFiles.forEach((topicData) => {
      subcategoriesToDisplay = subcategoriesToDisplay.concat(collectSubcategories(topicData));
    });

    const entitlement = getCurrentEntitlement();
    const categoryLimit = entitlement.maxSubcategories;
    const subcategoryQuestionCap =
      typeof entitlement?.maxQuestionsPerSubcategory === "number"
        ? entitlement.maxQuestionsPerSubcategory
        : null;
    const countSubcategoryQuestions = (subcategory) =>
      getQuestionsFromSubcategory(subcategory).length;

    unlockedSubcategories =
      typeof categoryLimit === "number"
        ? subcategoriesToDisplay.slice(0, categoryLimit)
        : [...subcategoriesToDisplay];
    const unlockedCategoryIds = new Set(
      unlockedSubcategories.map((subcategory) => subcategory.id),
    );

    if (subcategoriesToDisplay.length > 0) {
      const categoryCards = await Promise.all(
        subcategoriesToDisplay.map(async (subcategory, index) => {
          const isUnlocked = unlockedCategoryIds.has(subcategory.id);
          const count = countSubcategoryQuestions(subcategory);
          const categoryCountModel = resolveQuestionCountDisplay({
            total: count,
            locked: !isUnlocked,
            cap: isUnlocked ? subcategoryQuestionCap : null,
          });
          const categoryCountMarkup = buildCategoryCountMarkup(categoryCountModel, count);

          const categoryCard = document.createElement("div");
          categoryCard.className = "topic-card ripple scale-on-hover";
          if (!isUnlocked) {
            categoryCard.classList.add("locked");
          }
          const name = subcategory.name
            .replace(/^[A-Z]\.\s/, "")
            .replace(/ \(\d+ Questions\)/, "");
          const safeIcon = escapeHtml(subcategory.icon || "\uD83D\uDCC1");
          const safeName = escapeHtml(name);
          const safeDescription = escapeHtml(
            subcategory.description || "No description available",
          );
          categoryCard.innerHTML = `
              <div class="card-content">
                  <div class="topic-icon">${safeIcon}</div>
                  <h3 class="topic-title">${safeName}</h3>
                  <p class="topic-description">${safeDescription}</p>
                  ${!isUnlocked ? premiumLockBadgeHtml("Premium subtopic") : ""}
              </div>
              <div class="card-footer">
                  ${categoryCountMarkup}
              </div>
          `;
          const categoryPricingBtn = categoryCard.querySelector(".state-action[data-open-pricing]");
          categoryPricingBtn?.addEventListener("click", (event) => {
            event.stopPropagation();
            openPricingModal();
          });
          categoryCard.addEventListener("click", () => {
            if (!isUnlocked) {
              showWarning(
                "This subtopic is locked on the Free plan. Upgrade to access all subtopics.",
              );
              return;
            }
            document
              .querySelectorAll(".topic-card")
              .forEach((card) => card.classList.remove("active"));
            categoryCard.classList.add("active");
            if (onSelect) onSelect(subcategory, unlockedSubcategories);
          });

          return categoryCard;
        }),
      );

      categoryCards.forEach((card) => categoryList.appendChild(card));

      const allCategoryCard = document.createElement("div");
      allCategoryCard.className = "topic-card ripple scale-on-hover";
      const totalQuestionsInTopic = subcategoriesToDisplay.reduce(
        (sum, entry) => sum + countSubcategoryQuestions(entry),
        0,
      );
      allCategoryCard.innerHTML = `
                <div class="card-content">
                    <div class="topic-icon">&#128218;</div>
                    <h3 class="topic-title">All Categories</h3>
                    <p class="topic-description">Practice with questions from all categories</p>
                </div>
                <div class="card-footer">
                    <div class="topic-count"><strong>${totalQuestionsInTopic}</strong> total questions in this topic</div>
                </div>
            `;
      allCategoryCard.addEventListener("click", () => {
        document
          .querySelectorAll(".topic-card")
          .forEach((card) => card.classList.remove("active"));
        allCategoryCard.classList.add("active");
        if (onSelect) onSelect({ id: "all", name: "All Categories" }, unlockedSubcategories);
      });
      categoryList.appendChild(allCategoryCard);
    } else {
      if (onSelect) onSelect({ id: "all", name: "All Questions" }, []);
    }
  } catch (error) {
    console.error("Error loading categories:", error);
    categoryList.innerHTML =
      '<div class="error-message">Failed to load categories. Please try again later.</div>';
  }

  const backToTopicBtn = document.getElementById("backToTopicBtn");
  if (backToTopicBtn) {
    backToTopicBtn.addEventListener("click", () => {
      showScreen("topicSelectionScreen");
    });
  }

  const selectAllCategoryBtn = document.getElementById("selectAllCategoryBtn");
  if (selectAllCategoryBtn) {
    selectAllCategoryBtn.addEventListener("click", () => {
      if (onSelect) onSelect({ id: "all", name: "All Categories" }, unlockedSubcategories);
    });
  }

  showScreen("categorySelectionScreen");
}

// Display available topics
export async function displayTopics(topics, onSelect) {
  debugLog("Displaying topics:", topics);
  const topicList = document.getElementById("topicList");
  const mockExamFeature = document.getElementById("mockExamFeature");
  const mockExamFeatureCard = document.getElementById("mockExamFeatureCard");
  if (!topicList) {
    console.error("Topic list container not found");
    return;
  }
  topicList.innerHTML = buildStatePanelHtml({ tone: "loading", text: "Loading topics…" });
  if (mockExamFeature) {
    mockExamFeature.innerHTML = buildStatePanelHtml({ tone: "loading", text: "Loading mock exam…" });
  }
  topicList.innerHTML = "";
  if (mockExamFeature) {
    mockExamFeature.innerHTML = "";
  }
  if (mockExamFeatureCard) {
    mockExamFeatureCard.classList.add("hidden");
  }
  if (!topics || topics.length === 0) {
    topicList.innerHTML = buildStatePanelHtml({
      tone: "error",
      text: "No topics are available right now. The content catalogue may still be deploying — please try again.",
      actionLabel: "Try again",
      actionTarget: "retry-topics",
    });
    return;
  }

  let counts = {};
  try {
    counts = await getTopicQuestionCounts(topics);
    debugLog("Question counts:", counts);
  } catch (e) {
    console.error("Error getting question counts:", e);
    topics.forEach((t) => (counts[t.id] = 0));
  }

  debugLog("Creating topic cards for", topics.length, "topics");
  const entitlement = getCurrentEntitlement();
  const topicLimit = entitlement.maxTopics;
  const perTopicQuestionCap =
    typeof entitlement?.maxSubcategories === "number" &&
    typeof entitlement?.maxQuestionsPerSubcategory === "number"
      ? entitlement.maxSubcategories * entitlement.maxQuestionsPerSubcategory
      : null;
  const unlockedTopics = getAccessibleTopics(topics);
  const unlockedTopicIds = new Set(unlockedTopics.map((topic) => topic.id));
  const freeMockExamStatus = getFreeMockExamEligibility();
  const mockTopic = topics.find((topic) => topic?.id === "mock_exam") || null;
  const studyTopics = topics.filter((topic) => topic?.id !== "mock_exam");
  const mockTemplates = getMockExamTemplatesForFeature();

  function getTopicAccessState(topic) {
    const isMockExam = topic?.id === "mock_exam";
    let isPremiumLocked = topic?.requiresPremium && entitlement.id !== "premium";
    let mockExamStatus = null;
    if (isMockExam && entitlement.id !== "premium") {
      mockExamStatus = freeMockExamStatus;
      if (mockExamStatus?.allowed) {
        isPremiumLocked = false;
      }
    }
    const mockExamEligible =
      isMockExam && entitlement.id !== "premium" && mockExamStatus?.allowed;
    let isUnlocked = unlockedTopicIds.has(topic.id) && !isPremiumLocked;
    if (mockExamEligible) {
      isUnlocked = true;
    }
    return { isMockExam, mockExamStatus, isUnlocked };
  }

  function clearSelectionState() {
    document
      .querySelectorAll(".topic-card, .mock-feature-panel")
      .forEach((card) => card.classList.remove("active"));
  }

  function attachTopicActivation(target, topic, accessState) {
    const { isMockExam, mockExamStatus, isUnlocked } = accessState;
    const defaultMockTemplateId = String(mockTemplates[0]?.id || DEFAULT_MOCK_EXAM_TEMPLATE_ID);

    const handleTopicActivation = (selectionOptions = undefined) => {
      if (!isUnlocked) {
        if (isMockExam && entitlement.id !== "premium" && mockExamStatus && !mockExamStatus.allowed) {
          const nextDate = formatShortDate(mockExamStatus.nextEligibleAt);
          showWarning(
            `Free mock exam is available weekly. Next free attempt ${nextDate ? `on ${nextDate}` : "soon"}. Upgrade for unlimited mock exams.`,
          );
        } else if (onSelect) {
          onSelect(topic, selectionOptions);
        } else {
          showWarning("This topic is locked on Free plan. Upgrade to access all topics.");
        }
        return;
      }
      clearSelectionState();
      target.classList.add("active");
      if (onSelect) {
        onSelect(topic, selectionOptions);
      }
    };

    target.addEventListener("click", () => {
      if (isMockExam) {
        handleTopicActivation({ selectedTemplateId: defaultMockTemplateId });
        return;
      }
      handleTopicActivation();
    });

    const mockExamBtn = target.querySelector(".mock-exam-cta");
    if (mockExamBtn) {
      mockExamBtn.addEventListener("click", (event) => {
        event.stopPropagation();
        handleTopicActivation({ selectedTemplateId: defaultMockTemplateId });
      });
    }

    target.querySelectorAll(".mock-template-shortcut").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        const templateId = String(button.dataset.templateId || defaultMockTemplateId);
        handleTopicActivation({ selectedTemplateId: templateId });
      });
    });
  }

  if (mockTopic && mockExamFeature && mockExamFeatureCard) {
    const accessState = getTopicAccessState(mockTopic);
    const { mockExamStatus, isUnlocked } = accessState;
    const safeName = escapeHtml(mockTopic.name || "Directorate Mock Exam");
    const safeDescription = escapeHtml(
      mockTopic.description || "Cross-topic timed simulation with General, GL 14-15, GL 15-16, and GL 16-17 profiles.",
    );
    const freeMockBadge =
      entitlement.id !== "premium" && mockExamStatus?.allowed
        ? '<span class="mock-exam-badge">Weekly Free Mock</span>'
        : "";
    let lockBadge = "";
    if (!isUnlocked) {
      if (entitlement.id !== "premium" && mockExamStatus && !mockExamStatus.allowed) {
        const nextDate = formatShortDate(mockExamStatus.nextEligibleAt);
        const usedNote = resolveUsedCapNote({
          itemLabel: "Free mock",
          nextEligibleText: nextDate ? `on ${nextDate}` : "",
        });
        lockBadge = `<span class="lock-badge used-badge"><span class="state-note-tag">${escapeHtml(usedNote.tag)}</span>${escapeHtml(usedNote.text)}</span>`;
      } else {
        lockBadge = premiumLockBadgeHtml("Premium mock");
      }
    }
    const ctaLabel = entitlement.id !== "premium"
      ? (mockExamStatus?.allowed ? "Open Weekly Mock Setup" : "Weekly Mock Used")
      : "Open Mock Setup";
    const disabledAttr = entitlement.id !== "premium" && !mockExamStatus?.allowed ? "disabled" : "";
    const usedNextDate = formatShortDate(mockExamStatus?.nextEligibleAt);
    const ctaDisabledTitle =
      entitlement.id !== "premium" && mockExamStatus && !mockExamStatus.allowed
        ? `Used this week — available again ${usedNextDate ? `on ${usedNextDate}` : "next week"}.`
        : "";
    const ctaTitleAttr = ctaDisabledTitle ? ` title="${escapeHtml(ctaDisabledTitle)}"` : "";
    mockExamFeature.innerHTML = `
      <article class="mock-feature-panel ripple scale-on-hover${isUnlocked ? "" : " locked"}" tabindex="0">
        <div class="mock-feature-content">
            <p class="eyebrow premium-eyebrow">PREMIUM SIMULATION</p>
            <div class="mock-feature-head">
                <div>
                    <h3 class="topic-title">${safeName}</h3>
                    <p class="topic-description">${safeDescription}</p>
                </div>
            </div>
        </div>
        <div class="mock-feature-footer">
            <div class="mock-feature-meta">
                <span class="mock-exam-badge">
                    <svg class="icon-nudge-right" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                    40 Questions | 45 Minutes
                </span>
                ${freeMockBadge}
                ${lockBadge}
            </div>
            <button class="btn btn-primary mock-exam-cta" type="button" ${disabledAttr}${ctaTitleAttr}>
                <span>${ctaLabel}</span>
            </button>
        </div>
      </article>
    `;
    mockExamFeatureCard.classList.remove("hidden");
    const featurePanel = mockExamFeature.querySelector(".mock-feature-panel");
    if (featurePanel) {
      attachTopicActivation(featurePanel, mockTopic, accessState);
    }
  }

  studyTopics.forEach((topic, index) => {
    const { isUnlocked } = getTopicAccessState(topic);
    const topicCountModel = resolveQuestionCountDisplay({
      total: counts[topic.id] ?? topic.mockExamQuestionCount ?? 0,
      locked: !isUnlocked,
      cap: perTopicQuestionCap,
    });
    const questionCountMarkup = buildQuestionCountMarkup(
      topicCountModel,
      counts[topic.id] ?? topic.mockExamQuestionCount ?? 0,
    );
    const topicCard = document.createElement("div");
    topicCard.className = "topic-card ripple scale-on-hover";
    topicCard.dataset.topicId = String(topic?.id || "");
    if (!isUnlocked) {
      topicCard.classList.add("locked");
    }          const name = topic.name
      .replace(/^[A-Z]\.\s/, "")
      .replace(/ \(\d+ Questions\)/, "");
    const safeIcon = escapeHtml(topic.icon || "\uD83D\uDCD8");
    const safeName = escapeHtml(name);
    const safeDescription = escapeHtml(topic.description || "No description available");
    const lockBadge = !isUnlocked ? premiumLockBadgeHtml("Premium topic") : "";

    topicCard.innerHTML = `
        <div class="card-content">
            <div class="topic-icon-wrap">
                <div class="topic-icon">${safeIcon}</div>
            </div>
            <h3 class="topic-title">${safeName}</h3>
            <p class="topic-description">${safeDescription}</p>
            ${lockBadge}
        </div>
        <div class="card-footer">
            ${questionCountMarkup}
            <div class="card-action-indicator">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="3"><path d="M9 18l6-6-6-6"></path></svg>
            </div>
        </div>
    `;

    const topicPricingBtn = topicCard.querySelector(".state-action[data-open-pricing]");
    topicPricingBtn?.addEventListener("click", (event) => {
      event.stopPropagation();
      openPricingModal();
    });
    attachTopicActivation(topicCard, topic, getTopicAccessState(topic));
    topicList.appendChild(topicCard);
    debugLog("Added topic card:", topic.name);
  });
  debugLog("Topic list populated");

  const topicSelectionScreen = document.getElementById("topicSelectionScreen");
  const freePlanNotice = document.getElementById("freePlanNotice");
  if (topicSelectionScreen && freePlanNotice) {
    if (!isAuthenticated()) {
      freePlanNotice.classList.add("hidden");
    } else if (typeof topicLimit === "number") {
      freePlanNotice.classList.remove("hidden");
      freePlanNotice.textContent =
        `Free plan: explore all topics preview, study ${topicLimit} unlocked topic${topicLimit > 1 ? "s" : ""} with ${entitlement.maxSubcategories} subtopics and ${entitlement.maxQuestionsPerSubcategory} questions each, plus 1 free mock exam weekly (7-day window from registration). Upgrade to Premium for unlimited topic access, full question bank, detailed analytics, and cloud sync.`;
    } else {
      freePlanNotice.classList.add("hidden");
    }
  }
}
// Get total question count for a topic
export async function getTotalQuestionCount(topic) {
  try {
    return await getTotalQuestionCountForTopic(topic);
  } catch (e) {
    console.error("Error getting total question count:", e);
    return 0;
  }
}

// Select a topic and show category selection (then mode selection)
export async function selectTopic(topic) {
  try {
    if (topic?.skipCategorySelection) {
      const backToCategoryBtn = document.getElementById("backToCategoryBtn");

      applySessionSetupCopy(topic);
      topic.selectedCategory = "all";
      topic.allowedCategoryIds = null;
      clearStudyFiltersForTopic(topic);

      if (backToCategoryBtn) {
        backToCategoryBtn.onclick = () => {
          showScreen("topicSelectionScreen");
        };
      }
      showScreen("modeSelectionScreen");
      notifySessionSetupReady(topic);
      return;
    }

    const sourceLoadResult = await fetchTopicDataFilesWithReport(topic, {
      tolerateFailures: true,
    });

    const { payloads: topicDataFiles } = sourceLoadResult;

    if (!topicDataFiles.length) {
      throw new Error("No topic data sources could be loaded.");
    }

    const topicTotalQuestions = topicDataFiles.reduce(
      (sum, topicData) => sum + countQuestionsFromTopicData(topicData),
      0,
    );
    const categoryTotalQuestions = document.getElementById("categoryTotalQuestions");
    const categoryConfidenceScore = document.getElementById("categoryConfidenceScore");
    if (categoryTotalQuestions) categoryTotalQuestions.textContent = String(topicTotalQuestions);
    if (categoryConfidenceScore) categoryConfidenceScore.textContent = "--";

    let hasSubcategories = false;
    for (const topicData of topicDataFiles) {
      if (collectSubcategories(topicData).length > 0) {
        hasSubcategories = true;
        break;
      }
    }

    const hasSavedSelection =
      (Array.isArray(topic.allowedCategoryIds) && topic.allowedCategoryIds.length > 0) ||
      String(topic.selectedCategory || "all") !== "all";

    if (hasSubcategories && hasSavedSelection) {
      attachStudyFiltersToTopic(topic, topicDataFiles);
      applySessionSetupCopy(topic);
      showScreen("modeSelectionScreen");
      notifySessionSetupReady(topic);
    } else if (hasSubcategories) {
      const categoryQuizTitle = document.getElementById("categoryQuizTitle");
      const categoryQuizDescription = document.getElementById(
        "categoryQuizDescription",
      );
      const selectedTopicForCategory = document.getElementById(
        "selectedTopicForCategory",
      );

      if (categoryQuizTitle) categoryQuizTitle.textContent = topic.name;
      if (categoryQuizDescription)
        categoryQuizDescription.textContent = topic.description;
      if (selectedTopicForCategory)
        selectedTopicForCategory.textContent = topic.name;

      await displayCategories(topic, (selectedCategory, visibleSubcategories = []) => {
        topic.selectedCategory = selectedCategory.id || "all";
        if (Array.isArray(visibleSubcategories) && visibleSubcategories.length) {
          topic.allowedCategoryIds = visibleSubcategories
            .map((entry) => (entry && typeof entry === "object" ? entry.id : null))
            .filter(Boolean);
        } else {
          topic.allowedCategoryIds = null;
        }
        attachStudyFiltersToTopic(topic, topicDataFiles);
        applySessionSetupCopy(topic);
        showScreen("modeSelectionScreen");
        notifySessionSetupReady(topic);
      });
    } else {
      applySessionSetupCopy(topic);
      topic.selectedCategory = "all";
      topic.allowedCategoryIds = null;
      attachStudyFiltersToTopic(topic, topicDataFiles);
      showScreen("modeSelectionScreen");
      notifySessionSetupReady(topic);
    }

    const backToCategoryBtn = document.getElementById("backToCategoryBtn");
    if (backToCategoryBtn) {
      backToCategoryBtn.onclick = () => {
        showScreen("categorySelectionScreen");
      };
    }
  } catch (error) {
    console.error("Error checking topic subcategories:", error);
    applySessionSetupCopy(topic);
    topic.selectedCategory = "all";
    topic.allowedCategoryIds = null;
    clearStudyFiltersForTopic(topic);
    showScreen("modeSelectionScreen");
    notifySessionSetupReady(topic);
  }
}

// Make functions available globally for HTML onclick handlers
