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
const submitButton = document.getElementById('submitBtn');
const nextButton = document.getElementById('nextBtn');
const prevButton = document.getElementById('prevBtn');
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

        // Add warning when time is running low
        if (timeLeft === 300) { // 5 minutes
            showTimeWarning("5 minutes remaining!");
        } else if (timeLeft === 180) { // 3 minutes
            showTimeWarning("3 minutes remaining!");
        } else if (timeLeft === 60) { // 1 minute
            showTimeWarning("1 minute remaining!");
        } else if (timeLeft === 30) { // 30 seconds
            showTimeWarning("30 seconds remaining!");
        } else if (timeLeft <= 10 && timeLeft > 0) { // Last 10 seconds
            showTimeWarning(`${timeLeft} seconds remaining!`);
        }

        if (timeLeft <= 0) {
            clearInterval(timer);
            // Auto-submit exam when time runs out
            if (currentMode === 'exam') {
                console.log('Exam time expired - auto-submitting');
                // Calculate score for answered questions
                calculateExamScore();
            }
            showResults();
        }
    }, 1000);
}

// Show time warning
function showTimeWarning(message) {
    const timerDisplay = document.getElementById('timeLeft');
    if (timerDisplay) {
        // Make timer more urgent based on time remaining
        if (timeLeft <= 60) {
            timerDisplay.style.backgroundColor = '#dc3545'; // Red background for urgency
            timerDisplay.style.animation = 'urgentPulse 0.5s infinite';
        } else {
            timerDisplay.style.color = '#f44336'; // Red color for warning
            timerDisplay.style.fontWeight = 'bold';
        }

        // Create warning element
        let warningEl = document.getElementById('timeWarning');
        if (!warningEl) {
            warningEl = document.createElement('div');
            warningEl.id = 'timeWarning';
            warningEl.style.position = 'fixed';
            warningEl.style.top = '60px';
            warningEl.style.right = '20px';
            warningEl.style.backgroundColor = timeLeft <= 60 ? '#dc3545' : '#ff9800';
            warningEl.style.color = 'white';
            warningEl.style.padding = '15px 20px';
            warningEl.style.borderRadius = '8px';
            warningEl.style.zIndex = '1000';
            warningEl.style.boxShadow = '0 4px 15px rgba(0,0,0,0.4)';
            warningEl.style.fontSize = '1.1rem';
            warningEl.style.fontWeight = 'bold';
            warningEl.style.textAlign = 'center';
            document.body.appendChild(warningEl);
        }

        warningEl.textContent = message;

        // Remove warning after appropriate time based on urgency
        const warningDuration = timeLeft <= 60 ? 5000 : 3000;
        setTimeout(() => {
            if (warningEl && warningEl.parentNode) {
                warningEl.parentNode.removeChild(warningEl);
            }
            // Reset timer display color
            if (timerDisplay) {
                timerDisplay.style.color = '';
                timerDisplay.style.fontWeight = '';
                timerDisplay.style.backgroundColor = currentMode === 'exam' ? '#dc3545' : '';
                timerDisplay.style.animation = timeLeft <= 60 ? 'urgentPulse 0.5s infinite' : '';
            }
        }, warningDuration);
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
        
        // In practice mode, if feedback has already been shown for this question, display it and update navigation
        if (currentMode === 'practice' && feedbackShown[currentQuestionIndex]) {
            setTimeout(() => {
                showExplanation();
                const explanationDiv = document.getElementById('explanation');
                if (explanationDiv) {
                    explanationDiv.classList.add('show');
                    explanationDiv.style.display = 'block';
                }
                // Update navigation to show Next button since feedback was already shown
                updateNavigation();
            }, 100);
        }
    } else {
        optionsContainer.innerHTML = '<div class="error-message">No options found for this question.</div>';
    }

    // Update navigation and progress
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

    // Update navigation to handle button state
    updateNavigation();
}

