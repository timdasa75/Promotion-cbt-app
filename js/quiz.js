 // quiz.js - Module for quiz logic

import { showScreen, showError } from './ui.js';

// Global variables for quiz state
let allQuestions = [];
let currentQuestionIndex = 0;
let score = 0;
let userAnswers = [];
let feedbackShown = []; // Track if feedback has been shown for each question
let timer;
let timeLeft = 0;
let currentTopic = null;
let currentMode = '';

// DOM Elements
const questionElement = document.getElementById('questionText');
const optionsContainer = document.getElementById('optionsContainer');
const nextButton = document.getElementById('nextBtn');
const prevButton = document.getElementById('prevBtn');
const submitButton = document.getElementById('submitAnswerBtn');
const progressBar = document.getElementById('progressFill');
const questionCounter = document.getElementById('currentQ');
const timerDisplay = document.getElementById('timeLeft');
const finalScore = document.getElementById('finalScore');
const performanceText = document.getElementById('performanceText');

// Shuffle array (Fisher-Yates algorithm)
function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

// Start the timer
function startTimer() {
    updateTimerDisplay();
    timer = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();

        // Add warning when time is running low (less than 5 minutes)
        if (timeLeft === 300) { // 5 minutes
            showTimeWarning("5 minutes remaining!");
        } else if (timeLeft === 60) { // 1 minute
            showTimeWarning("1 minute remaining!");
        } else if (timeLeft === 30) { // 30 seconds
            showTimeWarning("30 seconds remaining!");
        }

        if (timeLeft <= 0) {
            clearInterval(timer);
            showResults();
        }
    }, 1000);
}

// Show time warning
function showTimeWarning(message) {
    const timerDisplay = document.getElementById('timeLeft');
    if (timerDisplay) {
        timerDisplay.style.color = '#f44336'; // Red color for warning
        timerDisplay.style.fontWeight = 'bold';

        // Create warning element
        let warningEl = document.getElementById('timeWarning');
        if (!warningEl) {
            warningEl = document.createElement('div');
            warningEl.id = 'timeWarning';
            warningEl.style.position = 'fixed';
            warningEl.style.top = '60px';
            warningEl.style.right = '20px';
            warningEl.style.backgroundColor = '#f44336';
            warningEl.style.color = 'white';
            warningEl.style.padding = '10px 15px';
            warningEl.style.borderRadius = '4px';
            warningEl.style.zIndex = '1000';
            warningEl.style.boxShadow = '0 2px 10px rgba(0,0,0,0.3)';
            document.body.appendChild(warningEl);
        }
        
        warningEl.textContent = message;
        
        // Remove warning after 3 seconds
        setTimeout(() => {
            if (warningEl && warningEl.parentNode) {
                warningEl.parentNode.removeChild(warningEl);
            }
            // Reset timer display color
            if (timerDisplay) {
                timerDisplay.style.color = '';
                timerDisplay.style.fontWeight = '';
            }
        }, 3000);
    }
}

