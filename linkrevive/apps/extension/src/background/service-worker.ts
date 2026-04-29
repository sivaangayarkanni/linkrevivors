// apps/extension/src/background/service-worker.ts
// MV3 Service Worker - Handles background tasks

chrome.runtime.onInstalled.addListener(() => {
  console.log('[LinkRevive] Extension installed');
});

// Optional: Listen for tab updates to auto-detect 404s in future versions
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // Could inject content script dynamically here if needed
  }
});
