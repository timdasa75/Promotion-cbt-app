// quiz.js - Module for quiz logic

import { showScreen, showError } from "./ui.js";
import { extractQuestionsByCategory, fetchTopicDataFiles } from "./topicSources.js";
import { debugLog } from "./logger.js";
import { getTopics } from "./data.js";
import {
  getCurrentEntitlement,
  getCurrentUser,
  getProgressStorageKeyForCurrentUser,
} from "./auth.js";

/**
 * Markdown parser for basic formatting
 * @param {string} text - Text to convert to HTML
 * @returns {string} HTML formatted text
 */
function parseMarkdown(text) {
  if (!text || typeof text !== "string") return text || "";

  // Escape HTML first so markdown formatting cannot inject markup.
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Inline markdown.
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/__([^_]+)__/g, "<strong>$1</strong>");
  html = html.replace(/(^|[^\*])\*([^\*\n]+)\*(?!\*)/g, "$1<em>$2</em>");
  html = html.replace(/(^|[^_])_([^_\n]+)_(?!_)/g, "$1<em>$2</em>");

  // New lines.
  html = html.replace(/\n/g, "<br>");
  return `<p>${html}</p>`;
}

function normalizeExplanationText(text) {
  if (!text || typeof text !== "string") return "No explanation available.";

  let normalized = text.trim();

  // Remove answer-judgment lead-ins so rationale stays neutral for all outcomes.
  normalized = normalized.replace(
    /^(this\s+is\s+correct\s+because|this\s+is\s+incorrect\s+because|correct\s+because|incorrect\s+because)\s*/i,
    "",
  );
  normalized = normalized.replace(/^(correct|incorrect)\s*[:.-]\s*/i, "");
  normalized = normalized.replace(/^(this\s+means|this\s+is\s+because)\s*/i, "");

  // Clean accidental duplicate punctuation and spacing artifacts from generated content.
  normalized = normalized.replace(/\s{2,}/g, " ");
  normalized = normalized.replace(/,\s*\./g, ".");
  normalized = normalized.replace(/\.\s*\./g, ".");

  normalized = normalized.trim();
  if (!normalized) return "No explanation available.";

  // Ensure sentence starts cleanly.
  normalized = normalized.charAt(0).toUpperCase() + normalized.slice(1);
  return normalized;
}

function clearOptionFeedbackLabel(optionEl) {
  if (!optionEl) return;
  const existing = optionEl.querySelector(".option-feedback-label");
  if (existing) existing.remove();
}

function applyOptionFeedbackLabel(optionEl) {
  if (!optionEl) return;
  clearOptionFeedbackLabel(optionEl);

  const isIncorrect =
    optionEl.classList.contains("incorrect") ||
    optionEl.classList.contains("user-incorrect");
  const isCorrect = optionEl.classList.contains("correct");
  if (!isCorrect && !isIncorrect) return;

  const badge = document.createElement("span");
  badge.className = `option-feedback-label ${isIncorrect ? "incorrect" : "correct"}`;
  badge.textContent = isIncorrect ? "Incorrect" : "Correct";
  optionEl.appendChild(badge);
}

function refreshOptionFeedbackLabels() {
  const options = document.querySelectorAll(".option-btn");
  options.forEach((optionEl) => applyOptionFeedbackLabel(optionEl));
}

/**
 * Quiz state management
 */
const quizState = {
  allQuestions: [],
  originalQuestions: [],
  currentQuestionIndex: 0,
  score: 0,
  userAnswers: [],
  incorrectAnswers: [],
  feedbackShown: [], // Track if feedback has been shown for each question
  timer: null,
  timeLeft: 0,
};
const QUIZ_RUNTIME_STORAGE_KEY = "cbt_quiz_runtime_v1";
const QUIZ_RUNTIME_MAX_AGE_MS = 24 * 60 * 60 * 1000;

let reviewContext = "study"; // "study" (pre-quiz) or "session" (post-quiz)
let lastCompletedSession = null;
const MOCK_EXAM_TOPIC_ID = "mock_exam";
const DEFAULT_MOCK_EXAM_BLUEPRINT = [
  { topicId: "psr", count: 4 },
  { topicId: "financial_regulations", count: 4 },
  { topicId: "procurement_act", count: 4 },
  { topicId: "constitutional_law", count: 4 },
  { topicId: "civil_service_admin", count: 4 },
  { topicId: "leadership_management", count: 4 },
  { topicId: "ict_management", count: 4 },
  { topicId: "policy_analysis", count: 4 },
  { topicId: "general_current_affairs", count: 4 },
  { topicId: "competency_framework", count: 4 },
];

function clampIndex(value, length) {
  const max = Math.max(0, Number(length || 0) - 1);
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.min(max, Math.max(0, Math.floor(numeric)));
}

function normalizeRuntimeAnswers(values, total) {
  const size = Number(total || 0);
  const answers = Array.isArray(values) ? values.slice(0, size) : [];
  const normalized = new Array(size).fill(undefined);
  answers.forEach((value, index) => {
    const numeric = Number(value);
    if (Number.isInteger(numeric) && numeric >= 0) {
      normalized[index] = numeric;
    }
  });
  return normalized;
}

function normalizeRuntimeFeedback(values, total) {
  const size = Number(total || 0);
  const feedback = Array.isArray(values) ? values.slice(0, size) : [];
  const normalized = new Array(size).fill(false);
  feedback.forEach((value, index) => {
    normalized[index] = Boolean(value);
  });
  return normalized;
}