// Update the timer display
function updateTimerDisplay() {
    const timerDisplay = document.getElementById('timeLeft');
    if (!timerDisplay) return;

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerDisplay.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

// Show the current question
function showQuestion() {
    console.log('showQuestion called, index:', currentQuestionIndex, 'of', allQuestions.length);
    if (currentQuestionIndex >= allQuestions.length) {
        showResults();
        return;
    }
    const question = allQuestions[currentQuestionIndex];
    console.log('Current question:', question);
    // Query DOM elements here to ensure they exist
    const questionElement = document.getElementById('questionText');
    const optionsContainer = document.getElementById('optionsContainer');
    const quizScreen = document.getElementById('quizScreen');
    console.log('showQuestion DOM check:', {questionElement, optionsContainer, quizScreen});
    if (!questionElement || !optionsContainer || !quizScreen) {
        console.error('Quiz screen or question elements not found in DOM.');
        showError('Quiz screen or question elements not found. Please check your HTML IDs.');
        return;
    }
    // Make sure quiz screen is visible
    quizScreen.classList.remove('hidden');
    quizScreen.classList.add('active');
    questionElement.textContent = `${currentQuestionIndex + 1}. ${question.question}`;

    // Clear previous options
    optionsContainer.innerHTML = '';

    // Handle explanation visibility based on mode
    const explanationDiv = document.getElementById('explanation');
    if (explanationDiv) {
        // Don't clear explanation content when moving from question to question in practice mode
        // Only clear if we're not in practice mode or if we're not viewing a question that's already been answered
        if (currentMode !== 'practice' || userAnswers[currentQuestionIndex] === undefined || !feedbackShown[currentQuestionIndex]) {
            explanationDiv.innerHTML = '';
        }
        explanationDiv.classList.remove('show');
        
        // Hide explanation container in exam mode
        if (currentMode === 'exam') {
            explanationDiv.style.display = 'none';
        } else {
            explanationDiv.style.display = 'block';
        }
    }

    // Add new options
    if (question.options && Array.isArray(question.options)) {
        question.options.forEach((option, index) => {
            const button = document.createElement('button');
            button.className = 'option-btn';
            button.innerHTML = `
                <span class="option-letter">${String.fromCharCode(65 + index)}</span>
                ${option}
            `;
            
            // Different behavior based on mode
            if (currentMode === 'review') {
                button.disabled = true;
                // In review mode, show user's actual answer and whether it was correct
                if (userAnswers[currentQuestionIndex] !== undefined) {
                    if (userAnswers[currentQuestionIndex] === index) {
                        button.classList.add('selected');
                        if (index === question.correct) {
                            button.classList.add('correct');  // User selected correct answer
                        } else {
                            button.classList.add('incorrect');  // User selected wrong answer
                        }
                    }
                    // Also show the correct answer
                    if (index === question.correct) {
                        button.classList.add('correct');
                    }
                }
            } else if (currentMode === 'exam') {
                // In exam mode, options are not disabled until selected
                // Once an option is selected, it stays selected and disabled
                button.onclick = () => selectOption(index);
            } else { // Practice mode
                button.onclick = () => selectOption(index);
            }
            
            // If user already answered this question, show their answer
            if (userAnswers[currentQuestionIndex] !== undefined) {
                if (userAnswers[currentQuestionIndex] === index) {
                    button.classList.add('selected');
                    // In exam and review modes, keep the button disabled after selection
                    if (currentMode === 'exam') {
                        button.disabled = true;
                    }
                }
                
                // In exam and review modes, show correct/incorrect feedback
                // In practice mode, don't show feedback to allow experimentation
                if (currentMode !== 'practice') {
                    if (index === question.correct) {
                        button.classList.add('correct');
                    } else if (userAnswers[currentQuestionIndex] === index && index !== question.correct) {
                        button.classList.add('incorrect');
                    }
                }
            }
            
            optionsContainer.appendChild(button);
        });
        
        // In practice mode, if feedback has already been shown for this question, display it
        if (currentMode === 'practice' && feedbackShown[currentQuestionIndex]) {
            setTimeout(() => {
                showExplanation();
                const explanationDiv = document.getElementById('explanation');
                if (explanationDiv) {
                    explanationDiv.classList.add('show');
                }
            }, 300);
        }
    } else {
        optionsContainer.innerHTML = '<div class="error-message">No options found for this question.</div>';
    }

    // Update navigation
    updateNavigation();
    updateProgress();
}

// Handle option selection
function selectOption(selectedIndex) {
    const question = allQuestions[currentQuestionIndex];
    
    // For exam mode: record answer but don't show feedback immediately
    if (currentMode === 'exam') {
        userAnswers[currentQuestionIndex] = selectedIndex;
        
        // Disable all options to prevent changing answer
        const options = document.querySelectorAll('.option-btn');
        options.forEach(option => {
            option.disabled = true;
        });
        
        // Mark selected option without showing if it's correct/incorrect
        options.forEach((option, index) => {
            if (index === selectedIndex) {
                option.classList.add('selected');
            }
        });
        
        // Enable next button
        nextButton.disabled = false;
        updateNavigation();
        
        // Don't show explanation in exam mode
        const explanationDiv = document.getElementById('explanation');
        if (explanationDiv) {
            explanationDiv.classList.remove('show');
        }
        return;
    }
    
    // For practice and review modes: show immediate feedback
    // Store the selected answer but don't increment score (score calculated at end)
    userAnswers[currentQuestionIndex] = selectedIndex;
    
    // Query DOM elements inside function
    const optionsContainer = document.getElementById('optionsContainer');
    if (!optionsContainer) return;

    // Update UI
    const options = document.querySelectorAll('.option-btn');
    options.forEach((option, index) => {
        // Don't disable options in practice mode to allow changing answers
        option.classList.remove('selected', 'correct', 'incorrect');

        if (index === selectedIndex) {
            option.classList.add('selected');
            // Don't show correct/incorrect in practice mode to allow experimentation
        }
    });

    // Update navigation to handle button state (text will be handled by updateNavigation)
    nextButton.disabled = false;
    updateNavigation();
}

// Update navigation buttons
function updateNavigation() {
    const nextButton = document.getElementById('nextBtn');
    const prevButton = document.getElementById('prevBtn');
    if (!nextButton || !prevButton) return;
    // Previous button
    prevButton.disabled = currentQuestionIndex === 0;
    prevButton.setAttribute('aria-disabled', prevButton.disabled);
    prevButton.title = prevButton.disabled ? 'No previous question' : 'Go to previous question';
    prevButton.textContent = 'Previous';

    // Next button behavior
    if (currentMode === 'review' || currentMode === 'exam') {
        // In exam mode, always enable next button once an answer is selected
        // In review mode, next button is always enabled
        nextButton.disabled = false;
    } else {
        // In practice mode, disable next until an answer is selected
        nextButton.disabled = userAnswers[currentQuestionIndex] === undefined;
    }
    nextButton.setAttribute('aria-disabled', nextButton.disabled);

    if (currentQuestionIndex === allQuestions.length - 1) {
        nextButton.textContent = currentMode === 'review' ? 'End Review' : (currentMode === 'exam' ? 'Submit Exam' : 'Finish Quiz');
        nextButton.onclick = () => {
            if (!nextButton.disabled) showResults();
        };
    } else {
        // For practice mode, set appropriate text based on whether answer has been selected and shown
        if (currentMode === 'practice') {
            if (userAnswers[currentQuestionIndex] === undefined) {
                nextButton.textContent = 'Next';
            } else if (!feedbackShown[currentQuestionIndex]) {
                // Answer selected but feedback not shown yet - show Submit
                nextButton.textContent = 'Submit';
            } else {
                // Answer selected and feedback shown - show Next
                nextButton.textContent = 'Next';
            }
        } else {
            nextButton.textContent = 'Next';
        }
        
        nextButton.onclick = () => {
            if (!nextButton.disabled) {
                if (nextButton.textContent === 'Submit' && currentMode === 'practice') {
                    // In practice mode, when clicking "Submit", show feedback but don't advance to next question
                    // Call the submit logic which shows feedback
                    submitAnswer();
                } else {
                    // For all other cases (including when button says "Next"), proceed to next question
                    nextQuestion();
                }
            }
        };
    }

    // Keyboard support: Enter/Space on focused buttons
    [prevButton, nextButton].forEach(btn => {
        btn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                if (!btn.disabled) btn.click();
            }
        });
    });
}

