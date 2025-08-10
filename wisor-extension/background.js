// Background service worker for Wisor extension
chrome.runtime.onInstalled.addListener(() => {
  console.log('Wisor extension installed');
  
  // Set default user preferences
  chrome.storage.sync.set({
    userCards: ['hdfc-millennia', 'sbi-simplyclick'], // Default cards for demo
    preferences: {
      showNotifications: true,
      autoDetect: true,
      minimumRecommendationValue: 10
    },
    stats: {
      totalSavings: 0,
      monthlyOptimizations: 0,
      lastUpdated: Date.now()
    }
  });
});

// Handle messages from content script and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'trackRecommendation') {
    // Track when user views a recommendation
    updateStats('recommendation_shown', request.data);
    sendResponse({ success: true });
  }
  
  if (request.action === 'trackOptimization') {
    // Track when user follows a recommendation
    updateStats('optimization_used', request.data);
    sendResponse({ success: true });
  }
  
  if (request.action === 'getCardData') {
    // Send card data to content script
    chrome.storage.sync.get(['userCards'], (result) => {
      sendResponse({ userCards: result.userCards || [] });
    });
    return true; // Keep message channel open for async response
  }
});

function updateStats(eventType, data) {
  chrome.storage.sync.get(['stats'], (result) => {
    const stats = result.stats || { totalSavings: 0, monthlyOptimizations: 0 };
    
    if (eventType === 'optimization_used') {
      stats.totalSavings += data.savingsAmount || 0;
      stats.monthlyOptimizations += 1;
    }
    
    stats.lastUpdated = Date.now();
    
    chrome.storage.sync.set({ stats });
  });
}

// Periodic cleanup and data sync
chrome.alarms.create('dailyCleanup', { delayInMinutes: 60, periodInMinutes: 24 * 60 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'dailyCleanup') {
    // Clean old data, sync stats, etc.
    console.log('Performing daily cleanup');
  }
});