function readQuizRuntimeStorageRaw() {
  try {
    const raw = window.localStorage.getItem(QUIZ_RUNTIME_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch (error) {
    return null;
  }
}

function buildRuntimeTopicPayload(topic) {
  if (!topic || typeof topic !== "object") return null;
  return {
    id: String(topic.id || ""),
    name: String(topic.name || ""),
    description: String(topic.description || ""),
    file: String(topic.file || ""),
    type: String(topic.type || ""),
    skipCategorySelection: Boolean(topic.skipCategorySelection),
    requiresPremium: Boolean(topic.requiresPremium),
    mockExamQuestionCount: Number(topic.mockExamQuestionCount || 0) || null,
    selectedCategory: String(topic.selectedCategory || "all"),
    allowedCategoryIds: Array.isArray(topic.allowedCategoryIds)
      ? topic.allowedCategoryIds.filter(Boolean)
      : null,
    mockExamBlueprint: Array.isArray(topic.mockExamBlueprint)
      ? topic.mockExamBlueprint
          .map((entry) => ({
            topicId: String(entry?.topicId || ""),
            count: Number(entry?.count || 0),
          }))
          .filter((entry) => entry.topicId && entry.count > 0)
      : null,
  };
}

function getPersistedQuizRuntimeForCurrentUser() {
  const saved = readQuizRuntimeStorageRaw();
  if (!saved) return null;

  const user = getCurrentUser();
  const userId = String(user?.id || "");
  if (!userId || String(saved?.userId || "") !== userId) {
    return null;
  }

  const mode = String(saved?.mode || "");
  if (mode !== "practice" && mode !== "exam") {
    return null;
  }

  const savedAt = Date.parse(String(saved?.savedAt || ""));
  if (!savedAt || Date.now() - savedAt > QUIZ_RUNTIME_MAX_AGE_MS) {
    return null;
  }

  if (!Array.isArray(saved?.questions) || !saved.questions.length) {
    return null;
  }

  if (!saved?.topic || typeof saved.topic !== "object" || !saved.topic.id) {
    return null;
  }

  return saved;
}

function persistQuizRuntime() {
  const user = getCurrentUser();
  const userId = String(user?.id || "");

  if (!userId || !currentTopic?.id) {
    clearPersistedQuizRuntime();
    return;
  }

  if (currentMode !== "practice" && currentMode !== "exam") {
    clearPersistedQuizRuntime();
    return;
  }

  const questions = Array.isArray(quizState.originalQuestions) && quizState.originalQuestions.length
    ? quizState.originalQuestions
    : quizState.allQuestions;
  if (!Array.isArray(questions) || !questions.length) {
    clearPersistedQuizRuntime();
    return;
  }

  const totalQuestions = questions.length;
  const payload = {
    userId,
    mode: currentMode,
    topic: buildRuntimeTopicPayload(currentTopic),
    questions,
    currentQuestionIndex: clampIndex(quizState.currentQuestionIndex, totalQuestions),
    userAnswers: normalizeRuntimeAnswers(quizState.userAnswers, totalQuestions),
    feedbackShown: normalizeRuntimeFeedback(quizState.feedbackShown, totalQuestions),
    timeLeft: Math.max(0, Number(quizState.timeLeft || 0)),
    savedAt: new Date().toISOString(),
  };

  try {
    window.localStorage.setItem(QUIZ_RUNTIME_STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    // Ignore storage quota/persistence errors.
  }
}

export function clearPersistedQuizRuntime() {
  window.localStorage.removeItem(QUIZ_RUNTIME_STORAGE_KEY);
}

export function getPersistedQuizRuntime() {
  return getPersistedQuizRuntimeForCurrentUser();
}

export function restorePersistedQuizRuntime(runtime, topicOverride = null) {
  const source = runtime && typeof runtime === "object" ? runtime : getPersistedQuizRuntimeForCurrentUser();
  if (!source) return null;

  const mode = String(source.mode || "");
  if (mode !== "practice" && mode !== "exam") return null;

  const questions = Array.isArray(source.questions) ? source.questions : [];
  if (!questions.length) return null;

  const totalQuestions = questions.length;
  const runtimeTopic =
    topicOverride && typeof topicOverride === "object"
      ? {
          ...source.topic,
          ...topicOverride,
        }
      : source.topic;
  if (!runtimeTopic?.id) return null;

  currentTopic = runtimeTopic;
  setCurrentMode(mode);
  quizState.allQuestions = [...questions];
  quizState.originalQuestions = [...questions];

  initializeQuiz({
    preserveAnswers: true,
    context: "session",
    keepOriginalQuestions: true,
    restoreState: {
      currentQuestionIndex: clampIndex(source.currentQuestionIndex, totalQuestions),
      userAnswers: normalizeRuntimeAnswers(source.userAnswers, totalQuestions),
      feedbackShown: normalizeRuntimeFeedback(source.feedbackShown, totalQuestions),
      timeLeft: Math.max(0, Number(source.timeLeft || 0)),
    },
  });

  return {
    topic: runtimeTopic,
    mode,
  };
}

function isMockExamTopic(topic) {
  return topic?.id === MOCK_EXAM_TOPIC_ID || topic?.type === "mock_exam";
}

function getMockExamBlueprint(topic) {
  if (Array.isArray(topic?.mockExamBlueprint) && topic.mockExamBlueprint.length) {
    return topic.mockExamBlueprint
      .map((entry) => ({
        topicId: String(entry?.topicId || ""),
        count: Number(entry?.count || 0),
      }))
      .filter((entry) => entry.topicId && entry.count > 0);
  }
  return DEFAULT_MOCK_EXAM_BLUEPRINT;
}

async function buildMockExamQuestions(topic) {
  const baseTopics = getTopics().filter((entry) => entry?.id && entry.file);
  const topicMap = new Map(baseTopics.map((entry) => [entry.id, entry]));
  const blueprint = getMockExamBlueprint(topic);
  const questions = [];

  for (const item of blueprint) {
    const sourceTopic = topicMap.get(item.topicId);
    if (!sourceTopic) continue;

    const topicDataFiles = await fetchTopicDataFiles(sourceTopic, { tolerateFailures: true });
    const pool = [];
    topicDataFiles.forEach((topicData) => {
      pool.push(...extractQuestionsByCategory(topicData, "all", {}));
    });

    if (!pool.length) continue;

    const picked = shuffleArray(pool)
      .slice(0, Math.min(item.count, pool.length))
      .map((question) => ({
        ...question,
        sourceTopicId: sourceTopic.id,
        sourceTopicName: sourceTopic.name,
      }));
    questions.push(...picked);
  }

  return shuffleArray(questions);
}

function buildMockExamTopicBreakdown() {
  const byTopic = new Map();

  quizState.allQuestions.forEach((question, index) => {
    const topicId = question?.sourceTopicId || "";
    if (!topicId) return;
    const topicName = question?.sourceTopicName || topicId;
    if (!byTopic.has(topicId)) {
      byTopic.set(topicId, {
        topicId,
        topicName,
        total: 0,
        answered: 0,
        correct: 0,
      });
    }
    const entry = byTopic.get(topicId);
    entry.total += 1;

    const answer = quizState.userAnswers[index];
    if (answer !== undefined) {
      entry.answered += 1;
      if (answer === question.correct) {
        entry.correct += 1;
      }
    }
  });

  return Array.from(byTopic.values())
    .map((entry) => ({
      ...entry,
      accuracy: entry.answered
        ? Math.round((entry.correct / entry.answered) * 100)
        : 0,
    }))
    .sort((a, b) => b.accuracy - a.accuracy || b.correct - a.correct || a.topicName.localeCompare(b.topicName));
}

function getTrafficClassByPercentage(percentage) {
  if (percentage >= 70) return "traffic-green";
  if (percentage >= 50) return "traffic-amber";
  return "traffic-red";
}

function getInverseTrafficClassByPercentage(percentage) {
  if (percentage <= 20) return "traffic-green";
  if (percentage <= 40) return "traffic-amber";
  return "traffic-red";
}

function applyTrafficClass(element, className) {
  if (!element) return;
  element.classList.remove("traffic-green", "traffic-amber", "traffic-red");
  if (className) element.classList.add(className);
}

/**
 * DOM Elements cache
 */

function readProgressSummary() {
  try {
    const raw = window.localStorage.getItem(getProgressStorageKeyForCurrentUser());
    if (!raw) return { attempts: [] };
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.attempts)) return { attempts: [] };
    return parsed;
  } catch (error) {
    return { attempts: [] };
  }
}

function saveProgressSummary(summary) {
  try {
    window.localStorage.setItem(getProgressStorageKeyForCurrentUser(), JSON.stringify(summary));
  } catch (error) {
    console.warn("Unable to persist progress summary", error);
  }
}

function recordAttemptResult({ topicId, topicName, mode, scorePercentage, totalQuestions }) {
  const user = getCurrentUser();
  if (!user) return { attempts: [] };
  const summary = readProgressSummary();
  summary.attempts.push({
    topicId,
    topicName,
    mode,
    scorePercentage,
    totalQuestions,
    createdAt: new Date().toISOString(),
  });

  if (summary.attempts.length > 50) {
    summary.attempts = summary.attempts.slice(summary.attempts.length - 50);
  }

  saveProgressSummary(summary);
  return summary;
}

function calculateProgressInsights(summary, currentTopicId) {
  const attempts = summary?.attempts || [];
  const recent = attempts.slice(-5);

  const avgRecentScore = recent.length
    ? Math.round(recent.reduce((acc, a) => acc + (a.scorePercentage || 0), 0) / recent.length)
    : null;

  const byTopic = new Map();
  attempts.forEach((attempt) => {
    if (!attempt.topicId) return;
    if (!byTopic.has(attempt.topicId)) {
      byTopic.set(attempt.topicId, {
        topicId: attempt.topicId,
        topicName: attempt.topicName || attempt.topicId,
        scores: [],
      });
    }
    byTopic.get(attempt.topicId).scores.push(attempt.scorePercentage || 0);
  });

  const topicAverages = Array.from(byTopic.values()).map((entry) => ({
    topicId: entry.topicId,
    topicName: entry.topicName,
    avgScore: Math.round(entry.scores.reduce((acc, score) => acc + score, 0) / entry.scores.length),
  }));

  const sortedByScore = [...topicAverages].sort((a, b) => a.avgScore - b.avgScore);
  const weakestTopic = sortedByScore.length ? sortedByScore[0] : null;
  const strongestTopic = sortedByScore.length
    ? sortedByScore[sortedByScore.length - 1]
    : null;

  const recommendedTopic = weakestTopic && weakestTopic.topicId !== currentTopicId
    ? weakestTopic.topicName
    : null;

  return {
    attemptsCount: attempts.length,
    avgRecentScore,
    strongestTopic,
    weakestTopic,
    recommendedTopic,
  };
}

const domElements = {
  questionElement: null,
  optionsContainer: null,
  submitButton: null,
  nextButton: null,
  prevButton: null,
  progressBar: null,
  questionCounter: null,
  timerDisplay: null,
  finalScore: null,
  performanceText: null,
};

/**
 * Get DOM elements when needed
 */
function getDOMElements() {
  domElements.questionElement = document.getElementById("questionText");
  domElements.optionsContainer = document.getElementById("optionsContainer");
  domElements.submitButton = document.getElementById("submitBtn");
  domElements.nextButton = document.getElementById("nextBtn");
  domElements.prevButton = document.getElementById("prevBtn");
  domElements.progressBar = document.getElementById("progressFill");
  domElements.questionCounter = document.getElementById("currentQ");
  domElements.timerDisplay = document.getElementById("timeLeft");
  domElements.finalScore = document.getElementById("finalScore");
  domElements.performanceText = document.getElementById("performanceText");
}

/**
 * Shuffle array (Fisher-Yates algorithm)
 * @param {Array} array - Array to shuffle
 * @returns {Array} Shuffled array
 */
function shuffleArray(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

/**
 * Start the quiz timer
 */
function startTimer() {
  updateTimerDisplay();
  quizState.timer = setInterval(() => {
    if (currentMode === "practice") {
      quizState.timeLeft++;
      updateTimerDisplay();
      return;
    }

    quizState.timeLeft--;
    updateTimerDisplay();

    if (quizState.timeLeft <= 0) {
      quizState.timeLeft = 0;
      updateTimerDisplay();
      clearInterval(quizState.timer);
      // Auto-submit exam when time runs out
      if (currentMode === "exam") {
        debugLog("Exam time expired - auto-submitting");
        // Calculate score for answered questions
        calculateExamScore();
      }
      showResults();
    }
  }, 1000);
}

/**
 * Show time warning based on remaining time
 * @param {string} message - Warning message to display
 */
function showTimeWarning(message) {
  const timerContainer = document.getElementById("timerDisplay");

  if (timerContainer) {
    // Remove all timer classes first
    timerContainer.classList.remove("warning", "critical", "urgent");

    // Add different classes based on time remaining
    if (quizState.timeLeft <= 60) {
      // Last minute - critical state
      timerContainer.classList.add("critical", "urgent");
    } else if (quizState.timeLeft <= 120) {
      // Last 2 minutes - warning state
      timerContainer.classList.add("warning");
    }
  }
}

function formatDuration(totalSeconds) {
  const safeSeconds = Math.max(0, totalSeconds || 0);
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
}

function updatePracticePacingNotice() {
  const notice = document.getElementById("practicePacingNotice");
  const timerContainer = document.getElementById("timerDisplay");
  if (!notice || !timerContainer) return;

  if (currentMode !== "practice") {
    notice.classList.add("hidden");
    notice.textContent = "";
    timerContainer.classList.remove("warning", "critical", "urgent");
    return;
  }

  const examEquivalentSeconds = (quizState.allQuestions?.length || 0) * 45;
  if (!examEquivalentSeconds || quizState.timeLeft <= examEquivalentSeconds) {
    notice.classList.add("hidden");
    notice.textContent = "";
    timerContainer.classList.remove("warning", "critical", "urgent");
    return;
  }

  const overrun = quizState.timeLeft - examEquivalentSeconds;
  notice.textContent = `You are ${formatDuration(overrun)} beyond exam pace. Keep going and speed up your decision time.`;
  notice.classList.remove("hidden");
  timerContainer.classList.add("warning");
}

/**
 * Update the timer display
 */
function updateTimerDisplay() {
  const timeLeftElement = document.getElementById("timeLeft");
  if (!timeLeftElement) return;

  timeLeftElement.textContent = formatDuration(quizState.timeLeft);

  if (currentMode !== "exam") {
    updatePracticePacingNotice();
    return;
  }

  // Check if we need to show time warnings or reset to normal state
  if (quizState.timeLeft <= 10 && quizState.timeLeft > 0) {
    // Last 10 seconds
    showTimeWarning(`${quizState.timeLeft} seconds remaining!`);
  } else if (quizState.timeLeft === 30) {
    // 30 seconds
    showTimeWarning("30 seconds remaining!");
  } else if (quizState.timeLeft === 60) {
    // 1 minute
    showTimeWarning("1 minute remaining!");
  } else if (quizState.timeLeft === 180) {
    // 3 minutes
    showTimeWarning("3 minutes remaining!");
  } else if (quizState.timeLeft === 300) {
    // 5 minutes
    showTimeWarning("5 minutes remaining!");
  } else if (quizState.timeLeft > 120) {
    // If we have more than 2 minutes left, ensure normal state
    const timerContainer = document.getElementById("timerDisplay");
    if (timerContainer) {
      timerContainer.classList.remove("warning", "critical", "urgent");
    }
  }
}

/**
 * Show the current question
 */
function showQuestion() {
  debugLog(
    "showQuestion called, index:",
    quizState.currentQuestionIndex,
    "of",
    quizState.allQuestions.length,
  );
  if (quizState.currentQuestionIndex >= quizState.allQuestions.length) {
    showResults();
    return;
  }
  const question = quizState.allQuestions[quizState.currentQuestionIndex];
  debugLog("Current question:", question);
  
  // Query DOM elements here to ensure they exist
  const questionElement = document.getElementById("questionText");
  const optionsContainer = document.getElementById("optionsContainer");
  const quizScreen = document.getElementById("quizScreen");
  debugLog("showQuestion DOM check:", {
    questionElement,
    optionsContainer,
    quizScreen,
  });
  if (!questionElement || !optionsContainer || !quizScreen) {
    console.error("Quiz screen or question elements not found in DOM.");
    showError(
      "Quiz screen or question elements not found. Please check your HTML IDs.",
    );
    return;
  }
  
  // Make sure quiz screen is visible
  quizScreen.classList.remove("hidden");
  quizScreen.classList.add("active");
  
  questionElement.innerHTML = `
    <div class="question-number-container">
      <span class="question-number">${quizState.currentQuestionIndex + 1}</span>
    </div>
    <div class="question-text-container">
      ${parseMarkdown(question.question)}
    </div>
  `;

  // Clear previous options
  optionsContainer.innerHTML = "";

  // Handle explanation visibility based on mode
  const explanationDiv = document.getElementById("explanation");
  if (explanationDiv) {
    // Hide explanation container in exam mode
    if (currentMode === "exam") {
      explanationDiv.style.display = "none";
    } else {
      explanationDiv.style.display = "block";
    }
  }

        // Add new options
    if (question.options && Array.isArray(question.options)) {
      question.options.forEach((option, index) => {
        const button = document.createElement("button");
        button.className = "option-btn";
        button.innerHTML = `
                  <span class="option-letter">${String.fromCharCode(65 + index)}</span>
                  <div class="option-text">${parseMarkdown(option)}</div>
              `;
  
        // Different behavior based on mode
        if (currentMode === "review") {
          button.disabled = true;
          const originalQuestionIndex = quizState.originalQuestions.indexOf(question);

          if (reviewContext === "study") {
            // Pre-quiz review: always reveal the correct answer and explanation.
            if (index === question.correct) {
              button.classList.add("correct");
            }
          } else if (quizState.userAnswers[originalQuestionIndex] !== undefined) {
            // Post-quiz review: show user's answer state for the completed session.
            if (quizState.userAnswers[originalQuestionIndex] === index) {
              button.classList.add("selected");
              if (index !== question.correct) {
                button.classList.add("user-incorrect");
              }
            }
            if (index === question.correct) {
              button.classList.add("correct");
            }
          }
        } else if (currentMode === "exam") {
          // In exam mode, options are not disabled until selected
          // Once an option is selected, it stays selected and disabled
          button.onclick = () => selectOption(index);
        } else {
          // Practice mode
          button.onclick = () => selectOption(index);
        }
  
        // If user already answered this question, show their answer
        const originalQuestionIndex = quizState.originalQuestions.indexOf(question);
        if (quizState.userAnswers[originalQuestionIndex] !== undefined) {
          if (quizState.userAnswers[originalQuestionIndex] === index) {
            button.classList.add("selected");
          }
  
          // In practice and review modes, show correct/incorrect feedback
          // In exam mode, don't show feedback until exam is completed to maintain exam integrity
          if (currentMode === "practice" || currentMode === "review") {
            if (index === question.correct) {
              button.classList.add("correct");
            } else if (
              quizState.userAnswers[originalQuestionIndex] === index &&
              index !== question.correct
            ) {
              button.classList.add("incorrect");
            }
          }
        }
  
        optionsContainer.appendChild(button);
      });
    refreshOptionFeedbackLabels();
    // In practice mode, if feedback has already been shown for this question, display it and update navigation
    if (currentMode === "practice" && quizState.feedbackShown[quizState.currentQuestionIndex]) {
      setTimeout(() => {
        showExplanation();
        const explanationDiv = document.getElementById("explanation");
        if (explanationDiv) {
          explanationDiv.classList.add("show");
          explanationDiv.style.display = "block";
        }
        // Update navigation to show Next button since feedback was already shown
        updateNavigation();
      }, 100);
    }

    if (currentMode === "review") {
      showExplanation();
      const reviewExplanationDiv = document.getElementById("explanation");
      if (reviewExplanationDiv) {
        reviewExplanationDiv.classList.add("show");
        reviewExplanationDiv.style.display = "block";
      }
    }
  } else {
    optionsContainer.innerHTML =
      '<div class="error-message">No options found for this question.</div>';
  }

  // Update navigation and progress
  updateNavigation();
  updateProgress();
  if (currentMode !== "review" || reviewContext === "study") {
    showQuestionMap();
  }
}

/**
 * Handle option selection
 * @param {number} selectedIndex - Index of selected option
 */
function selectOption(selectedIndex) {
  const question = quizState.allQuestions[quizState.currentQuestionIndex];

  // For exam mode: record answer but don't show feedback immediately
  if (currentMode === "exam") {
    quizState.userAnswers[quizState.currentQuestionIndex] = selectedIndex;

    const options = document.querySelectorAll(".option-btn");
    options.forEach((option, index) => {
      option.classList.remove("selected");
      if (index === selectedIndex) {
        option.classList.add("selected");
      }
    });

    // Enable next button
    domElements.nextButton.disabled = false;
    updateNavigation();

    // Update progress bar to reflect answered question
    updateProgress();

    // Don't show explanation in exam mode
    const explanationDiv = document.getElementById("explanation");
    if (explanationDiv) {
      explanationDiv.classList.remove("show");
    }
    persistQuizRuntime();
    return;
  }

  // For practice and review modes: show immediate feedback
  // Store the selected answer but don't increment score (score calculated at end)
  quizState.userAnswers[quizState.currentQuestionIndex] = selectedIndex;

  // Query DOM elements inside function
  const optionsContainer = document.getElementById("optionsContainer");
  if (!optionsContainer) return;

  // Update UI
  const options = document.querySelectorAll(".option-btn");
  options.forEach((option, index) => {
    // Don't disable options in practice mode to allow changing answers
    option.classList.remove("selected", "correct", "incorrect");
    clearOptionFeedbackLabel(option);

    if (index === selectedIndex) {
      option.classList.add("selected");
      // Don't show correct/incorrect in practice mode to allow experimentation
    }
  });

  // Update navigation to handle button state
  updateNavigation();

  // Update progress bar to reflect answered question
  updateProgress();
  showQuestionMap();
  persistQuizRuntime();
}

/**
 * Update navigation buttons based on current state and mode
 */
function updateNavigation() {
  const submitButton = domElements.submitButton;
  const nextButton = domElements.nextButton;
  const prevButton = domElements.prevButton;
  if (!submitButton || !nextButton || !prevButton) return;

  // Previous button
  prevButton.disabled = quizState.currentQuestionIndex === 0;
  prevButton.setAttribute("aria-disabled", prevButton.disabled);
  prevButton.title = prevButton.disabled
    ? "No previous question"
    : "Go to previous question";
  prevButton.textContent = "Previous";

  if (currentMode === "review") {
    // In review mode, next button is always enabled (study/session).
    nextButton.disabled = false;
    submitButton.style.display = "none";
    nextButton.style.display = "inline-flex";
    nextButton.onclick = () => {
      if (!nextButton.disabled) nextQuestion();
    };
    prevButton.onclick = () => {
      if (!prevButton.disabled) previousQuestion();
    };
  } else if (currentMode === "exam") {
    // In exam mode, allow answer revision before final exam submission.
    prevButton.disabled = quizState.currentQuestionIndex === 0;
    prevButton.setAttribute("aria-disabled", prevButton.disabled);
    prevButton.title = prevButton.disabled
      ? "No previous question"
      : "Go to previous question";

    // Enable next button once an answer is selected
    nextButton.disabled = quizState.userAnswers[quizState.currentQuestionIndex] === undefined;
    submitButton.style.display = "none";
    nextButton.style.display = "inline-flex";
    nextButton.onclick = () => {
      if (!nextButton.disabled) nextQuestion();
    };
  } else {
    // In practice mode, handle Submit/Next button visibility
    if (quizState.userAnswers[quizState.currentQuestionIndex] === undefined) {
      // No answer selected yet - show Next button (disabled)
      submitButton.style.display = "none";
      nextButton.style.display = "inline-flex";
      nextButton.disabled = true;
      nextButton.textContent = "Next";
      nextButton.onclick = () => {
        if (!nextButton.disabled) nextQuestion();
      };
    } else if (!quizState.feedbackShown[quizState.currentQuestionIndex]) {
      // Answer selected but feedback not shown yet - show Submit button
      submitButton.style.display = "inline-flex";
      nextButton.style.display = "none";
      submitButton.disabled = false;
      submitButton.onclick = () => {
        if (!submitButton.disabled) handleSubmit();
      };
    } else {
      // Answer selected and feedback shown - show Next button
      submitButton.style.display = "none";
      nextButton.style.display = "inline-flex";
      nextButton.disabled = false;
      nextButton.textContent = "Next";
      nextButton.onclick = () => {
        if (!nextButton.disabled) nextQuestion();
      };
    }
  }

  // Handle last question
  if (quizState.currentQuestionIndex === quizState.allQuestions.length - 1) {
    if (currentMode === "review") {
      nextButton.textContent =
        reviewContext === "study" ? "End Study Review" : "End Review";
      nextButton.onclick = () => {
        if (!nextButton.disabled) {
          if (reviewContext === "study") {
            showScreen("modeSelectionScreen");
          } else {
            showScreen("resultsScreen");
          }
        }
      };
    } else if (currentMode === "exam") {
      nextButton.textContent = "Submit Exam";
      nextButton.onclick = () => {
        if (!nextButton.disabled) showResults();
      };
    } else {
      nextButton.textContent = "Finish Quiz";
      nextButton.onclick = () => {
        if (!nextButton.disabled) showResults();
      };
    }
  } else {
    nextButton.textContent = "Next";
    nextButton.onclick = () => {
      if (!nextButton.disabled) nextQuestion();
    };
  }

  // Add click event listeners for navigation buttons
  prevButton.onclick = () => {
    if (!prevButton.disabled) previousQuestion();
  };

  // Keyboard support: Enter/Space on focused buttons
  [prevButton, submitButton, nextButton].forEach((btn) => {
    btn.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (!btn.disabled) btn.click();
      }
    });
  });
}

