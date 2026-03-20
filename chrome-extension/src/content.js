/**
 * TubeForge Chrome Extension — Content Script
 *
 * Runs on YouTube video/shorts pages.
 * Extracts video streaming data from YouTube's player response
 * (which is already loaded in the page — no extra API calls needed).
 *
 * Strategy:
 * 1. Read ytInitialPlayerResponse from page source (embedded JSON)
 * 2. Fallback: intercept ytplayer.config via page script injection
 * 3. Extract formats, build download-ready data, send to background
 */

(() => {
  'use strict';

  /* ── Constants ──────────────────────────────────────────────────── */

  const TUBEFORGE_BTN_ID = 'tubeforge-download-btn';
  const EXTRACT_RETRY_MS = 2000;
  const MAX_RETRIES = 5;

  /* ── State ──────────────────────────────────────────────────────── */

  let currentVideoId = null;
  let extractedData = null;
  let retryCount = 0;

  /* ── Main ───────────────────────────────────────────────────────── */

  function init() {
    const videoId = getVideoId();
    if (!videoId) return;

    if (videoId === currentVideoId && extractedData) return;
    currentVideoId = videoId;
    extractedData = null;
    retryCount = 0;

    extractVideoData();
    injectDownloadButton();
  }

  /* ── Video ID extraction ────────────────────────────────────────── */

  function getVideoId() {
    const url = new URL(window.location.href);
    if (url.pathname === '/watch') return url.searchParams.get('v');
    const shortsMatch = url.pathname.match(/\/shorts\/([a-zA-Z0-9_-]{11})/);
    if (shortsMatch) return shortsMatch[1];
    return null;
  }

  /* ── Extract video data from YouTube's embedded player response ── */

  function extractVideoData() {
    // Strategy 1: ytInitialPlayerResponse (available in page source)
    try {
      const data = extractFromPageSource();
      if (data) {
        processPlayerResponse(data);
        return;
      }
    } catch (e) {
      console.log('[TubeForge] Page source extraction failed:', e.message);
    }

    // Strategy 2: inject script to read from window objects
    injectExtractor();
  }

  function extractFromPageSource() {
    // YouTube embeds player response as JSON in a <script> tag
    const scripts = document.querySelectorAll('script');
    for (const script of scripts) {
      const text = script.textContent || '';

      // Try ytInitialPlayerResponse
      let match = text.match(/var\s+ytInitialPlayerResponse\s*=\s*(\{.+?\})\s*;/s);
      if (match) {
        try { return JSON.parse(match[1]); } catch { /* continue */ }
      }

      // Try ytplayer.config.args.raw_player_response
      match = text.match(/ytplayer\.config\s*=\s*(\{.+?\})\s*;/s);
      if (match) {
        try {
          const config = JSON.parse(match[1]);
          if (config.args?.raw_player_response) return config.args.raw_player_response;
        } catch { /* continue */ }
      }
    }
    return null;
  }

  /** Inject a script into the page context to access window.__ytplayer etc. */
  function injectExtractor() {
    const script = document.createElement('script');
    script.textContent = `
      (function() {
        try {
          // Try multiple YouTube player data sources
          var data = null;

          // Source 1: ytInitialPlayerResponse (most common)
          if (typeof ytInitialPlayerResponse !== 'undefined' && ytInitialPlayerResponse) {
            data = ytInitialPlayerResponse;
          }

          // Source 2: ytplayer.config
          if (!data && typeof ytplayer !== 'undefined' && ytplayer?.config?.args) {
            data = ytplayer.config.args.raw_player_response || ytplayer.config.args;
          }

          // Source 3: player API
          if (!data) {
            var player = document.getElementById('movie_player');
            if (player && player.getPlayerResponse) {
              data = player.getPlayerResponse();
            }
          }

          if (data) {
            window.postMessage({
              type: 'TUBEFORGE_PLAYER_DATA',
              data: JSON.parse(JSON.stringify(data))
            }, window.location.origin);
          }
        } catch(e) {
          console.log('[TubeForge injected] error:', e.message);
        }
      })();
    `;
    document.documentElement.appendChild(script);
    script.remove();
  }

  // Listen for data from injected script
  window.addEventListener('message', (event) => {
    if (event.source !== window) return;
    if (event.origin !== window.location.origin) return;
    if (event.data?.type === 'TUBEFORGE_PLAYER_DATA' && event.data.data) {
      processPlayerResponse(event.data.data);
    }
  });

  // Listen for extraction requests from popup
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'EXTRACT') {
      if (extractedData) {
        sendResponse({ data: extractedData });
      } else {
        retryCount = 0;
        extractVideoData();
        // Wait a bit for extraction
        setTimeout(() => {
          sendResponse({ data: extractedData || null });
        }, 1500);
        return true; // async response
      }
    }
  });

  /* ── Process player response ────────────────────────────────────── */

  function processPlayerResponse(playerResponse) {
    const videoDetails = playerResponse.videoDetails;
    const streamingData = playerResponse.streamingData;

    if (!videoDetails || !streamingData) {
      // Retry
      if (retryCount < MAX_RETRIES) {
        retryCount++;
        setTimeout(extractVideoData, EXTRACT_RETRY_MS);
      }
      return;
    }

    const formats = streamingData.formats || [];
    const adaptiveFormats = streamingData.adaptiveFormats || [];

    // Build format list
    const downloadFormats = [];

    // Combined formats (video + audio) — best for downloading
    for (const f of formats) {
      if (!f.url || f.signatureCipher) continue;
      downloadFormats.push({
        itag: f.itag,
        url: f.url,
        mimeType: f.mimeType || 'video/mp4',
        quality: f.qualityLabel || f.quality || 'unknown',
        height: f.height || 0,
        width: f.width || 0,
        bitrate: f.bitrate || 0,
        contentLength: f.contentLength ? parseInt(f.contentLength) : 0,
        type: 'combined',
        hasAudio: true,
        hasVideo: true,
      });
    }

    // Adaptive audio formats
    for (const f of adaptiveFormats) {
      if (!f.url || f.signatureCipher) continue;
      const isAudio = f.mimeType?.startsWith('audio/');
      const isVideo = f.mimeType?.startsWith('video/');

      if (isAudio) {
        downloadFormats.push({
          itag: f.itag,
          url: f.url,
          mimeType: f.mimeType,
          quality: `${Math.round((f.bitrate || 0) / 1000)}kbps`,
          bitrate: f.bitrate || 0,
          contentLength: f.contentLength ? parseInt(f.contentLength) : 0,
          type: 'audio',
          hasAudio: true,
          hasVideo: false,
          audioQuality: f.audioQuality,
        });
      }

      if (isVideo) {
        downloadFormats.push({
          itag: f.itag,
          url: f.url,
          mimeType: f.mimeType,
          quality: f.qualityLabel || `${f.height}p`,
          height: f.height || 0,
          width: f.width || 0,
          bitrate: f.bitrate || 0,
          contentLength: f.contentLength ? parseInt(f.contentLength) : 0,
          fps: f.fps || 30,
          type: 'video-only',
          hasAudio: false,
          hasVideo: true,
        });
      }
    }

    extractedData = {
      videoId: videoDetails.videoId,
      title: videoDetails.title,
      author: videoDetails.author,
      channelId: videoDetails.channelId,
      lengthSeconds: parseInt(videoDetails.lengthSeconds || '0'),
      thumbnail: videoDetails.thumbnail?.thumbnails?.slice(-1)[0]?.url || '',
      viewCount: videoDetails.viewCount,
      isLive: videoDetails.isLiveContent || false,
      formats: downloadFormats,
    };

    // Send to background
    chrome.runtime.sendMessage({
      type: 'VIDEO_DATA',
      data: extractedData,
    });

    updateDownloadButton();
  }

  /* ── Download button injection ──────────────────────────────────── */

  function injectDownloadButton() {
    // Remove existing button
    document.getElementById(TUBEFORGE_BTN_ID)?.remove();

    // Wait for YouTube's action bar to load
    waitForElement('#actions, #menu, ytd-menu-renderer', (container) => {
      const isShorts = window.location.pathname.includes('/shorts/');

      const btn = document.createElement('button');
      btn.id = TUBEFORGE_BTN_ID;
      btn.className = 'tubeforge-dl-btn';
      btn.title = chrome.i18n.getMessage('extTitle');
      btn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        ${isShorts ? '' : `<span>${chrome.i18n.getMessage('downloadBtn')}</span>`}
      `;

      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        // Open popup or trigger download of best format
        if (extractedData) {
          showQuickMenu(btn);
        } else {
          extractVideoData();
          btn.innerHTML = `
            <svg class="tubeforge-spinner" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <circle cx="12" cy="12" r="10" stroke-dasharray="60" stroke-dashoffset="20"/>
            </svg>
            <span>${chrome.i18n.getMessage('downloadingBtn')}</span>
          `;
          setTimeout(() => {
            if (extractedData) {
              showQuickMenu(btn);
            } else {
              btn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="15" y1="9" x2="9" y2="15"/>
                  <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
                <span>${chrome.i18n.getMessage('errorBtn')}</span>
              `;
            }
            updateDownloadButton();
          }, 3000);
        }
      });

      // Insert before "Share" button or at the end
      if (isShorts) {
        // For shorts, add to the side action bar
        const shortsActions = document.querySelector('#actions, ytd-reel-player-overlay-renderer #actions');
        if (shortsActions) {
          shortsActions.appendChild(btn);
        }
      } else {
        // For regular videos, add to the action row
        const actionsContainer = document.querySelector('#actions #actions-inner, #top-level-buttons-computed, ytd-menu-renderer');
        if (actionsContainer) {
          actionsContainer.insertBefore(btn, actionsContainer.firstChild);
        } else if (container) {
          container.appendChild(btn);
        }
      }
    });
  }

  function updateDownloadButton() {
    const btn = document.getElementById(TUBEFORGE_BTN_ID);
    if (!btn) return;

    const isShorts = window.location.pathname.includes('/shorts/');
    btn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
      ${isShorts ? '' : `<span>${chrome.i18n.getMessage('downloadBtn')}</span>`}
    `;
  }

  /* ── Quick download menu ────────────────────────────────────────── */

  function showQuickMenu(anchorBtn) {
    // Remove existing menu
    document.querySelector('.tubeforge-menu')?.remove();

    if (!extractedData || !extractedData.formats.length) return;

    const menu = document.createElement('div');
    menu.className = 'tubeforge-menu';

    // Header
    const header = document.createElement('div');
    header.className = 'tubeforge-menu-header';
    header.innerHTML = `
      <div class="tubeforge-menu-logo">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        <strong>TubeForge</strong>
      </div>
      <div class="tubeforge-menu-title" title="${escapeHtml(extractedData.title)}">
        ${escapeHtml(truncate(extractedData.title, 50))}
      </div>
    `;
    menu.appendChild(header);

    // Separator
    menu.appendChild(createSep());

    // Section: Video (combined = has audio)
    const combined = extractedData.formats
      .filter((f) => f.type === 'combined')
      .sort((a, b) => (b.height || 0) - (a.height || 0));

    if (combined.length > 0) {
      const label = document.createElement('div');
      label.className = 'tubeforge-menu-label';
      label.textContent = chrome.i18n.getMessage('formatVideoAudio');
      menu.appendChild(label);

      for (const f of combined) {
        menu.appendChild(createFormatItem(f, `${f.quality} MP4`, formatSize(f.contentLength)));
      }
      menu.appendChild(createSep());
    }

    // Section: Video only (top 3)
    const videoOnly = extractedData.formats
      .filter((f) => f.type === 'video-only' && f.mimeType?.includes('mp4'))
      .sort((a, b) => (b.height || 0) - (a.height || 0))
      .slice(0, 4);

    if (videoOnly.length > 0) {
      const label = document.createElement('div');
      label.className = 'tubeforge-menu-label';
      label.textContent = chrome.i18n.getMessage('formatVideoOnly');
      menu.appendChild(label);

      for (const f of videoOnly) {
        const fpsLabel = f.fps && f.fps > 30 ? ` ${f.fps}fps` : '';
        menu.appendChild(createFormatItem(f, `${f.quality}${fpsLabel}`, formatSize(f.contentLength)));
      }
      menu.appendChild(createSep());
    }

    // Section: Audio only (best MP4 audio + best WebM audio)
    const audioFormats = extractedData.formats
      .filter((f) => f.type === 'audio')
      .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));

    const bestAudio = [];
    const seenTypes = new Set();
    for (const f of audioFormats) {
      const key = f.mimeType?.includes('mp4') ? 'mp4' : f.mimeType?.includes('webm') ? 'webm' : 'other';
      if (!seenTypes.has(key)) {
        seenTypes.add(key);
        bestAudio.push(f);
      }
      if (bestAudio.length >= 2) break;
    }

    if (bestAudio.length > 0) {
      const label = document.createElement('div');
      label.className = 'tubeforge-menu-label';
      label.textContent = chrome.i18n.getMessage('audioLabel');
      menu.appendChild(label);

      for (const f of bestAudio) {
        const ext = f.mimeType?.includes('mp4') ? 'M4A' : f.mimeType?.includes('webm') ? 'WebM' : 'Audio';
        menu.appendChild(createFormatItem(f, `${f.quality} ${ext}`, formatSize(f.contentLength)));
      }
    }

    // Cobalt quick download section
    menu.appendChild(createSep());
    const cobaltLabel = document.createElement('div');
    cobaltLabel.className = 'tubeforge-menu-label';
    cobaltLabel.textContent = chrome.i18n.getMessage('cobaltDownload');
    menu.appendChild(cobaltLabel);

    const cobaltOptions = [
      { quality: '1080', label: '1080p MP4' },
      { quality: '720', label: '720p MP4' },
      { quality: 'audio', label: chrome.i18n.getMessage('audioMp3') },
    ];
    for (const opt of cobaltOptions) {
      const item = document.createElement('div');
      item.className = 'tubeforge-menu-item';

      const labelSpan = document.createElement('span');
      labelSpan.className = 'tubeforge-menu-item-label';
      labelSpan.textContent = opt.label;
      item.appendChild(labelSpan);

      const sizeSpan = document.createElement('span');
      sizeSpan.className = 'tubeforge-menu-item-size';
      sizeSpan.style.color = '#818cf8';
      sizeSpan.style.fontSize = '10px';
      sizeSpan.textContent = 'Cobalt';
      item.appendChild(sizeSpan);
      item.addEventListener('click', () => {
        downloadViaCobalt(opt.quality);
        document.querySelector('.tubeforge-menu')?.remove();
      });
      menu.appendChild(item);
    }

    // Footer
    const footer = document.createElement('div');
    footer.className = 'tubeforge-menu-footer';
    footer.innerHTML = `<a href="https://tubeforge.co" target="_blank">tubeforge.co</a>`;
    menu.appendChild(footer);

    // Position the menu
    document.body.appendChild(menu);

    const rect = anchorBtn.getBoundingClientRect();
    menu.style.top = `${rect.bottom + 8}px`;
    menu.style.left = `${Math.max(8, rect.left - menu.offsetWidth / 2 + rect.width / 2)}px`;

    // Close on outside click
    const closeHandler = (e) => {
      if (!menu.contains(e.target) && e.target !== anchorBtn) {
        menu.remove();
        document.removeEventListener('click', closeHandler, true);
      }
    };
    setTimeout(() => document.addEventListener('click', closeHandler, true), 50);
  }

  function createFormatItem(format, label, size) {
    const item = document.createElement('div');
    item.className = 'tubeforge-menu-item';

    const labelSpan = document.createElement('span');
    labelSpan.className = 'tubeforge-menu-item-label';
    labelSpan.textContent = label;
    item.appendChild(labelSpan);

    const sizeSpan = document.createElement('span');
    sizeSpan.className = 'tubeforge-menu-item-size';
    sizeSpan.textContent = size;
    item.appendChild(sizeSpan);
    item.addEventListener('click', () => {
      downloadFormat(format);
      document.querySelector('.tubeforge-menu')?.remove();
    });
    return item;
  }

  function createSep() {
    const sep = document.createElement('div');
    sep.className = 'tubeforge-menu-sep';
    return sep;
  }

  /* ── Download ───────────────────────────────────────────────────── */

  function downloadFormat(format) {
    if (!extractedData) return;

    const title = sanitize(extractedData.title || extractedData.videoId);
    let ext = 'mp4';
    if (format.mimeType?.includes('webm')) ext = 'webm';
    if (format.type === 'audio') {
      ext = format.mimeType?.includes('mp4') ? 'm4a' : 'webm';
    }

    const filename = `${title} [${format.quality}].${ext}`;

    // Use chrome.downloads via background script
    chrome.runtime.sendMessage({
      type: 'DOWNLOAD',
      url: format.url,
      filename,
      tabId: null, // background will figure it out
    });

    // Visual feedback
    const btn = document.getElementById(TUBEFORGE_BTN_ID);
    if (btn) {
      const origHTML = btn.innerHTML;
      btn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        <span>${chrome.i18n.getMessage('downloadingBtn')}</span>
      `;
      setTimeout(() => { btn.innerHTML = origHTML; }, 3000);
    }
  }

  /* ── Cobalt download ──────────────────────────────────────────── */

  async function downloadViaCobalt(quality) {
    const btn = document.getElementById(TUBEFORGE_BTN_ID);
    const origHTML = btn?.innerHTML;

    if (btn) {
      btn.innerHTML = `
        <svg class="tubeforge-spinner" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <circle cx="12" cy="12" r="10" stroke-dasharray="60" stroke-dashoffset="20"/>
        </svg>
        <span>${chrome.i18n.getMessage('downloadingBtn')}</span>
      `;
    }

    try {
      const isAudio = quality === 'audio';
      const body = {
        url: window.location.href,
        videoQuality: isAudio ? '720' : quality,
        filenameStyle: 'pretty',
      };
      if (isAudio) {
        body.isAudioOnly = true;
        body.audioFormat = 'mp3';
      }

      const resp = await fetch('https://api.cobalt.tools/', {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!resp.ok) throw new Error(`Cobalt: ${resp.status}`);
      const data = await resp.json();

      if (data.status === 'error' || data.status === 'rate-limit') {
        throw new Error(data.text || 'Cobalt error');
      }

      if (!data.url) throw new Error('No URL from Cobalt');

      const title = sanitize(extractedData?.title || currentVideoId || 'video');
      const ext = isAudio ? 'mp3' : 'mp4';
      const filename = `${title} [${isAudio ? 'audio' : quality + 'p'}].${ext}`;

      chrome.runtime.sendMessage({
        type: 'DOWNLOAD',
        url: data.url,
        filename,
        tabId: null,
      });

      if (btn) {
        btn.innerHTML = `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <span>${chrome.i18n.getMessage('downloadingBtn')}</span>
        `;
        setTimeout(() => { if (origHTML) btn.innerHTML = origHTML; }, 3000);
      }
    } catch (err) {
      console.error('[TubeForge] Cobalt error:', err);
      if (btn) {
        btn.innerHTML = `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f87171" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
          <span>${chrome.i18n.getMessage('errorBtn')}</span>
        `;
        setTimeout(() => { if (origHTML) btn.innerHTML = origHTML; }, 3000);
      }
    }
  }

  /* ── Utilities ──────────────────────────────────────────────────── */

  function waitForElement(selector, callback, timeout = 10000) {
    const el = document.querySelector(selector);
    if (el) { callback(el); return; }

    const observer = new MutationObserver(() => {
      const el = document.querySelector(selector);
      if (el) {
        observer.disconnect();
        callback(el);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    setTimeout(() => observer.disconnect(), timeout);
  }

  function formatSize(bytes) {
    if (!bytes || bytes <= 0) return '';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }

  function sanitize(str) {
    return str.replace(/[<>:"/\\|?*]/g, '').replace(/\s+/g, ' ').trim().slice(0, 150);
  }

  function truncate(str, max) {
    return str.length > max ? str.slice(0, max) + '…' : str;
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /* ── YouTube SPA navigation handling ────────────────────────────── */

  // YouTube is a SPA — detect navigation via URL changes
  let lastUrl = location.href;
  const urlObserver = new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      currentVideoId = null;
      extractedData = null;
      setTimeout(init, 1000); // wait for page to update
    }
  });
  urlObserver.observe(document.body, { childList: true, subtree: true });

  // Also listen for yt-navigate-finish (YouTube's own navigation event)
  document.addEventListener('yt-navigate-finish', () => {
    setTimeout(init, 500);
  });

  // Initial run
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(init, 1000));
  } else {
    setTimeout(init, 1000);
  }
})();