// Update navigation buttons
function updateNavigation() {
    const submitButton = document.getElementById('submitBtn');
    const nextButton = document.getElementById('nextBtn');
    const prevButton = document.getElementById('prevBtn');
    if (!submitButton || !nextButton || !prevButton) return;

    // Previous button
    prevButton.disabled = currentQuestionIndex === 0;
    prevButton.setAttribute('aria-disabled', prevButton.disabled);
    prevButton.title = prevButton.disabled ? 'No previous question' : 'Go to previous question';
    prevButton.textContent = 'Previous';

    if (currentMode === 'review') {
        // In review mode, next button is always enabled
        nextButton.disabled = false;
        submitButton.style.display = 'none';
        nextButton.style.display = 'inline-flex';
    } else if (currentMode === 'exam') {
        // In exam mode, disable previous button after answering to prevent going back
        prevButton.disabled = userAnswers[currentQuestionIndex] !== undefined || currentQuestionIndex === 0;
        prevButton.setAttribute('aria-disabled', prevButton.disabled);
        prevButton.title = prevButton.disabled ? 'Cannot go back after answering' : 'Go to previous question';

        // Enable next button once an answer is selected
        nextButton.disabled = userAnswers[currentQuestionIndex] === undefined;
        submitButton.style.display = 'none';
        nextButton.style.display = 'inline-flex';
    } else {
        // In practice mode, handle Submit/Next button visibility
        if (userAnswers[currentQuestionIndex] === undefined) {
            // No answer selected yet - show Next button (disabled)
            submitButton.style.display = 'none';
            nextButton.style.display = 'inline-flex';
            nextButton.disabled = true;
            nextButton.textContent = 'Next';
            nextButton.onclick = () => {
                if (!nextButton.disabled) nextQuestion();
            };
        } else if (!feedbackShown[currentQuestionIndex]) {
            // Answer selected but feedback not shown yet - show Submit button
            submitButton.style.display = 'inline-flex';
            nextButton.style.display = 'none';
            submitButton.disabled = false;
            submitButton.onclick = () => {
                if (!submitButton.disabled) handleSubmit();
            };
        } else {
            // Answer selected and feedback shown - show Next button
            submitButton.style.display = 'none';
            nextButton.style.display = 'inline-flex';
            nextButton.disabled = false;
            nextButton.textContent = 'Next';
            nextButton.onclick = () => {
                if (!nextButton.disabled) nextQuestion();
            };
        }
    }

    // Handle last question
    if (currentQuestionIndex === allQuestions.length - 1) {
        if (currentMode === 'review') {
            nextButton.textContent = 'End Review';
        } else if (currentMode === 'exam') {
            nextButton.textContent = 'Submit Exam';
        } else {
            nextButton.textContent = 'Finish Quiz';
        }
        nextButton.onclick = () => {
            if (!nextButton.disabled) showResults();
        };
    }

    // Add click event listeners for navigation buttons
    prevButton.onclick = () => {
        if (!prevButton.disabled) previousQuestion();
    };

    // Keyboard support: Enter/Space on focused buttons
    [prevButton, submitButton, nextButton].forEach(btn => {
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
    // Clear explanation when moving to the next question
    const explanationDiv = document.getElementById('explanation');
    if (explanationDiv) {
        explanationDiv.innerHTML = '';
        explanationDiv.classList.remove('show');
    }

    if (currentQuestionIndex < allQuestions.length - 1) {
        currentQuestionIndex++;
        showQuestion();
        // Update navigation after moving to next question
        updateNavigation();
    } else {
        showResults();
    }
}

// Handle submit action (show feedback and explanation)
function handleSubmit() {
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
        explanationDiv.style.display = 'block';
    }
    
    // Mark that feedback has been shown for this question
    feedbackShown[currentQuestionIndex] = true;

    // Update navigation to show Next button
    updateNavigation();
}

// Submit current answer (can be called from app.js) - kept for compatibility but not used in UI
function submitAnswer() {
    // This function is now primarily for external compatibility if needed,
    // but the main submit logic is in handleSubmit for practice mode.
    // For other modes, it still advances.
    if (currentMode === 'practice') {
        handleSubmit(); // Call the new submit handler
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
        // Update navigation after moving to previous question
        updateNavigation();
    }
}

// Calculate exam score when time runs out
function calculateExamScore() {
    score = 0;
    for (let i = 0; i < allQuestions.length; i++) {
        if (userAnswers[i] !== undefined && userAnswers[i] === allQuestions[i].correct) {
            score++;
        }
    }
    console.log('Exam auto-submitted. Final score:', score, 'out of', allQuestions.length);
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

    // Enhanced performance analysis
    let performanceMessage = '';
    let performanceClass = '';

    if (scorePercentage >= 90) {
        performanceMessage = 'Outstanding! You have mastered this topic exceptionally well.';
        performanceClass = 'excellent';
    } else if (scorePercentage >= 80) {
        performanceMessage = 'Excellent! You have a strong understanding of this topic.';
        performanceClass = 'excellent';
    } else if (scorePercentage >= 70) {
        performanceMessage = 'Very Good! You have a solid grasp of the material.';
        performanceClass = 'good';
    } else if (scorePercentage >= 60) {
        performanceMessage = 'Good job! You have a good understanding of the key concepts.';
        performanceClass = 'good';
    } else if (scorePercentage >= 50) {
        performanceMessage = 'Fair performance. Review the material and strengthen weak areas.';
        performanceClass = 'average';
    } else if (scorePercentage >= 40) {
        performanceMessage = 'Keep practicing! Focus on understanding the core concepts.';
        performanceClass = 'average';
    } else {
        performanceMessage = 'This topic needs significant review. Consider studying the material more thoroughly.';
        performanceClass = 'poor';
    }

    performanceText.textContent = performanceMessage;
    performanceText.className = `performance ${performanceClass}`;

    // Add detailed analytics
    const analyticsDiv = document.getElementById('categoryBreakdown') || document.createElement('div');
    analyticsDiv.id = 'categoryBreakdown';
    analyticsDiv.innerHTML = `
        <h3>📊 Performance Analysis</h3>
        <div class="analytics-grid">
            <div class="analytic-item">
                <div class="analytic-value">${scorePercentage}%</div>
                <div class="analytic-label">Overall Score</div>
            </div>
            <div class="analytic-item">
                <div class="analytic-value">${correct}/${allQuestions.length}</div>
                <div class="analytic-label">Correct Answers</div>
            </div>
            <div class="analytic-item">
                <div class="analytic-value">${Math.round((correct/allQuestions.length) * 100)}%</div>
                <div class="analytic-label">Accuracy Rate</div>
            </div>
            <div class="analytic-item">
                <div class="analytic-value">${unanswered}</div>
                <div class="analytic-label">Unanswered</div>
            </div>
        </div>
        <div class="recommendation">
            <strong>Recommendation:</strong> ${scorePercentage >= 70 ? 'You\'re ready for the next level!' : 'Consider reviewing this topic before advancing.'}
        </div>
    `;

    // Insert analytics after stats if not already present
    if (!document.getElementById('categoryBreakdown')) {
        const statsDiv = document.getElementById('resultsStats');
        if (statsDiv) {
            statsDiv.parentNode.insertBefore(analyticsDiv, statsDiv.nextSibling);
        }
    }
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
            // Load questions for the topic with proper path construction
            console.log('BASE_URL:', window.BASE_URL, 'topic.file:', topic.file);
            const filePath = window.BASE_URL.endsWith('/') || topic.file.startsWith('/') ? `${window.BASE_URL}${topic.file}` : `${window.BASE_URL}/${topic.file}`;
            console.log('Constructed filePath:', filePath);
            response = await fetch(filePath);
            if (!response.ok) throw new Error(`Failed to fetch ${topic.file}: ${response.status}`);
            const responseText = await response.text();
            console.log('Response text length:', responseText.length);

            // Check if response is HTML (error page) instead of JSON
            if (responseText.trim().startsWith('<')) {
                throw new Error(`Server returned HTML error page instead of JSON for ${topic.file}`);
            }

            topicData = JSON.parse(responseText);
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
        // Set 45 seconds per question for exam mode (total exam time)
        timeLeft = allQuestions.length * 45;
        startTimer();

        // Show and style exam mode specific UI
        const timerDisplay = document.getElementById('timerDisplay');
        if (timerDisplay) {
            timerDisplay.classList.remove('hidden');
            timerDisplay.style.display = 'block'; // Ensure timer is visible
            timerDisplay.style.backgroundColor = '#dc3545'; // Red background for urgency
            timerDisplay.style.color = 'white';
            timerDisplay.style.fontWeight = 'bold';
            timerDisplay.style.fontSize = '1.2rem';
            timerDisplay.style.padding = '10px 15px';
            timerDisplay.style.borderRadius = '8px';
            timerDisplay.style.position = 'fixed';
            timerDisplay.style.top = '20px';
            timerDisplay.style.right = '20px';
            timerDisplay.style.zIndex = '1000';
            timerDisplay.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.3)';
            timerDisplay.style.animation = 'urgentPulse 1s infinite'; // Add pulsing animation
        }
    } else {
        timeLeft = 0;
        updateTimerDisplay();
        
        // Hide timer for non-exam modes
        const timerDisplay = document.getElementById('timerDisplay');
        if (timerDisplay) {
            timerDisplay.classList.add('hidden');
            timerDisplay.style.display = 'none'; // Ensure timer is hidden
            timerDisplay.style.animation = ''; // Remove animation
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