/**
 * Update progress bar based on answered questions
 */
function updateProgress() {
  const progressBar = domElements.progressBar;
  const questionCounter = domElements.questionCounter;
  const totalQ = document.getElementById("totalQ");
  if (!progressBar || !questionCounter || !totalQ) return;

  // Ensure we have a valid total
  const total = Number(
    Array.isArray(quizState.allQuestions) ? quizState.allQuestions.length : 0,
  );
  totalQ.textContent = total;
  if (total === 0) {
    progressBar.style.width = "0%";
    if (questionCounter) questionCounter.textContent = "0";
    if (totalQ) totalQ.textContent = "0";
    return;
  }

  // Calculate progress percentage based on current question index in filtered set
  const progress = ((quizState.currentQuestionIndex + 1) / total) * 100;
  progressBar.style.width = `${progress}%`;
  if (questionCounter)
    questionCounter.textContent = `${quizState.currentQuestionIndex + 1}`;
  if (totalQ) totalQ.textContent = total;
}

/**
 * Move to next question
 */
function nextQuestion() {
  // Clear explanation when moving to the next question
  const explanationDiv = document.getElementById("explanation");
  if (explanationDiv) {
    explanationDiv.innerHTML = "";
    explanationDiv.classList.remove("show");
  }

  if (quizState.currentQuestionIndex < quizState.allQuestions.length - 1) {
    quizState.currentQuestionIndex++;
    showQuestion();
    // Update navigation after moving to next question
    updateNavigation();
    persistQuizRuntime();
  } else {
    showResults();
  }
}

