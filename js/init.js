// init.js - Initialize application and testing
import { testApp } from './tests.js';

// Expose test function globally
window.testApp = testApp;

// Log initialization
console.log('Test suite initialized. Run testApp() to start testing.');

// Development mode indicator
if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
    console.log('Development mode active');
    console.log('Available commands:');
    console.log('- testApp(): Run all tests');
}