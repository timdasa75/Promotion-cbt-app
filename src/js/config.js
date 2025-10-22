// Configuration object for the application
const config = {
    // API endpoints or data file paths
    dataPath: `${window.BASE_URL}/data`,
    
    // Quiz settings
    quiz: {
        timeLimit: 3600, // 1 hour in seconds
        questionsPerExam: 100,
        passingScore: 70,
        shuffleQuestions: true
    },
    
    // UI settings
    ui: {
        animationDuration: 300,
        toastDuration: 3000,
        maxTopicsPerPage: 12
    },
    
    // Feature flags
    features: {
        saveProgress: true,
        darkMode: false,
        instantFeedback: true
    }
};

export default config;