/**
 * Handle submit action (show feedback and explanation)
 */
function handleSubmit() {
  // Ensure an answer was selected and feedback hasn't been shown yet
  if (
    quizState.userAnswers[quizState.currentQuestionIndex] === undefined ||
    quizState.feedbackShown[quizState.currentQuestionIndex]
  )
    return;

  const question = quizState.allQuestions[quizState.currentQuestionIndex];
  const selectedIndex = quizState.userAnswers[quizState.currentQuestionIndex];
  const options = document.querySelectorAll(".option-btn");

  // Update UI to show correct/incorrect feedback
  options.forEach((option, index) => {
    option.classList.remove("selected", "correct", "incorrect");
    clearOptionFeedbackLabel(option);

    if (index === selectedIndex) {
      option.classList.add("selected");
      if (index === question.correct) {
        option.classList.add("correct");
      } else {
        option.classList.add("incorrect");
      }
    }

    if (index === question.correct) {
      option.classList.add("correct");
    }
    applyOptionFeedbackLabel(option);
  });

  // Show explanation immediately
  showExplanation();
  const explanationDiv = document.getElementById("explanation");
  if (explanationDiv) {
    explanationDiv.classList.add("show");
    explanationDiv.style.display = "block";
  }

  // Mark that feedback has been shown for this question
  quizState.feedbackShown[quizState.currentQuestionIndex] = true;

  // Update navigation to show Next button
  updateNavigation();
  persistQuizRuntime();
}