// Update progress bar
function updateProgress() {
    const progressBar = document.getElementById('progressFill');
    const questionCounter = document.getElementById('currentQ');
    const totalQ = document.getElementById('totalQ');
    if (!progressBar || !questionCounter || !totalQ) return;

    if (currentMode === 'review') {
        progressBar.style.width = '100%';
        if (questionCounter) questionCounter.textContent = `${currentQuestionIndex + 1}`;
        return;
    }
    // Ensure we have a valid total
    const total = Array.isArray(allQuestions) ? allQuestions.length : 0;
    totalQ.textContent = total;
    if (total === 0) {
        progressBar.style.width = '0%';
        questionCounter.textContent = '0';
        return;
    }

    const progress = ((currentQuestionIndex) / total) * 100;
    progressBar.style.width = `${progress}%`;
    if (questionCounter) questionCounter.textContent = `${currentQuestionIndex + 1}`;
}

// Move to next question
function nextQuestion() {
    // For all cases except practice mode with unshown feedback, proceed to next question
    if (currentQuestionIndex < allQuestions.length - 1) {
        currentQuestionIndex++;
        showQuestion();
    } else {
        showResults();
    }
}

// Submit current answer (can be called from app.js) - kept for compatibility but not used in UI
function submitAnswer() {
    // In practice mode, submitting shows feedback but doesn't advance to next question
    if (currentMode === 'practice') {
        // Ensure an answer was selected and feedback hasn't been shown yet
        if (userAnswers[currentQuestionIndex] === undefined || feedbackShown[currentQuestionIndex]) return;
        
        const question = allQuestions[currentQuestionIndex];
        const selectedIndex = userAnswers[currentQuestionIndex];
        const options = document.querySelectorAll('.option-btn');
        
        // Update UI to show correct/incorrect feedback
        options.forEach((option, index) => {
            option.classList.remove('selected', 'correct', 'incorrect');
            
            if (index === selectedIndex) {
                option.classList.add('selected');
                if (index === question.correct) {
                    option.classList.add('correct');
                } else {
                    option.classList.add('incorrect');
                }
            }
            
            if (index === question.correct) {
                option.classList.add('correct');
            }
        });
        
        // Show explanation immediately
        showExplanation();
        const explanationDiv = document.getElementById('explanation');
        if (explanationDiv) {
            explanationDiv.classList.add('show');
        }
        
        // Mark that feedback has been shown for this question
        feedbackShown[currentQuestionIndex] = true;
        
        // Update navigation to change button text to "Next"
        updateNavigation();
    } else {
        // For other modes, advance to next question
        if (currentQuestionIndex < allQuestions.length - 1) nextQuestion();
        else showResults();
    }
}

