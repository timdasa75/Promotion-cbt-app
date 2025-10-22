// tests.js - Test functionality
import { loadData } from './data.js';
import { showScreen } from './ui.js';

export async function testApp() {
    console.group('Application Test Suite');
    
    // Test 1: Data Loading
    console.log('Testing data loading...');
    try {
        const topics = await loadData();
        console.log('✓ Topics loaded successfully:', topics.length, 'topics found');
    } catch (error) {
        console.error('✗ Failed to load topics:', error);
    }

    // Test 2: Topic Selection
    console.log('Testing topic selection...');
    const topicList = document.getElementById('topicList');
    if (topicList && topicList.children.length > 0) {
        console.log('✓ Topics displayed in UI');
    } else {
        console.error('✗ Topics not displayed properly');
    }

    // Test 3: Screen Navigation
    console.log('Testing screen navigation...');
    try {
        // Test navigation to mode selection
        await showScreen('modeSelectionScreen');
        let modeScreen = document.getElementById('modeSelectionScreen');
        let topicScreen = document.getElementById('topicSelectionScreen');
        
        if (modeScreen.classList.contains('active') && !topicScreen.classList.contains('active')) {
            console.log('✓ Navigation to mode selection screen working');
        } else {
            throw new Error('Navigation to mode selection failed');
        }

        // Test navigation back to topic selection
        await showScreen('topicSelectionScreen');
        if (topicScreen.classList.contains('active') && !modeScreen.classList.contains('active')) {
            console.log('✓ Navigation back to topic selection working');
        } else {
            throw new Error('Navigation back to topic selection failed');
        }

        console.log('✓ Screen navigation working');
    } catch (error) {
        console.error('✗ Screen navigation error:', error.message);
    }

    console.groupEnd();
}

// Export for use in browser console
window.testApp = testApp;