/**
 * Submit current answer (can be called from app.js) - kept for compatibility but not used in UI
 */
function submitAnswer() {
  // This function is now primarily for external compatibility if needed,
  // but the main submit logic is in handleSubmit for practice mode.
  // For other modes, it still advances.
  if (currentMode === "practice") {
    handleSubmit(); // Call the new submit handler
  } else {
    // For other modes, advance to next question
    if (quizState.currentQuestionIndex < quizState.allQuestions.length - 1) nextQuestion();
    else showResults();
  }
}

/**
 * Move to previous question
 */
function previousQuestion() {
  if (quizState.currentQuestionIndex > 0) {
    quizState.currentQuestionIndex--;
    showQuestion();
    // Update navigation after moving to previous question
    updateNavigation();
    persistQuizRuntime();
  }
}

/**
 * Calculate exam score when time runs out
 */
function calculateExamScore() {
  quizState.score = 0;
  for (let i = 0; i < quizState.allQuestions.length; i++) {
    if (
      quizState.userAnswers[i] !== undefined &&
      quizState.userAnswers[i] === quizState.allQuestions[i].correct
    ) {
      quizState.score++;
    }
  }
  debugLog(
    "Exam auto-submitted. Final score:",
    quizState.score,
    "out of",
    quizState.allQuestions.length,
  );
}

/**
 * Show explanation for the current question
 */
function showExplanation() {
  const explanationDiv = document.getElementById("explanation");
  if (!explanationDiv) return;

  const question = quizState.allQuestions[quizState.currentQuestionIndex];
  const selectedIndex = quizState.userAnswers[quizState.currentQuestionIndex];
  const hasAnswered = selectedIndex !== undefined;
  const isCorrect = hasAnswered && selectedIndex === question.correct;
  const correctLetter = String.fromCharCode(65 + question.correct);
  const selectedLetter = hasAnswered ? String.fromCharCode(65 + selectedIndex) : null;
  const selectedText = hasAnswered ? question.options?.[selectedIndex] || "" : "";
  const correctText = question.options?.[question.correct] || "";

  let statusPanel = "";
  if (currentMode === "practice" && hasAnswered) {
    statusPanel = `
      <section class="feedback-status ${isCorrect ? "feedback-status-correct" : "feedback-status-incorrect"}">
        <p class="feedback-verdict"><strong>${isCorrect ? "Correct response" : "Incorrect response"}</strong></p>
        <p><strong>Your answer:</strong> Option ${selectedLetter} ${selectedText ? `- ${selectedText}` : ""}</p>
        ${isCorrect ? "" : `<p><strong>Expected answer:</strong> Option ${correctLetter} ${correctText ? `- ${correctText}` : ""}</p>`}
      </section>
    `;
  } else if (currentMode === "review") {
    statusPanel = `
      <section class="feedback-status">
        <p class="feedback-verdict"><strong>Reference answer</strong></p>
        <p><strong>Correct answer:</strong> Option ${correctLetter} ${correctText ? `- ${correctText}` : ""}</p>
      </section>
    `;
  }

  explanationDiv.innerHTML = `
        <h4>Rationale</h4>
        ${statusPanel}
        <div class="explanation-body">${parseMarkdown(
          normalizeExplanationText(question.explanation),
        )}</div>
    `;
}

// Expose navigation functions for external wiring
export {
  previousQuestion,
  nextQuestion,
  submitAnswer,
  initializeQuiz,
  retakeFullQuiz,
};
// Also attach to window for compatibility
window.nextQuestion = nextQuestion;
window.previousQuestion = previousQuestion;
window.submitAnswer = submitAnswer;

function reviewIncorrectAnswers() {
  applyReviewFilter("incorrect");
}

function retakeFullQuiz() {
  if (quizState.originalQuestions.length > 0) {
    quizState.allQuestions = quizState.originalQuestions;
    quizState.originalQuestions = [];
    initializeQuiz();
    return true;
  }
  return false;
}

