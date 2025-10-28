// data.js - Module for loading and managing quiz data

// Global variables for data
let topics = [];

// Load data from JSON files
export async function loadData() {
  try {
    console.log("Loading topics...");
    // Load topics with proper encoding
    // Dynamically determine the base URL for both local and GitHub Pages
    const getBaseUrl = () => {
      const pathParts = window.location.pathname.split('/');
      if (pathParts[1] === 'Promotion-cbt-app') {
        return '/Promotion-cbt-app';
      }
      return '';
    };

    const BASE_URL = getBaseUrl();
    const topicsPath = `${BASE_URL}/data/topics.json`;
    const response = await fetch(topicsPath, {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
    });
    console.log("Response status:", response.status);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log("Raw data:", data);
    topics = data.topics || [];
    
    // Validate topics data
    if (topics.length === 0) {
      throw new Error("No topics found");
    }
    
    // Log loaded topics for debugging
    console.log("Loaded topics:", topics);
    
    return topics;
  } catch (error) {
    console.error("Error loading data:", error);
    throw error;
  }
}

// Get topics
export function getTopics() {
  return topics;
}

// Get question counts for all topics
export async function getTopicQuestionCounts(topics) {
    const counts = {};
    console.log('Getting question counts for topics:', topics);
    
    // Define getBaseUrl function to determine the base URL
    const getBaseUrl = () => {
      const pathParts = window.location.pathname.split('/');
      if (pathParts[1] === 'Promotion-cbt-app') {
        return '/Promotion-cbt-app';
      }
      return '';
    };
    
    await Promise.all(
        topics.map(async (topic) => {
            try {
                console.log(`Fetching data for topic ${topic.id} from file ${topic.file}`);
                const BASE_URL = getBaseUrl();
                const filePath = `${BASE_URL}/${topic.file}`;
                const response = await fetch(filePath);
                const data = await response.json();
                console.log(`Data for topic ${topic.id}:`, data);
                let count = 0;
                if (data.domains && Array.isArray(data.domains)) { // New condition: data has a 'domains' array
                    console.log(`Topic ${topic.id} has domains property`);
                    for (const domain of data.domains) {
                        if (domain.topics && Array.isArray(domain.topics)) {
                            for (const subcat of domain.topics) {
                                if (subcat && subcat.questions && Array.isArray(subcat.questions)) {
                                    count += subcat.questions.length;
                                }
                            }
                        }
                    }
                } else if (data.subcategories && Array.isArray(data.subcategories)) { // Handle new structure with subcategories array
                    console.log(`Topic ${topic.id} has subcategories property`);
                    for (const subcat of data.subcategories) {
                        if (subcat && subcat.questions && Array.isArray(subcat.questions)) {
                            count += subcat.questions.length;
                        }
                    }
                } else if (data.questions && Array.isArray(data.questions)) {
                    // Existing simple structure
                    console.log(`Topic ${topic.id} has simple questions array`);
                    count = data.questions.length;
                }
                console.log(`Count for topic ${topic.id}: ${count}`);
                counts[topic.id] = count;
            } catch (e) {
                console.error(`Error loading questions for topic ${topic.id}:`, e);
                counts[topic.id] = 0;
            }
        })
    );
    console.log('All counts:', counts);
    return counts;
}

// Get question count for a specific topic and subcategory
export async function getQuestionCountForSubcategory(topic, subcategoryId) {
  try {
    // Define getBaseUrl function to determine the base URL
    const getBaseUrl = () => {
      const pathParts = window.location.pathname.split('/');
      if (pathParts[1] === 'Promotion-cbt-app') {
        return '/Promotion-cbt-app';
      }
      return '';
    };
    
    const BASE_URL = getBaseUrl();
    const filePath = `${BASE_URL}/${topic.file}`;
    const response = await fetch(filePath);
    const data = await response.json();

    if (data.domains && Array.isArray(data.domains)) { // New condition
      for (const domain of data.domains) {
        if (domain.topics && Array.isArray(domain.topics)) {
          const subcategory = domain.topics.find(
            (sub) => sub && sub.id === subcategoryId
          );
          const count = subcategory && subcategory.questions && Array.isArray(subcategory.questions)
            ? subcategory.questions.length
            : 0;
          return count;
        }
      }
      return 0; // If domain.topics not found
    } else if (Array.isArray(data)) { // New condition
      const subcategory = data.find(
        (sub) => sub && sub.id === subcategoryId
      );
      const count = subcategory && subcategory.questions && Array.isArray(subcategory.questions)
        ? subcategory.questions.length
        : 0;
      return count;
    } else if (data.hasSubcategories && data.subcategories && Array.isArray(data.subcategories)) {
      const subcategory = data.subcategories.find(
        (sub) => sub && sub.id === subcategoryId
      );
      const count = subcategory && subcategory.questions && Array.isArray(subcategory.questions)
        ? subcategory.questions.length
        : 0;
      return count;
    } else if (data.psr_categories) {
      // Legacy structure
      const subcategory = data.psr_categories[subcategoryId];
      return subcategory && subcategory.questions
        ? subcategory.questions.length
        : 0;
    }
    return 0;
  } catch (e) {
    console.error("Error getting question count for subcategory:", e);
    return 0;
  }
}

// Get total question count for a topic
export async function getTotalQuestionCountForTopic(topic) {
  try {
    // Define getBaseUrl function to determine the base URL
    const getBaseUrl = () => {
      const pathParts = window.location.pathname.split('/');
      if (pathParts[1] === 'Promotion-cbt-app') {
        return '/Promotion-cbt-app';
      }
      return '';
    };
    
    const BASE_URL = getBaseUrl();
    const filePath = `${BASE_URL}/${topic.file}`;
    const response = await fetch(filePath);
    const data = await response.json();
    let count = 0;
    if (data.domains && Array.isArray(data.domains)) { // New condition: data has a 'domains' array
      for (const domain of data.domains) {
        if (domain.topics && Array.isArray(domain.topics)) {
          for (const subcat of domain.topics) {
            if (subcat && subcat.questions && Array.isArray(subcat.questions)) {
              count += subcat.questions.length;
            }
          }
        }
      }
    } else if (Array.isArray(data)) { // New condition
      for (const subcat of data) {
        if (subcat && subcat.questions && Array.isArray(subcat.questions)) {
          count += subcat.questions.length;
        }
      }
    } else if (data.hasSubcategories && data.subcategories && Array.isArray(data.subcategories)) {
      // Handle new structure with subcategories
      for (const subcat of data.subcategories) {
        if (subcat && subcat.questions && Array.isArray(subcat.questions)) {
          count += subcat.questions.length;
        }
      }
    } else if (data.psr_categories) {
      // Legacy structure
      for (const cat in data.psr_categories) {
        const subcat = data.psr_categories[cat];
        if (subcat.questions) count += subcat.questions.length;
      }
    } else if (data.questions && Array.isArray(data.questions)) {
      // Simple structure
      count = data.questions.length;
    }
    return count;
  } catch (e) {
    console.error("Error getting total question count for topic:", e);
    return 0;
  }
}

// Get question count for a specific subcategory
export async function getQuestionCountForSpecificSubcategory(topic, subcategory) {
  try {
    if (subcategory && subcategory.questions && Array.isArray(subcategory.questions)) {
      return subcategory.questions.length;
    }
    
    // If subcategory doesn't have questions directly, return 0
    return 0;
  } catch (e) {
    console.error("Error getting question count for subcategory:", e);
    return 0;
  }
}
