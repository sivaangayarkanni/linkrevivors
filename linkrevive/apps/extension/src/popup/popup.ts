// apps/extension/src/popup/popup.ts
const API_BASE = 'http://localhost:3001/v1'; // Change to production URL after deploy

document.getElementById('analyze-btn')?.addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.url) return;

  const statusEl = document.getElementById('status')!;
  statusEl.textContent = 'Analyzing...';

  try {
    const res = await fetch(`${API_BASE}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: tab.url }),
    });
    const data = await res.json();

    // Send result to content script to show overlay
    chrome.tabs.sendMessage(tab.id!, { type: 'SHOW_RESULT', data });

    window.close();
  } catch (e) {
    statusEl.textContent = 'Failed. Is API running?';
    setTimeout(() => statusEl.textContent = 'Ready • v1.0.0', 2000);
  }
});

document.getElementById('bulk-btn')?.addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.url) return;

  const statusEl = document.getElementById('status')!;
  statusEl.textContent = 'Starting bulk scan...';

  try {
    const res = await fetch(`${API_BASE}/bulk-scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pageUrl: tab.url, maxLinks: 20 }),
    });
    const data = await res.json();
    statusEl.textContent = `Job queued: ${data.jobId?.slice(0, 12)}...`;
  } catch (e) {
    statusEl.textContent = 'Bulk failed';
  }
});