// Show quiz results
function showResults() {
  clearInterval(quizState.timer);
  clearPersistedQuizRuntime();
  calculateExamScore(); // Ensure score is calculated before displaying results
  const finalScore = document.getElementById("finalScore");
  const performanceText = document.getElementById("performanceText");
  if (!finalScore || !performanceText) return;

  // Update stats display
  const correctCount = document.getElementById("correctCount");
  const wrongCount = document.getElementById("wrongCount");
  const unansweredCount = document.getElementById("unansweredCount");
  const timeSpent = document.getElementById("timeSpent");

  quizState.incorrectAnswers = [];
  for (let i = 0; i < quizState.allQuestions.length; i++) {
    if (quizState.userAnswers[i] !== quizState.allQuestions[i].correct) {
      quizState.incorrectAnswers.push(quizState.allQuestions[i]);
    }
  }

  if (currentMode === "review") {
    if (reviewContext === "study") {
      showScreen("modeSelectionScreen");
      return;
    }
    showScreen("resultsScreen");
    return;
  }

  const answered = quizState.userAnswers.filter((answer) => answer !== undefined).length;
  const correct = quizState.score;
  const wrong = answered - correct;
  const unanswered = quizState.allQuestions.length - answered;

  if (correctCount) correctCount.textContent = correct;
  if (wrongCount) wrongCount.textContent = wrong;
  if (unansweredCount) unansweredCount.textContent = unanswered;
  if (timeSpent) {
    const timeElapsed = currentMode === "exam"
      ? quizState.allQuestions.length * 45 - quizState.timeLeft
      : quizState.timeLeft;
    const minutes = Math.floor(timeElapsed / 60);
    const seconds = timeElapsed % 60;
    timeSpent.textContent = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  }
  const scorePercentage = Math.round((quizState.score / quizState.allQuestions.length) * 100);
  const accuracyRate = Math.round((correct / answered) * 100) || 0;
  const unansweredRate = Math.round((unanswered / quizState.allQuestions.length) * 100) || 0;
  const wrongRate = Math.round((wrong / quizState.allQuestions.length) * 100) || 0;
  const overallTrafficClass = getTrafficClassByPercentage(scorePercentage);
  const accuracyTrafficClass = getTrafficClassByPercentage(accuracyRate);
  const unansweredTrafficClass = getInverseTrafficClassByPercentage(unansweredRate);
  const wrongTrafficClass = getInverseTrafficClassByPercentage(wrongRate);
  finalScore.textContent = `${scorePercentage}%`;
  applyTrafficClass(finalScore, overallTrafficClass);

  // Capture the just-completed quiz session for post-quiz review filters.
  lastCompletedSession = {
    questions: [...quizState.originalQuestions],
    userAnswers: [...quizState.userAnswers],
    topicId: currentTopic?.id || null,
    sourceMode: currentMode,
  };

  const progressSummary = recordAttemptResult({
    topicId: currentTopic?.id,
    topicName: currentTopic?.name,
    mode: currentMode,
    scorePercentage,
    totalQuestions: quizState.allQuestions.length,
  });
  const progressInsights = calculateProgressInsights(progressSummary, currentTopic?.id);
  const mockTopicBreakdown = isMockExamTopic(currentTopic)
    ? buildMockExamTopicBreakdown()
    : [];
  const mockBreakdownHtml = mockTopicBreakdown.length
    ? `
        <div class="section-head screen-header mock-breakdown-head">
            <h2>Mock Exam Topic Breakdown</h2>
            <p>Performance split across all sampled source topics.</p>
        </div>
        <div class="analytics-grid mock-breakdown-grid">
            ${mockTopicBreakdown
              .map(
                (entry) => `
                <div class="analytic-item mock-breakdown-item ${getTrafficClassByPercentage(entry.accuracy)}">
                    <div class="analytic-value">${entry.accuracy}%</div>
                    <div class="analytic-label">${entry.topicName}</div>
                    <p class="mock-breakdown-meta">${entry.correct}/${entry.answered} correct (answered)</p>
                    <p class="mock-breakdown-meta">Coverage: ${entry.answered}/${entry.total}</p>
                </div>
            `,
              )
              .join("")}
        </div>
      `
    : "";

  // Enhanced performance analysis
  let performanceMessage = "";
  let performanceClass = "";

  if (scorePercentage >= 90) {
    performanceMessage =
      "Outstanding! You have mastered this topic exceptionally well.";
    performanceClass = "excellent";
  } else if (scorePercentage >= 80) {
    performanceMessage =
      "Excellent! You have a strong understanding of this topic.";
    performanceClass = "excellent";
  } else if (scorePercentage >= 70) {
    performanceMessage = "Very Good! You have a solid grasp of the material.";
    performanceClass = "good";
  } else if (scorePercentage >= 60) {
    performanceMessage =
      "Good job! You have a good understanding of the key concepts.";
    performanceClass = "good";
  } else if (scorePercentage >= 50) {
    performanceMessage =
      "Fair performance. Review the material and strengthen weak areas.";
    performanceClass = "average";
  } else if (scorePercentage >= 40) {
    performanceMessage =
      "Keep practicing! Focus on understanding the core concepts.";
    performanceClass = "average";
  } else {
    performanceMessage =
      "This topic needs significant review. Consider studying the material more thoroughly.";
    performanceClass = "poor";
  }

  performanceText.textContent = performanceMessage;
  performanceText.className = `performance ${performanceClass}`;

  // Add detailed analytics
  const analyticsDiv =
    document.getElementById("categoryBreakdown") ||
    document.createElement("div");
  analyticsDiv.id = "categoryBreakdown";
    analyticsDiv.innerHTML = `
        <div class="section-head screen-header">
            <h2>Performance Insights</h2>
            <p>Track your strengths, weak points, and best next step.</p>
        </div>
        <div class="analytics-grid">
            <div class="analytic-item ${overallTrafficClass}">
                <div class="analytic-value">${scorePercentage}%</div>
                <div class="analytic-label">Overall Score</div>
            </div>
            <div class="analytic-item ${accuracyTrafficClass}">
                <div class="analytic-value">${correct}/${quizState.allQuestions.length}</div>
                <div class="analytic-label">Correct Answers</div>
            </div>
            <div class="analytic-item ${accuracyTrafficClass}">
                <div class="analytic-value">${accuracyRate}%</div>
                <div class="analytic-label">Accuracy Rate</div>
            </div>
            <div class="analytic-item ${unansweredTrafficClass}">
                <div class="analytic-value">${unanswered}</div>
                <div class="analytic-label">Unanswered</div>
            </div>
        </div>
        <div class="insight-grid">
            <article class="insight-card strongest">
                <p class="eyebrow">Strongest Area</p>
                <h3>${progressInsights.strongestTopic?.topicName || "Not enough data yet"}</h3>
                <p>${progressInsights.strongestTopic ? `${progressInsights.strongestTopic.avgScore}% average` : "Complete more sessions to unlock this insight."}</p>
            </article>
            <article class="insight-card weakest">
                <p class="eyebrow">Weakest Area</p>
                <h3>${progressInsights.weakestTopic?.topicName || "Not enough data yet"}</h3>
                <p>${progressInsights.weakestTopic ? `${progressInsights.weakestTopic.avgScore}% average` : "Complete more sessions to unlock this insight."}</p>
            </article>
            <article class="insight-card trend">
                <p class="eyebrow">Recent Trend</p>
                <h3>${progressInsights.avgRecentScore ?? "-"}${progressInsights.avgRecentScore !== null ? "%" : ""}</h3>
                <p>Based on your latest 5 attempts across topics.</p>
            </article>
            <article class="insight-card trend">
                <p class="eyebrow">Total Attempts</p>
                <h3>${progressInsights.attemptsCount}</h3>
                <p>Consistent practice improves retention and exam speed.</p>
            </article>
        </div>
        <div class="recommendation ${scorePercentage >= 70 ? "success" : "improvement"}">
            <strong>Recommended Next Action:</strong> ${progressInsights.recommendedTopic ? `Prioritize ${progressInsights.recommendedTopic} next.` : (scorePercentage >= 70 ? "You are ready for a timed drill in your next session." : "Review mistakes first, then retake this topic in Practice mode.")}
        </div>
        ${mockBreakdownHtml}
    `;

  // Insert analytics after stats if not already present
  if (!document.getElementById("categoryBreakdown")) {
    const statsDiv = document.getElementById("resultsStats");
    if (statsDiv) {
      statsDiv.parentNode.insertBefore(analyticsDiv, statsDiv.nextSibling);
    }
  }

  const resultHero = document.querySelector("#resultsScreen .result-hero");
  applyTrafficClass(resultHero, overallTrafficClass);

  const resultStatCards = Array.from(document.querySelectorAll("#resultsStats .stat-card"));
  if (resultStatCards.length >= 4) {
    applyTrafficClass(resultStatCards[0], accuracyTrafficClass);
    applyTrafficClass(resultStatCards[1], wrongTrafficClass);
    applyTrafficClass(resultStatCards[2], unansweredTrafficClass);
    applyTrafficClass(resultStatCards[3], accuracyTrafficClass);
  }

  const reviewIncorrectResultsBtn = document.getElementById("reviewIncorrectResultsBtn");
  if (reviewIncorrectResultsBtn) {
    if (quizState.incorrectAnswers.length > 0) {
      reviewIncorrectResultsBtn.classList.remove("hidden");
      reviewIncorrectResultsBtn.onclick = () => {
        startPostQuizReview("incorrect");
      };
    } else {
      reviewIncorrectResultsBtn.classList.add("hidden");
    }
  }

  const reviewAnswersBtn = document.getElementById("reviewAnswersBtn");
  if (reviewAnswersBtn) {
    reviewAnswersBtn.onclick = () => {
      startPostQuizReview("all");
    };
  }

  showScreen("resultsScreen");
}

export let currentTopic = null;
export let currentMode = "";

export function setCurrentTopic(topic) {
  debugLog("setCurrentTopic called with:", topic);
  currentTopic = topic;
}

