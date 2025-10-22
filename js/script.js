// script.js - Main JavaScript for Nigerian PSR 2021 CBT Quiz

// Global variables
let allQuestions = [];
let topics = [];
let currentQuestionIndex = 0;
let score = 0;
let userAnswers = [];
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
const quizTitle = document.getElementById('modeQuizTitle');
const quizDescription = document.getElementById('modeQuizDescription');

// Load data from JSON files
async function loadData() {
    try {
        // Load topics
        // Determine base path dynamically for GitHub Pages
        const isGitHubPages = window.location.hostname.includes('github.io');
        const basePath = isGitHubPages ? '/Promotion-cbt-app' : '';
        const response = await fetch(`${basePath}/data/topics.json`);
        const data = await response.json();
        topics = data.topics || [];

        if (topics.length === 0) {
            throw new Error('No topics found');
        }

        // Display topics
        displayTopics();
    } catch (error) {
        console.error('Error loading data:', error);
        showError('Failed to load quiz data. Please try again later.');
    }
}

// Display available topics
function displayTopics() {
    const topicList = document.getElementById('topicList');
    topicList.innerHTML = '';

    topics.forEach(topic => {
        const topicCard = document.createElement('div');
        topicCard.className = 'mode-card';
        topicCard.innerHTML = `
            <div class="mode-icon">📚</div>
            <h3>${topic.name}</h3>
            <p>${topic.description}</p>
        `;
        topicCard.addEventListener('click', () => selectTopic(topic));
        topicList.appendChild(topicCard);
    });

    // Show topic selection screen
    showScreen('topicSelectionScreen');
}

// Select a topic and show mode selection
function selectTopic(topic) {
    currentTopic = topic;
    quizTitle.textContent = topic.name;
    quizDescription.textContent = topic.description;
    showScreen('modeSelectionScreen');
}

// Start the quiz with selected mode
function startQuiz(mode) {
    currentMode = mode;
    loadQuestions();
}

// Load questions for the selected topic
async function loadQuestions() {
    try {
        if (!currentTopic) return;

        // Show loading state
        const quizContainer = document.getElementById('quizScreen');
        quizContainer.innerHTML = '<div class="loading">Loading questions...</div>';

        // Load questions for the topic
        // Determine base path dynamically for GitHub Pages
        const isGitHubPages = window.location.hostname.includes('github.io');
        const basePath = isGitHubPages ? '/Promotion-cbt-app' : '';
        const response = await fetch(`${basePath}/data/${currentTopic.file}`);
        const topicData = await response.json();

        // Process questions
        allQuestions = [];

        if (topicData.hasSubcategories && topicData.psr_categories) {
            // For topics with subcategories
            for (const category in topicData.psr_categories) {
                const subcategory = topicData.psr_categories[category];
                if (subcategory.questions) {
                    allQuestions = allQuestions.concat(subcategory.questions);
                }
            }
        } else if (topicData.questions) {
            // For flat question structures
            allQuestions = topicData.questions;
        }

        if (allQuestions.length === 0) {
            throw new Error('No questions found for this topic');
        }

        // Shuffle questions
        allQuestions = shuffleArray(allQuestions);

        // Limit to 20 questions for the quiz
        if (allQuestions.length > 20) {
            allQuestions = allQuestions.slice(0, 20);
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

    // Set up timer if in exam mode
    if (currentMode === 'exam') {
        timeLeft = allQuestions.length * 30; // 30 seconds per question
        startTimer();
    } else {
        timeLeft = 0;
        updateTimerDisplay();
    }

    // Show the first question
    showQuestion();
    showScreen('quizScreen');
}

// Show a specific screen
function showScreen(screenId) {
    // Hide all screens
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.add('hidden');
    });

    // Show the requested screen
    const screen = document.getElementById(screenId);
    if (screen) {
        screen.classList.remove('hidden');
    }

    // Show/hide quiz header
    const quizHeader = document.getElementById('quizHeader');
    if (quizHeader) {
        quizHeader.classList.toggle('hidden', screenId !== 'quizScreen');
    }
}

// Show error message
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;

    const container = document.querySelector('.container');
    container.insertBefore(errorDiv, container.firstChild);

    // Remove error after 5 seconds
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

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

        if (timeLeft <= 0) {
            clearInterval(timer);
            showResults();
        }
    }, 1000);
}

// Update the timer display
function updateTimerDisplay() {
    if (!timerDisplay) return;

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerDisplay.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

// Show the current question
function showQuestion() {
    if (currentQuestionIndex >= allQuestions.length) {
        showResults();
        return;
    }

    const question = allQuestions[currentQuestionIndex];
    questionElement.textContent = `${currentQuestionIndex + 1}. ${question.question}`;

    // Clear previous options
    optionsContainer.innerHTML = '';

    // Add new options
    question.options.forEach((option, index) => {
        const button = document.createElement('button');
        button.className = 'option-btn';
        button.innerHTML = `
            <span class="option-letter">${String.fromCharCode(65 + index)}</span>
            ${option}
        `;
        button.onclick = () => selectOption(index);
        optionsContainer.appendChild(button);
    });

    // Update navigation
    updateNavigation();
    updateProgress();
}

// Handle option selection
function selectOption(selectedIndex) {
    const question = allQuestions[currentQuestionIndex];
    userAnswers[currentQuestionIndex] = selectedIndex;

    // Update UI
    const options = document.querySelectorAll('.option-btn');
    options.forEach((option, index) => {
        option.disabled = true;
        option.classList.remove('selected', 'correct', 'incorrect');

        if (index === selectedIndex) {
            option.classList.add('selected');
            if (selectedIndex === question.correct) {
                option.classList.add('correct');
                score++;
            } else {
                option.classList.add('incorrect');
            }
        }

        if (index === question.correct) {
            option.classList.add('correct');
        }
    });

    // Enable next button
    nextButton.disabled = false;
}

// Update navigation buttons
function updateNavigation() {
    prevButton.disabled = currentQuestionIndex === 0;
    nextButton.disabled = userAnswers[currentQuestionIndex] === undefined;

    if (currentQuestionIndex === allQuestions.length - 1) {
        nextButton.textContent = 'Finish';
        nextButton.onclick = showResults;
    } else {
        nextButton.textContent = 'Next Question';
        nextButton.onclick = nextQuestion;
    }
}

// Update progress bar
function updateProgress() {
    if (!progressBar) return;

    const progress = ((currentQuestionIndex) / allQuestions.length) * 100;
    progressBar.style.width = `${progress}%`;

    if (questionCounter) {
        questionCounter.textContent = currentQuestionIndex + 1;
    }
}

// Move to next question
function nextQuestion() {
    if (currentQuestionIndex < allQuestions.length - 1) {
        currentQuestionIndex++;
        showQuestion();
    } else {
        showResults();
    }
}

// Move to previous question
function previousQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        showQuestion();
    }
}

// Show quiz results
function showResults() {
    clearInterval(timer);

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

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    loadData();
});
