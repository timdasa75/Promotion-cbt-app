// quiz.js - Module for quiz logic

import { showScreen, showError } from "./ui.js";

/**
 * Markdown parser for basic formatting
 * @param {string} text - Text to convert to HTML
 * @returns {string} HTML formatted text
 */
function parseMarkdown(text) {
  if (!text || typeof text !== "string") return text || "";

  let html = text;

  // Convert headers (### Header)
  html = html.replace(/^### (.*$)/gim, "<h3>$1</h3>");
  html = html.replace(/^## (.*$)/gim, "<h2>$1</h2>");
  html = html.replace(/^# (.*$)/gim, "<h1>$1</h1>");

  // Convert **bold** and __bold__
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/__(.*?)__/g, "<strong>$1</strong>");

  // Convert *italic* and _italic_
  html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");
  html = html.replace(/_(.*?)_/g, "<em>$1</em>");

  // Convert `code`
  html = html.replace(/`(.*?)`/g, "<code>$1</code>");

  // Convert line breaks (double space at end of line)
  html = html.replace(/  \n/g, "<br>");

  // Convert paragraphs (separate text blocks with double newline)
  html = html.replace(/\n\n/g, "</p><p>");

  // Replace any remaining newlines with line breaks
  html = html.replace(/\n/g, "<br>");

  // Wrap in paragraph tags if not already wrapped
  if (
    !html.startsWith("<p>") &&
    !html.startsWith("<h") &&
    !html.startsWith("<")
  ) {
    html = "<p>" + html + "</p>";
  } else if (html.startsWith("<")) {
    // If it starts with HTML tags, still wrap non-header content in paragraphs
    html = "<p>" + html + "</p>";
  }

  // Clean up multiple paragraph tags that might have formed
  html = html.replace(/<\/p><p><\/p><p>/g, "</p><p>");

  return html;
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

/**
 * DOM Elements cache
 */
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
    quizState.timeLeft--;
    updateTimerDisplay();

    if (quizState.timeLeft <= 0) {
      clearInterval(quizState.timer);
      // Auto-submit exam when time runs out
      if (currentMode === "exam") {
        console.log("Exam time expired - auto-submitting");
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

/**
 * Update the timer display
 */
function updateTimerDisplay() {
  const timeLeftElement = document.getElementById("timeLeft");
  if (!timeLeftElement) return;

  const minutes = Math.floor(quizState.timeLeft / 60);
  const seconds = quizState.timeLeft % 60;
  timeLeftElement.textContent = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;

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
  console.log(
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
  console.log("Current question:", question);
  
  // Query DOM elements here to ensure they exist
  const questionElement = document.getElementById("questionText");
  const optionsContainer = document.getElementById("optionsContainer");
  const quizScreen = document.getElementById("quizScreen");
  console.log("showQuestion DOM check:", {
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
                  ${parseMarkdown(option)}
              `;
  
        // Different behavior based on mode
        if (currentMode === "review") {
          button.disabled = true;
          // In review mode, show user's actual answer and whether it was correct
          const originalQuestionIndex = quizState.originalQuestions.indexOf(question);
          if (quizState.userAnswers[originalQuestionIndex] !== undefined) {
            if (quizState.userAnswers[originalQuestionIndex] === index) {
              button.classList.add("selected");
              if (index !== question.correct) {
                button.classList.add("user-incorrect"); // User selected wrong answer
              }
            }
            // Also show the correct answer
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
            // In exam and review modes, keep the button disabled after selection
            if (currentMode === "exam") {
              button.disabled = true;
            }
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
  } else {
    optionsContainer.innerHTML =
      '<div class="error-message">No options found for this question.</div>';
  }

  // Update navigation and progress
  updateNavigation();
  updateProgress();
  if (currentMode !== "review") {
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

    // Disable all options to prevent changing answer
    const options = document.querySelectorAll(".option-btn");
    options.forEach((option) => {
      option.disabled = true;
    });

    // Mark selected option without showing if it's correct/incorrect
    options.forEach((option, index) => {
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
    // In review mode, next button is always enabled
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
    // In exam mode, disable previous button after answering to prevent going back
    prevButton.disabled =
      quizState.userAnswers[quizState.currentQuestionIndex] !== undefined ||
      quizState.currentQuestionIndex === 0;
    prevButton.setAttribute("aria-disabled", prevButton.disabled);
    prevButton.title = prevButton.disabled
      ? "Cannot go back after answering"
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
      nextButton.textContent = "End Review";
      nextButton.onclick = () => {
        if (!nextButton.disabled) showResults();
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
  console.log(
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
  explanationDiv.innerHTML = `
        <h4>Explanation:</h4>
        <p>${parseMarkdown(question.explanation || "No explanation available.")}</p>
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
    finalScore.textContent = "Review Complete";
    performanceText.textContent =
      "You have reviewed all questions and answers.";
    if (correctCount) correctCount.parentElement.style.display = "none";
    if (wrongCount) wrongCount.parentElement.style.display = "none";
    if (unansweredCount) unansweredCount.parentElement.style.display = "none";
    if (timeSpent) timeSpent.parentElement.style.display = "none";
    
    // Hide the review incorrect button if it's already shown
    const reviewIncorrectBtn = document.getElementById("reviewIncorrectBtn");
    if (reviewIncorrectBtn) {
      reviewIncorrectBtn.classList.add("hidden");
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
    // Calculate initial total time based on exam mode settings
    const initialTotalTime = quizState.allQuestions.length * 45; // 45 seconds per question in exam mode
    const timeElapsed = initialTotalTime - quizState.timeLeft;
    const minutes = Math.floor(timeElapsed / 60);
    const seconds = timeElapsed % 60;
    timeSpent.textContent = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  }
  const scorePercentage = Math.round((quizState.score / quizState.allQuestions.length) * 100);
  finalScore.textContent = `${scorePercentage}%`;

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
        <h3>📊 Performance Analysis</h3>
        <div class="analytics-grid">
            <div class="analytic-item">
                <div class="analytic-value">${scorePercentage}%</div>
                <div class="analytic-label">Overall Score</div>
            </div>
            <div class="analytic-item">
                <div class="analytic-value">${correct}/${quizState.allQuestions.length}</div>
                <div class="analytic-label">Correct Answers</div>
            </div>
            <div class="analytic-item">
                <div class="analytic-value">${Math.round((correct / answered) * 100) || 0}%</div>
                <div class="analytic-label">Accuracy Rate</div>
            </div>
            <div class="analytic-item">
                <div class="analytic-value">${unanswered}</div>
                <div class="analytic-label">Unanswered</div>
            </div>
        </div>
        <div class="recommendation ${scorePercentage >= 70 ? "success" : "improvement"}">
            <strong>Recommendation:</strong> ${scorePercentage >= 70 ? "You're ready for the next level!" : "Consider reviewing this topic before advancing."}
        </div>
    `;

  // Insert analytics after stats if not already present
  if (!document.getElementById("categoryBreakdown")) {
    const statsDiv = document.getElementById("resultsStats");
    if (statsDiv) {
      statsDiv.parentNode.insertBefore(analyticsDiv, statsDiv.nextSibling);
    }
  }

  const reviewIncorrectBtn = document.getElementById("reviewIncorrectBtn");
  if (reviewIncorrectBtn) {
    if (quizState.incorrectAnswers.length > 0) {
      reviewIncorrectBtn.classList.remove("hidden");
      reviewIncorrectBtn.onclick = () => {
        currentMode = "review";
        initializeQuiz();
        applyReviewFilter("incorrect");
      };
    } else {
      reviewIncorrectBtn.classList.add("hidden");
    }
  }

  const reviewAnswersBtn = document.getElementById("reviewAnswersBtn");
  if (reviewAnswersBtn) {
    reviewAnswersBtn.onclick = () => {
      currentMode = "review";
      initializeQuiz();
      applyReviewFilter("all");
    };
  }

  showScreen("resultsScreen");
}

export let currentTopic = null;
export let currentMode = "";

export function setCurrentTopic(topic) {
  console.log("setCurrentTopic called with:", topic);
  currentTopic = topic;
}

export function setCurrentMode(mode) {
  console.log("setCurrentMode called with:", mode);
  currentMode = mode;
  
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
    initializeQuiz();
    return;
  }
  try {
    if (!currentTopic || !currentTopic.file) {
      throw new Error("Invalid topic selected");
    }

    console.log(
      "Loading questions for topic:",
      currentTopic.name,
      "in mode:",
      currentMode,
    );

    // Show loading state without wiping out quizScreen children
    const quizContainer = document.getElementById("quizScreen");
    if (!quizContainer) {
      throw new Error("Quiz screen element not found");
    }
    // Ensure quiz screen is visible
    showScreen("quizScreen");
    let loadingEl = quizContainer.querySelector(".loading");
    if (!loadingEl) {
      loadingEl = document.createElement("div");
      loadingEl.className = "loading";
      loadingEl.textContent = "Loading questions...";
      // Insert loading indicator before the quiz content grid
      // With new structure, quizContentGrid is inside the quiz-card div
      const quizContentGrid = quizContainer.querySelector(".quiz-content-grid");
      if (quizContentGrid) {
        // Insert before quizContentGrid in its parent
        quizContentGrid.parentNode.insertBefore(loadingEl, quizContentGrid);
      } else {
        const quizCard = quizContainer.querySelector(".quiz-card");
        if (quizCard) {
          quizCard.appendChild(loadingEl);
        } else {
          quizContainer.appendChild(loadingEl);
        }
      }
    } else {
      loadingEl.textContent = "Loading questions...";
    }

    // Load questions for the topic
    let response, topicData;
    try {
      // Load questions for the topic with proper path construction
      console.log(
        "BASE_URL:",
        window.BASE_URL,
        "currentTopic.file:",
        currentTopic.file,
      );
      const filePath =
        window.BASE_URL.endsWith("/") || currentTopic.file.startsWith("/")
          ? `${window.BASE_URL}${currentTopic.file}`
          : `${window.BASE_URL}/${currentTopic.file}`;
      console.log("Constructed filePath:", filePath);
      response = await fetch(filePath);
      if (!response.ok)
        throw new Error(
          `Failed to fetch ${currentTopic.file}: ${response.status}`,
        );
      const responseText = await response.text();
      console.log("Response text length:", responseText.length);

      // Check if response is HTML (error page) instead of JSON
      if (responseText.trim().startsWith("<")) {
        throw new Error(
          `Server returned HTML error page instead of JSON for ${currentTopic.file}`,
        );
      }

      topicData = JSON.parse(responseText);
      console.log("Loaded topic data:", topicData);
    } catch (fetchErr) {
      console.error("Fetch error:", fetchErr);
      showError(
        "Could not load questions for this topic. Please check your data files.",
      );
      showScreen("topicSelectionScreen");
      return;
    }

    // Process questions based on category selection
    quizState.allQuestions = [];
    let selectedCategory = currentTopic.selectedCategory || "all";

    if (selectedCategory === "all") {
      // Load all questions from the topic
      if (Array.isArray(topicData)) {
        // Handle direct array of subcategories (e.g., psr.json format)
        for (const subcategory of topicData) {
          if (
            subcategory &&
            subcategory.questions &&
            Array.isArray(subcategory.questions)
          ) {
            quizState.allQuestions = quizState.allQuestions.concat(subcategory.questions);
          }
        }
      } else if (topicData.domains && Array.isArray(topicData.domains)) {
        // Handle structure with domains containing topics (e.g., financial.json format)
        for (const domain of topicData.domains) {
          if (domain.topics && Array.isArray(domain.topics)) {
            for (const subcategory of domain.topics) {
              if (
                subcategory &&
                subcategory.questions &&
                Array.isArray(subcategory.questions)
              ) {
                quizState.allQuestions = quizState.allQuestions.concat(subcategory.questions);
              }
            }
          }
        }
      } else if (
        topicData.hasSubcategories &&
        topicData.subcategories &&
        Array.isArray(topicData.subcategories)
      ) {
        // Handle new structure with subcategories array
        for (const subcategory of topicData.subcategories) {
          if (
            subcategory &&
            subcategory.questions &&
            Array.isArray(subcategory.questions)
          ) {
            quizState.allQuestions = quizState.allQuestions.concat(subcategory.questions);
          }
        }
      } else if (topicData.psr_categories) {
        // Handle legacy structure with psr_categories
        for (const cat in topicData.psr_categories) {
          const subcategory = topicData.psr_categories[cat];
          if (
            subcategory &&
            subcategory.questions &&
            Array.isArray(subcategory.questions)
          ) {
            quizState.allQuestions = quizState.allQuestions.concat(subcategory.questions);
          }
        }
      } else if (topicData.questions && Array.isArray(topicData.questions)) {
        // Check for the specific nested structure of ca_general
        if (selectedCategory === "ca_general" && topicData.questions.length > 0 && topicData.questions[0].ca_general) {
          quizState.allQuestions = topicData.questions[0].ca_general;
        } else {
          // Simple structure with direct questions array
          quizState.allQuestions = topicData.questions;
        }
      }
    } else {
      // Load questions for specific category only
      if (Array.isArray(topicData)) {
        const selectedSubcategory = topicData.find(
          (sub) => sub && sub.id === selectedCategory,
        );
        if (
          selectedSubcategory &&
          selectedSubcategory.questions &&
          Array.isArray(selectedSubcategory.questions)
        ) {
          // Check for the specific nested structure of ca_general within a subcategory
          if (selectedCategory === "ca_general" && selectedSubcategory.questions.length > 0 && selectedSubcategory.questions[0].ca_general) {
            quizState.allQuestions = selectedSubcategory.questions[0].ca_general;
          } else {
            quizState.allQuestions = selectedSubcategory.questions;
          }
        }
      } else if (topicData.domains && Array.isArray(topicData.domains)) {
        for (const domain of topicData.domains) {
          if (domain.topics && Array.isArray(domain.topics)) {
            const selectedSubcategory = domain.topics.find(
              (sub) => sub && sub.id === selectedCategory,
            );
            if (
              selectedSubcategory &&
              selectedSubcategory.questions &&
              Array.isArray(selectedSubcategory.questions)
            ) {
              quizState.allQuestions = selectedSubcategory.questions;
              break; // Found the subcategory, no need to check other domains
            }
          }
        }
      } else if (
        topicData.hasSubcategories &&
        topicData.subcategories &&
        Array.isArray(topicData.subcategories)
      ) {
        const selectedSubcategory = topicData.subcategories.find(
          (sub) => sub && sub.id === selectedCategory,
        );
        if (
          selectedSubcategory &&
          selectedSubcategory.questions &&
          Array.isArray(selectedSubcategory.questions)
        ) {
          quizState.allQuestions = selectedSubcategory.questions;
        }
      } else if (topicData.psr_categories) {
        // Legacy structure - find the category
        const subcategory = topicData.psr_categories[selectedCategory];
        if (
          subcategory &&
          subcategory.questions &&
          Array.isArray(subcategory.questions)
        ) {
          quizState.allQuestions = subcategory.questions;
        }
      }
    }

    console.log("Extracted questions:", quizState.allQuestions);

    if (quizState.allQuestions.length === 0) {
      // Check if we're dealing with current affairs and the selected subcategory is empty
      if (currentTopic && currentTopic.id === "current_affairs") {
        // For current affairs, if a specific subcategory has no questions,
        // we should show a more informative message
        if (currentTopic.selectedCategory && currentTopic.selectedCategory !== "all") {
          // Find the selected category to get its name
          let selectedCategoryName = currentTopic.selectedCategory;
          if (topicData && topicData.subcategories && Array.isArray(topicData.subcategories)) {
            const selectedCat = topicData.subcategories.find(cat => cat && cat.id === currentTopic.selectedCategory);
            if (selectedCat && selectedCat.name) {
              selectedCategoryName = selectedCat.name;
            }
          }
          showError(`No questions are currently available for the selected subcategory: ${selectedCategoryName}. Please select a different subcategory or 'All Categories'.`);
          showScreen("categorySelectionScreen");
          return;
        }
      }
      
      showError("No questions found for this topic/category.");
      showScreen("topicSelectionScreen");
      return;
    }

    // Shuffle questions
    quizState.allQuestions = shuffleArray(quizState.allQuestions);

    // Limit to 40 questions for the quiz (or fewer if subcategory has fewer questions)
    if (quizState.allQuestions.length > 40) {
      quizState.allQuestions = quizState.allQuestions.slice(0, 40);
    }

    // Initialize quiz
    initializeQuiz();
  } catch (error) {
    console.error("Error loading questions:", error);
    showError("Failed to load questions. Please try again.");
    showScreen("topicSelectionScreen");
  }
}

let reviewFilter = "all";

function jumpToQuestion(index) {
    if (currentMode === "review") {
        const question = quizState.originalQuestions[index];
        const filteredIndex = quizState.allQuestions.indexOf(question);
        if (filteredIndex !== -1) {
            quizState.currentQuestionIndex = filteredIndex;
            showQuestion();
            showReviewControls();
        } else {
            showError("Question not found in current filter.");
        }
    } else {
        quizState.currentQuestionIndex = index;
        showQuestion();
    }
}

function applyReviewFilter(filter) {
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

function showReviewControls() {
    const reviewControls = document.getElementById("reviewControls");
    const reviewNavigator = document.getElementById("reviewNavigator");

    if (reviewControls && reviewNavigator) {
        reviewControls.classList.remove("hidden");
        reviewNavigator.innerHTML = "";

        quizState.originalQuestions.forEach((_, index) => {
            const navBtn = document.createElement("button");
            navBtn.className = "nav-btn";
            navBtn.textContent = index + 1;
            navBtn.onclick = () => jumpToQuestion(index);

            const answer = quizState.userAnswers[index];
            const question = quizState.originalQuestions[index];

            if (answer === undefined) {
                navBtn.classList.add("unanswered");
            } else if (answer === question.correct) {
                navBtn.classList.add("correct");
            } else {
                navBtn.classList.add("incorrect");
            }

            if (quizState.allQuestions[quizState.currentQuestionIndex] === quizState.originalQuestions[index]) {
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
function initializeQuiz() {
  quizState.originalQuestions = [...quizState.allQuestions];
  quizState.currentQuestionIndex = 0;
  quizState.score = 0;
  quizState.userAnswers = [];
  // Initialize feedbackShown array to track if feedback has been shown for each question
  quizState.feedbackShown = new Array(quizState.allQuestions.length).fill(false);

  // Show the quiz screen first, then set up timer
  showScreen("quizScreen");

  // Now that the screen is shown, get DOM elements
  getDOMElements();

  if (currentMode === "review") {
    showReviewControls();
    const questionMap = document.getElementById("questionMap");
    if(questionMap) {
        questionMap.classList.add("hidden");
    }
  } else {
    const reviewControls = document.getElementById("reviewControls");
    if(reviewControls) {
        reviewControls.classList.add("hidden");
    }
    showQuestionMap();
  }

  // Set up timer if in exam mode
  if (currentMode === "exam") {
    // Set 45 seconds per question for exam mode (total exam time)
    quizState.timeLeft = quizState.allQuestions.length * 45;
    clearInterval(quizState.timer); // Clear any existing timer before starting a new one
    startTimer();

    // Show and style exam mode specific UI
    const timerContainer = document.getElementById("timerDisplay");
    if (timerContainer) {
      timerContainer.classList.remove("hidden");
      timerContainer.classList.add("modern-timer");
    }
  } else {
    quizState.timeLeft = 0;
    updateTimerDisplay();

    // Hide timer for non-exam modes
    const timerContainer = document.getElementById("timerDisplay");
    if (timerContainer) {
      timerContainer.classList.add("hidden");
      timerContainer.classList.remove("modern-timer");
    }
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
}
