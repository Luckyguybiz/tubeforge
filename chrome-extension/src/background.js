/**
 * TubeForge Chrome Extension — Background Service Worker
 *
 * Handles:
 * 1. Receiving video data from content script
 * 2. Initiating downloads via chrome.downloads API
 * 3. Badge updates to show download status
 */

/* ── State ──────────────────────────────────────────────────────────── */

/** Current video info per tab: tabId -> videoData */
const tabVideoData = new Map();

/** Active downloads: downloadId -> { tabId, filename } */
const activeDownloads = new Map();

/* ── Message handler ────────────────────────────────────────────────── */

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'VIDEO_DATA') {
    // Content script extracted video data
    const tabId = sender.tab?.id;
    if (tabId) {
      tabVideoData.set(tabId, msg.data);
      // Update badge to show video is available
      chrome.action.setBadgeText({ text: '✓', tabId });
      chrome.action.setBadgeBackgroundColor({ color: '#4f46e5', tabId });
    }
    sendResponse({ ok: true });
    return;
  }

  if (msg.type === 'GET_VIDEO_DATA') {
    // Popup requests current tab's video data
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0]?.id;
      const data = tabId ? tabVideoData.get(tabId) : null;
      sendResponse({ data });
    });
    return true; // async response
  }

  if (msg.type === 'DOWNLOAD') {
    handleDownload(msg.url, msg.filename, msg.tabId);
    sendResponse({ ok: true });
    return;
  }

  if (msg.type === 'EXTRACT_VIDEO') {
    // Popup asks to run extraction on active tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0]?.id;
      if (tabId) {
        chrome.tabs.sendMessage(tabId, { type: 'EXTRACT' }, (response) => {
          sendResponse(response || { error: 'No response from content script' });
        });
      } else {
        sendResponse({ error: 'No active tab' });
      }
    });
    return true; // async response
  }
});

/* ── Download handler ───────────────────────────────────────────────── */

function handleDownload(url, filename, tabId) {
  chrome.downloads.download(
    {
      url,
      filename: sanitizeFilename(filename),
      saveAs: true,
    },
    (downloadId) => {
      if (downloadId) {
        activeDownloads.set(downloadId, { tabId, filename });
        if (tabId) {
          chrome.action.setBadgeText({ text: '⬇', tabId });
          chrome.action.setBadgeBackgroundColor({ color: '#059669', tabId });
        }
      }
    },
  );
}

function sanitizeFilename(name) {
  return name
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 200);
}

/* ── Download progress tracking ─────────────────────────────────────── */

chrome.downloads.onChanged.addListener((delta) => {
  const info = activeDownloads.get(delta.id);
  if (!info) return;

  if (delta.state?.current === 'complete') {
    activeDownloads.delete(delta.id);
    if (info.tabId) {
      chrome.action.setBadgeText({ text: '✓', tabId: info.tabId });
      chrome.action.setBadgeBackgroundColor({ color: '#4f46e5', tabId: info.tabId });
    }
  }

  if (delta.state?.current === 'interrupted') {
    activeDownloads.delete(delta.id);
    if (info.tabId) {
      chrome.action.setBadgeText({ text: '!', tabId: info.tabId });
      chrome.action.setBadgeBackgroundColor({ color: '#dc2626', tabId: info.tabId });
    }
  }
});

/* ── Tab cleanup ────────────────────────────────────────────────────── */

chrome.tabs.onRemoved.addListener((tabId) => {
  tabVideoData.delete(tabId);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.url) {
    tabVideoData.delete(tabId);
    chrome.action.setBadgeText({ text: '', tabId });
  }
});