// Expose navigation functions for external wiring
export { previousQuestion, nextQuestion, submitAnswer, currentMode };
// Also attach to window for compatibility
window.nextQuestion = nextQuestion;
window.previousQuestion = previousQuestion;
window.submitAnswer = submitAnswer;

// Move to previous question
function previousQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        showQuestion();
    }
}

// Show explanation for the current question
function showExplanation() {
    const explanationDiv = document.getElementById('explanation');
    if (!explanationDiv) return;

    const question = allQuestions[currentQuestionIndex];
    explanationDiv.innerHTML = `
        <h4>Explanation:</h4>
        <p>${question.explanation || 'No explanation available.'}</p>
    `;
}

// Show quiz results
function showResults() {
    clearInterval(timer);
    const finalScore = document.getElementById('finalScore');
    const performanceText = document.getElementById('performanceText');
    if (!finalScore || !performanceText) return;

    // Update stats display
    const correctCount = document.getElementById('correctCount');
    const wrongCount = document.getElementById('wrongCount');
    const unansweredCount = document.getElementById('unansweredCount');
    const timeSpent = document.getElementById('timeSpent');
    
    if (currentMode === 'review') {
        finalScore.textContent = 'Review Complete';
        performanceText.textContent = 'You have reviewed all questions and answers.';
        if (correctCount) correctCount.parentElement.style.display = 'none';
        if (wrongCount) wrongCount.parentElement.style.display = 'none';
        if (unansweredCount) unansweredCount.parentElement.style.display = 'none';
        if (timeSpent) timeSpent.parentElement.style.display = 'none';
        showScreen('resultsScreen');
        return;
    }

    const answered = userAnswers.filter(answer => answer !== undefined).length;
    const correct = score;
    const wrong = answered - correct;
    const unanswered = allQuestions.length - answered;
    
    if (correctCount) correctCount.textContent = correct;
    if (wrongCount) wrongCount.textContent = wrong;
    if (unansweredCount) unansweredCount.textContent = unanswered;
    if (timeSpent) {
        const minutes = Math.floor((allQuestions.length * 30 - timeLeft) / 60);
        const seconds = (allQuestions.length * 30 - timeLeft) % 60;
        timeSpent.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    }

    const scorePercentage = Math.round((score / allQuestions.length) * 100);
    finalScore.textContent = `${scorePercentage}%`;
    
    // Set performance text
    let performanceMessage = '';
    if (scorePercentage >= 80) {
        performanceMessage = 'Excellent! You have a strong understanding of this topic.';
    } else if (scorePercentage >= 60) {
        performanceMessage = 'Good job! You have a good grasp of the material.';
    } else if (scorePercentage >= 40) {
        performanceMessage = 'Keep practicing! Review the material and try again.';
    } else {
        performanceMessage = 'Consider reviewing the material before trying again.';
    }
    performanceText.textContent = performanceMessage;
    showScreen('resultsScreen');
}