export function setCurrentMode(mode) {
  debugLog("setCurrentMode called with:", mode);
  currentMode = mode;
  if (mode === "review") {
    reviewContext = "study";
    clearPersistedQuizRuntime();
  }
  
  // Update the quiz mode display in the header
  const quizModeDisplay = document.getElementById("quizModeDisplay");
  if (quizModeDisplay) {
    let modeText = mode;
    switch(mode) {
      case "practice":
        modeText = "Practice";
        break;
      case "exam":
        modeText = "Exam";
        break;
      case "review":
        modeText = "Review";
        break;
      default:
        modeText = mode.charAt(0).toUpperCase() + mode.slice(1);
    }
    quizModeDisplay.textContent = modeText;
  }
}

export function getCurrentMode() {
  return currentMode;
}

// Load questions for the selected topic
export async function loadQuestions(questions = null) {
  if (questions) {
    quizState.allQuestions = questions;
    quizState.originalQuestions = questions;
    initializeQuiz({ context: currentMode === "review" ? "study" : "session" });
    return;
  }


  try {
    if (!currentTopic) {
      throw new Error("Invalid topic selected");
    }

    if (!getCurrentUser()) {
      throw new Error("Please login to continue.");
    }

    const quizContainer = document.getElementById("quizScreen");
    if (!quizContainer) {
      throw new Error("Quiz screen element not found");
    }

    showScreen("quizScreen");
    let loadingEl = quizContainer.querySelector(".loading");
    if (!loadingEl) {
      loadingEl = document.createElement("div");
      loadingEl.className = "loading";
      loadingEl.textContent = "Loading questions...";
      const quizContentGrid = quizContainer.querySelector(".quiz-content-grid");
      if (quizContentGrid) quizContentGrid.parentNode.insertBefore(loadingEl, quizContentGrid);
      else (quizContainer.querySelector(".quiz-card") || quizContainer).appendChild(loadingEl);
    } else {
      loadingEl.textContent = "Loading questions...";
    }

    if (isMockExamTopic(currentTopic)) {
      quizState.allQuestions = await buildMockExamQuestions(currentTopic);
    } else {
      if (!currentTopic.file) {
        throw new Error("Invalid topic selected");
      }
      const selectedCategory = currentTopic.selectedCategory || "all";
      const entitlement = getCurrentEntitlement();
      const extractionOptions = {
        allowedCategoryIds:
          Array.isArray(currentTopic.allowedCategoryIds) &&
          currentTopic.allowedCategoryIds.length
            ? currentTopic.allowedCategoryIds
            : null,
        maxQuestionsPerSubcategory:
          typeof entitlement.maxQuestionsPerSubcategory === "number"
            ? entitlement.maxQuestionsPerSubcategory
            : null,
      };
      const topicDataFiles = await fetchTopicDataFiles(currentTopic, { tolerateFailures: true });

      quizState.allQuestions = [];
      topicDataFiles.forEach((topicData) => {
        quizState.allQuestions.push(
          ...extractQuestionsByCategory(topicData, selectedCategory, extractionOptions),
        );
      });
    }

    if (quizState.allQuestions.length === 0) {
      showError("No questions found for this topic/category.");
      showScreen("topicSelectionScreen");
      return;
    }

    quizState.allQuestions = shuffleArray(quizState.allQuestions);
    const targetQuestionCap =
      Number(currentTopic?.mockExamQuestionCount) > 0
        ? Number(currentTopic.mockExamQuestionCount)
        : 40;
    if (quizState.allQuestions.length > targetQuestionCap) {
      quizState.allQuestions = quizState.allQuestions.slice(0, targetQuestionCap);
    }

    initializeQuiz({ context: currentMode === "review" ? "study" : "session" });
  } catch (error) {
    console.error("Error loading questions:", error);
    showError("Failed to load questions. Please try again.");
    showScreen("topicSelectionScreen");
  }
}

let reviewFilter = "all";

function startPostQuizReview(filter = "all") {
  if (!lastCompletedSession || !lastCompletedSession.questions?.length) {
    showError("No completed quiz session available for review.");
    return;
  }

  setCurrentMode("review");
  reviewContext = "session";
  quizState.allQuestions = [...lastCompletedSession.questions];
  quizState.originalQuestions = [...lastCompletedSession.questions];
  quizState.userAnswers = [...lastCompletedSession.userAnswers];
  quizState.currentQuestionIndex = 0;
  quizState.feedbackShown = new Array(quizState.allQuestions.length).fill(true);

  initializeQuiz({ preserveAnswers: true, context: "session", keepOriginalQuestions: true });
  applyReviewFilter(filter);
}

function jumpToQuestion(index) {
    if (currentMode === "review") {
        if (index < 0 || index >= quizState.allQuestions.length) return;
        quizState.currentQuestionIndex = index;
        showQuestion();
        if (reviewContext === "session") {
            showReviewControls();
        }
    } else {
        quizState.currentQuestionIndex = index;
        showQuestion();
    }
}

function applyReviewFilter(filter) {
    if (currentMode !== "review" || reviewContext !== "session") {
        return;
    }
    reviewFilter = filter;
    quizState.allQuestions = getFilteredQuestions();
    quizState.currentQuestionIndex = 0;
    if (quizState.allQuestions.length > 0) {
        showQuestion();
        showReviewControls();
    } else {
        showError("No questions match the selected filter.");
    }
}

function isTypingTarget(target) {
  if (!target) return false;
  const tag = String(target.tagName || "").toLowerCase();
  return (
    tag === "input" ||
    tag === "textarea" ||
    tag === "select" ||
    Boolean(target.isContentEditable)
  );
}

function isQuizScreenActive() {
  const quizScreen = document.getElementById("quizScreen");
  return Boolean(quizScreen && !quizScreen.classList.contains("hidden"));
}

function getCurrentOptionCount() {
  const question = quizState.allQuestions[quizState.currentQuestionIndex];
  return Array.isArray(question?.options) ? question.options.length : 0;
}

function handleLetterSelection(event) {
  if (currentMode === "review") return false;
  const key = String(event.key || "").toLowerCase();
  const keyMap = { a: 0, b: 1, c: 2, d: 3, "1": 0, "2": 1, "3": 2, "4": 3 };
  if (!(key in keyMap)) return false;

  const index = keyMap[key];
  if (index >= getCurrentOptionCount()) return false;
  selectOption(index);
  return true;
}

function moveSelectionByArrow(delta) {
  if (currentMode === "review") return false;
  const optionCount = getCurrentOptionCount();
  if (!optionCount) return false;

  const selected = quizState.userAnswers[quizState.currentQuestionIndex];
  const base = typeof selected === "number" ? selected : delta > 0 ? -1 : 0;
  const nextIndex = (base + delta + optionCount) % optionCount;
  selectOption(nextIndex);
  return true;
}

function triggerById(id) {
  const button = document.getElementById(id);
  if (!button || button.disabled || button.classList.contains("hidden")) return false;
  button.click();
  return true;
}

function handleQuizKeyboardShortcuts(event) {
  if (!isQuizScreenActive()) return;
  if (event.defaultPrevented) return;
  if (event.metaKey || event.ctrlKey || event.altKey) return;
  if (isTypingTarget(event.target)) return;

  if (handleLetterSelection(event)) {
    event.preventDefault();
    return;
  }

  if (event.key === "ArrowUp") {
    if (moveSelectionByArrow(-1)) event.preventDefault();
    return;
  }

  if (event.key === "ArrowDown") {
    if (moveSelectionByArrow(1)) event.preventDefault();
    return;
  }

  if (event.key === "ArrowLeft") {
    if (triggerById("prevBtn")) event.preventDefault();
    return;
  }

  if (event.key === "ArrowRight") {
    if (triggerById("nextBtn")) event.preventDefault();
    return;
  }

  if (event.key === "Enter") {
    if (currentMode === "practice") {
      if (triggerById("submitBtn") || triggerById("nextBtn")) {
        event.preventDefault();
      }
      return;
    }
    if (triggerById("nextBtn")) {
      event.preventDefault();
    }
  }
}