// Load questions for the selected topic
export async function loadQuestions(topic, mode) {
    try {
        if (!topic || !topic.file) {
            throw new Error('Invalid topic selected');
        }
        
        console.log('Loading questions for topic:', topic.name, 'in mode:', mode);
        currentTopic = topic;
        currentMode = mode;

        // Show loading state without wiping out quizScreen children
        const quizContainer = document.getElementById('quizScreen');
        if (!quizContainer) {
            throw new Error('Quiz screen element not found');
        }
        // Ensure quiz screen is visible
        showScreen('quizScreen');
        let loadingEl = quizContainer.querySelector('.loading');
        if (!loadingEl) {
            loadingEl = document.createElement('div');
            loadingEl.className = 'loading';
            loadingEl.textContent = 'Loading questions...';
            // Insert loading indicator before the quiz content grid
            const quizContentGrid = quizContainer.querySelector('.quiz-content-grid');
            if (quizContentGrid) quizContainer.insertBefore(loadingEl, quizContentGrid);
            else quizContainer.appendChild(loadingEl);
        } else {
            loadingEl.textContent = 'Loading questions...';
        }

        // Load questions for the topic
        let response, topicData;
        try {
            // Determine base path dynamically
            const basePath = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ?
              '' : '/Promotion-cbt-app';
            response = await fetch(`${basePath}/data/${topic.file}`);
            if (!response.ok) throw new Error(`Failed to fetch ${topic.file}: ${response.status}`);
            topicData = await response.json();
            console.log('Loaded topic data:', topicData);
        } catch (fetchErr) {
            console.error('Fetch error:', fetchErr);
            showError('Could not load questions for this topic. Please check your data files.');
            showScreen('topicSelectionScreen');
            return;
        }

        // Process questions based on category selection
        allQuestions = [];
        let selectedCategory = topic.selectedCategory || 'all';
        
        if (selectedCategory === 'all') {
            // Load all questions from the topic
            if (topicData.hasSubcategories && topicData.subcategories) {
                // Handle new structure with subcategories
                for (const subcategory of topicData.subcategories) {
                    if (subcategory.questions) {
                        allQuestions = allQuestions.concat(subcategory.questions);
                    }
                }
            } else if (topicData.psr_categories) {
                // Legacy structure
                for (const category in topicData.psr_categories) {
                    const subcategory = topicData.psr_categories[category];
                    if (subcategory.questions) {
                        allQuestions = allQuestions.concat(subcategory.questions);
                    }
                }
            } else if (topicData.questions) {
                // Simple structure
                allQuestions = topicData.questions;
            }
        } else {
            // Load questions for specific category only
            if (topicData.hasSubcategories && topicData.subcategories) {
                const selectedSubcategory = topicData.subcategories.find(sub => sub.id === selectedCategory);
                if (selectedSubcategory && selectedSubcategory.questions) {
                    allQuestions = selectedSubcategory.questions;
                }
            } else if (topicData.psr_categories) {
                // Legacy structure - find the category
                const subcategory = topicData.psr_categories[selectedCategory];
                if (subcategory && subcategory.questions) {
                    allQuestions = subcategory.questions;
                }
            }
        }
        
        console.log('Extracted questions:', allQuestions);

        if (allQuestions.length === 0) {
            showError('No questions found for this topic/category.');
            showScreen('topicSelectionScreen');
            return;
        }

        // Shuffle questions
        allQuestions = shuffleArray(allQuestions);

        // Limit to 40 questions for the quiz
        if (allQuestions.length > 40) {
            allQuestions = allQuestions.slice(0, 40);
        }

        // Initialize quiz
        initializeQuiz();

    } catch (error) {
        console.error('Error loading questions:', error);
        showError('Failed to load questions. Please try again.');
        showScreen('topicSelectionScreen');
    }
}

// Initialize the quiz
function initializeQuiz() {
    currentQuestionIndex = 0;
    score = 0;
    userAnswers = [];
    // Initialize feedbackShown array to track if feedback has been shown for each question
    feedbackShown = new Array(allQuestions.length).fill(false);

    // Set up timer if in exam mode
    if (currentMode === 'exam') {
        // Set 45 seconds per question for exam mode
        timeLeft = allQuestions.length * 45; 
        startTimer();
        
        // Show exam mode specific UI
        const timerDisplay = document.getElementById('timerDisplay');
        if (timerDisplay) {
            timerDisplay.classList.remove('hidden');
        }
    } else {
        timeLeft = 0;
        updateTimerDisplay();
        
        // Hide timer for non-exam modes
        const timerDisplay = document.getElementById('timerDisplay');
        if (timerDisplay) {
            timerDisplay.classList.add('hidden');
        }
    }

    // Show the quiz screen first, then render the question
    showScreen('quizScreen');
    // Remove loading indicator if present
    const quizContainer = document.getElementById('quizScreen');
    const loadingEl = quizContainer ? quizContainer.querySelector('.loading') : null;
    if (loadingEl) loadingEl.remove();

    // Update topic title
    const topicTitleElement = document.getElementById('quizTopicTitle');
    if (topicTitleElement && currentTopic) {
        topicTitleElement.textContent = `Topic: ${currentTopic.name}`;
    }

    showQuestion();
}