let keyboardShortcutsBound = false;
function bindKeyboardShortcuts() {
  if (keyboardShortcutsBound) return;
  keyboardShortcutsBound = true;
  document.addEventListener("keydown", handleQuizKeyboardShortcuts);
}

let quizPersistenceBound = false;
function bindQuizPersistence() {
  if (quizPersistenceBound) return;
  quizPersistenceBound = true;

  window.addEventListener("beforeunload", () => {
    persistQuizRuntime();
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      persistQuizRuntime();
    }
  });
}

function getFilteredQuestions() {
    switch (reviewFilter) {
        case "correct":
            return quizState.originalQuestions.filter((q, i) => quizState.userAnswers[i] === q.correct);
        case "incorrect":
            return quizState.originalQuestions.filter((q, i) => quizState.userAnswers[i] !== undefined && quizState.userAnswers[i] !== q.correct);
        case "unanswered":
            return quizState.originalQuestions.filter((q, i) => quizState.userAnswers[i] === undefined);
        default:
            return quizState.originalQuestions;
    }
}

document.getElementById("reviewAllBtn").onclick = () => applyReviewFilter("all");
document.getElementById("reviewCorrectBtn").onclick = () => applyReviewFilter("correct");
document.getElementById("reviewIncorrectBtn").onclick = () => applyReviewFilter("incorrect");
document.getElementById("reviewUnansweredBtn").onclick = () => applyReviewFilter("unanswered");
bindKeyboardShortcuts();
bindQuizPersistence();

function showReviewControls() {
    const reviewControls = document.getElementById("reviewControls");
    const reviewNavigator = document.getElementById("reviewNavigator");
    const reviewFilters = document.getElementById("reviewFilters");

    if (reviewControls && reviewNavigator) {
        if (reviewContext !== "session") {
            reviewControls.classList.add("hidden");
            return;
        }

        reviewControls.classList.remove("hidden");
        reviewNavigator.innerHTML = "";

        if (reviewFilters) {
            reviewFilters.querySelectorAll(".chip").forEach((chip) => chip.classList.remove("active"));
            const activeMap = {
                all: "reviewAllBtn",
                correct: "reviewCorrectBtn",
                incorrect: "reviewIncorrectBtn",
                unanswered: "reviewUnansweredBtn",
            };
            const activeChip = document.getElementById(activeMap[reviewFilter]);
            if (activeChip) activeChip.classList.add("active");
        }

        quizState.allQuestions.forEach((question, index) => {
            const navBtn = document.createElement("button");
            navBtn.className = "nav-btn";
            navBtn.textContent = index + 1;
            navBtn.onclick = () => jumpToQuestion(index);

            const originalIndex = quizState.originalQuestions.indexOf(question);
            const answer = quizState.userAnswers[originalIndex];

            if (answer === undefined) {
                navBtn.classList.add("unanswered");
            } else if (answer === question.correct) {
                navBtn.classList.add("correct");
            } else {
                navBtn.classList.add("incorrect");
            }

            if (index === quizState.currentQuestionIndex) {
                navBtn.classList.add("current");
            }

            reviewNavigator.appendChild(navBtn);
        });
    }
}

function showQuestionMap() {
    const questionMap = document.getElementById("questionMap");

    if (questionMap) {
        questionMap.classList.remove("hidden");
        questionMap.innerHTML = "";

        quizState.allQuestions.forEach((_, index) => {
            const navBtn = document.createElement("button");
            navBtn.className = "nav-btn";
            navBtn.textContent = index + 1;
            navBtn.onclick = () => jumpToQuestion(index);

            if (quizState.userAnswers[index] !== undefined) {
                navBtn.classList.add("answered");
            }

            if (index === quizState.currentQuestionIndex) {
                navBtn.classList.add("current");
            }

            questionMap.appendChild(navBtn);
        });
    }
}

// Initialize the quiz
function initializeQuiz(options = {}) {
  const {
    preserveAnswers = false,
    context = "study",
    keepOriginalQuestions = false,
    restoreState = null,
  } = options;

  reviewContext = context;
  if (!keepOriginalQuestions) {
    quizState.originalQuestions = [...quizState.allQuestions];
  }
  quizState.score = 0;
  const totalQuestions = quizState.allQuestions.length;
  if (restoreState && typeof restoreState === "object") {
    quizState.currentQuestionIndex = clampIndex(restoreState.currentQuestionIndex, totalQuestions);
    quizState.userAnswers = normalizeRuntimeAnswers(restoreState.userAnswers, totalQuestions);
    quizState.feedbackShown = normalizeRuntimeFeedback(restoreState.feedbackShown, totalQuestions);
  } else {
    quizState.currentQuestionIndex = 0;
    if (!preserveAnswers) {
      quizState.userAnswers = [];
    } else {
      quizState.userAnswers = normalizeRuntimeAnswers(quizState.userAnswers, totalQuestions);
    }
    // Initialize feedbackShown array to track if feedback has been shown for each question
    quizState.feedbackShown = new Array(totalQuestions).fill(false);
  }

  // Show the quiz screen first, then set up timer
  showScreen("quizScreen");

  // Now that the screen is shown, get DOM elements
  getDOMElements();

  if (currentMode === "review" && reviewContext === "session") {
    showReviewControls();
    const questionMap = document.getElementById("questionMap");
    if (questionMap) {
      questionMap.classList.add("hidden");
    }
  } else {
    const reviewControls = document.getElementById("reviewControls");
    if (reviewControls) {
      reviewControls.classList.add("hidden");
    }
    showQuestionMap();
  }

  // Set up timer if in exam mode
  const timerContainer = document.getElementById("timerDisplay");
  const timerBadge = timerContainer ? timerContainer.querySelector(".timer-badge") : null;
  if (currentMode === "exam") {
    // Set 45 seconds per question for exam mode (total exam time)
    const maxExamTime = quizState.allQuestions.length * 45;
    if (restoreState && Number.isFinite(Number(restoreState.timeLeft))) {
      quizState.timeLeft = Math.max(0, Math.min(maxExamTime, Number(restoreState.timeLeft)));
    } else {
      quizState.timeLeft = maxExamTime;
    }
    clearInterval(quizState.timer); // Clear any existing timer before starting a new one
    startTimer();

    // Show and style exam mode specific UI
    if (timerContainer) {
      timerContainer.classList.remove("hidden");
      timerContainer.classList.add("modern-timer");
      timerContainer.setAttribute("title", "Remaining time");
    }
    if (timerBadge) {
      timerBadge.textContent = "Timer";
    }
    updatePracticePacingNotice();
  } else if (currentMode === "practice") {
    if (restoreState && Number.isFinite(Number(restoreState.timeLeft))) {
      quizState.timeLeft = Math.max(0, Number(restoreState.timeLeft));
    } else {
      quizState.timeLeft = 0;
    }
    clearInterval(quizState.timer);
    startTimer();

    if (timerContainer) {
      timerContainer.classList.remove("hidden");
      timerContainer.classList.add("modern-timer");
      timerContainer.setAttribute("title", "Elapsed time");
    }
    if (timerBadge) {
      timerBadge.textContent = "Elapsed";
    }
    updatePracticePacingNotice();
  } else {
    clearInterval(quizState.timer);
    quizState.timeLeft = 0;
    updateTimerDisplay();

    // Hide timer for non-exam modes
    if (timerContainer) {
      timerContainer.classList.add("hidden");
      timerContainer.classList.remove("modern-timer");
      timerContainer.setAttribute("title", "Remaining time");
    }
    if (timerBadge) {
      timerBadge.textContent = "Timer";
    }
    updatePracticePacingNotice();
  }
  // Remove loading indicator if present
  const quizContainer = document.getElementById("quizScreen");
  const loadingEl = quizContainer
    ? quizContainer.querySelector(".loading")
    : null;
  if (loadingEl) loadingEl.remove();

  // Update topic title
  const topicTitleElement = document.getElementById("quizTopicTitle");
  if (topicTitleElement && currentTopic) {
    topicTitleElement.textContent = `Topic: ${currentTopic.name}`;
  }

  showQuestion();

  // Initialize progress bar
  updateProgress();
  persistQuizRuntime();
}


