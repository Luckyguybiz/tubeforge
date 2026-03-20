/**
 * TubeForge Chrome Extension — Popup Script
 *
 * Shows current YouTube video info and available download formats.
 * Communicates with background.js and content.js to extract and download.
 *
 * Download strategies:
 * 1. Direct YouTube URLs (from ytInitialPlayerResponse) — fastest, no third party
 * 2. Cobalt API fallback — when direct URLs aren't available or have signatureCipher
 */

(() => {
  'use strict';

  const COBALT_API = 'https://api.cobalt.tools';

  /* ── i18n helper ──────────────────────────────────────────────── */

  const msg = (key, substitutions) => chrome.i18n.getMessage(key, substitutions) || key;

  /* ── Localize static HTML elements on load ────────────────────── */

  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    const translated = msg(key);
    if (translated && translated !== key) {
      el.textContent = translated;
    }
  });

  /* ── DOM Elements ────────────────────────────────────────────── */

  const stateLoading = document.getElementById('state-loading');
  const stateError = document.getElementById('state-error');
  const stateVideo = document.getElementById('state-video');
  const errorMessage = document.getElementById('error-message');
  const btnRetry = document.getElementById('btn-retry');

  const videoThumb = document.getElementById('video-thumb');
  const videoTitle = document.getElementById('video-title');
  const videoAuthor = document.getElementById('video-author');
  const videoDuration = document.getElementById('video-duration');
  const formatList = document.getElementById('format-list');

  const tabButtons = document.querySelectorAll('.tab');

  /* ── State ────────────────────────────────────────────────────── */

  let videoData = null;
  let currentTabUrl = null;
  let activeTab = 'combined';

  /* ── Init ──────────────────────────────────────────────────────── */

  async function init() {
    showState('loading');

    // First check if we're on a YouTube video page
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.url || !isYouTubeVideo(tab.url)) {
      showError(msg('errorNotYouTube'));
      return;
    }

    currentTabUrl = tab.url;

    // Try to get already extracted data from background
    chrome.runtime.sendMessage({ type: 'GET_VIDEO_DATA' }, (response) => {
      if (response?.data) {
        videoData = response.data;
        showVideoInfo();
        return;
      }

      // Data not ready — ask content script to extract
      chrome.runtime.sendMessage({ type: 'EXTRACT_VIDEO' }, (extractResponse) => {
        if (extractResponse?.data) {
          videoData = extractResponse.data;
          showVideoInfo();
        } else {
          // Even without extraction, show Cobalt-only mode
          showCobaltOnlyMode(tab.url);
        }
      });
    });
  }

  /* ── UI States ───────────────────────────────────────────────── */

  function showState(state) {
    stateLoading.style.display = state === 'loading' ? '' : 'none';
    stateError.style.display = state === 'error' ? '' : 'none';
    stateVideo.style.display = state === 'video' ? '' : 'none';
  }

  function showError(text) {
    errorMessage.textContent = text;
    showState('error');
  }

  /** When direct extraction fails, show Cobalt-based download options */
  function showCobaltOnlyMode(youtubeUrl) {
    const videoId = extractVideoId(youtubeUrl);
    videoData = {
      videoId,
      title: msg('youtubeVideo'),
      author: '',
      lengthSeconds: 0,
      thumbnail: videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : '',
      formats: [], // empty — will use Cobalt
    };

    if (videoId && videoData.thumbnail) {
      videoThumb.src = videoData.thumbnail;
    }
    videoTitle.textContent = msg('cobaltFallbackTitle');
    videoAuthor.textContent = '';
    videoDuration.textContent = '';

    showState('video');
    renderCobaltFormats();
  }

  function showVideoInfo() {
    if (!videoData) return;

    // Thumbnail
    if (videoData.thumbnail) {
      videoThumb.src = videoData.thumbnail;
      videoThumb.alt = videoData.title;
    }

    // Title
    videoTitle.textContent = videoData.title || msg('untitled');

    // Author
    videoAuthor.textContent = videoData.author || msg('unknownAuthor');

    // Duration
    videoDuration.textContent = formatDuration(videoData.lengthSeconds);

    showState('video');

    // Check if we have direct formats
    const directFormats = videoData.formats?.filter((f) => f.url) || [];
    if (directFormats.length > 0) {
      renderFormats();
    } else {
      // No direct URLs — use Cobalt
      renderCobaltFormats();
    }
  }

  /* ── Direct format rendering ────────────────────────────────── */

  function renderFormats() {
    formatList.innerHTML = '';

    if (!videoData?.formats?.length) {
      renderCobaltFormats();
      return;
    }

    let formats = [];

    if (activeTab === 'combined') {
      formats = videoData.formats
        .filter((f) => f.type === 'combined')
        .sort((a, b) => (b.height || 0) - (a.height || 0));
    } else if (activeTab === 'video-only') {
      formats = videoData.formats
        .filter((f) => f.type === 'video-only' && f.mimeType?.includes('mp4'))
        .sort((a, b) => (b.height || 0) - (a.height || 0))
        .slice(0, 6);
    } else if (activeTab === 'audio') {
      formats = videoData.formats
        .filter((f) => f.type === 'audio')
        .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
    }

    if (formats.length === 0) {
      // No formats in this category — show Cobalt options
      renderCobaltFormats();
      return;
    }

    for (const f of formats) {
      formatList.appendChild(createFormatItem(f));
    }

    // Add Cobalt separator and options at the bottom
    const sep = document.createElement('div');
    sep.className = 'cobalt-separator';
    sep.innerHTML = `<span>${msg('orDownloadViaCobalt')}</span>`;
    formatList.appendChild(sep);

    appendCobaltOptions();
  }

  function createFormatItem(format) {
    const item = document.createElement('div');
    item.className = 'format-item';

    // Icon
    const icon = document.createElement('div');
    let iconClass = 'video';
    let iconText = 'MP4';

    if (format.type === 'audio') {
      iconClass = 'audio';
      iconText = format.mimeType?.includes('mp4') ? 'M4A' : 'OGG';
    } else if (format.type === 'video-only') {
      iconClass = 'hd';
      iconText = format.height >= 1080 ? 'FHD' : format.height >= 720 ? 'HD' : 'SD';
    } else {
      iconText = format.height >= 720 ? 'HD' : 'SD';
    }

    icon.className = `format-icon ${iconClass}`;
    icon.textContent = iconText;
    item.appendChild(icon);

    // Details
    const details = document.createElement('div');
    details.className = 'format-details';

    const quality = document.createElement('div');
    quality.className = 'format-quality';

    if (format.type === 'audio') {
      quality.textContent = `${format.quality}`;
    } else {
      const fpsLabel = format.fps && format.fps > 30 ? ` ${format.fps}fps` : '';
      quality.textContent = `${format.quality}${fpsLabel}`;
    }
    details.appendChild(quality);

    const meta = document.createElement('div');
    meta.className = 'format-meta';

    if (format.type === 'combined') {
      meta.textContent = `${msg('videoAndAudio')} \u2022 MP4`;
    } else if (format.type === 'video-only') {
      meta.textContent = `${msg('videoOnly')} \u2022 ${format.mimeType?.includes('webm') ? 'WebM' : 'MP4'}`;
    } else {
      meta.textContent = `${msg('audioLabel')} \u2022 ${format.mimeType?.includes('mp4') ? 'M4A' : 'WebM'}`;
    }
    details.appendChild(meta);
    item.appendChild(details);

    // Size
    if (format.contentLength) {
      const size = document.createElement('span');
      size.className = 'format-size';
      size.textContent = formatSize(format.contentLength);
      item.appendChild(size);
    }

    // Download button
    const dlBtn = document.createElement('button');
    dlBtn.className = 'format-dl-btn';
    dlBtn.title = msg('download');
    dlBtn.innerHTML = dlIconSvg;
    dlBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      downloadDirect(format, dlBtn);
    });
    item.appendChild(dlBtn);

    // Whole row click also downloads
    item.addEventListener('click', () => downloadDirect(format, dlBtn));

    return item;
  }

  /* ── Cobalt format rendering ───────────────────────────────── */

  function renderCobaltFormats() {
    formatList.innerHTML = '';
    appendCobaltOptions();
  }

  function appendCobaltOptions() {
    const qualities = [
      { quality: '1080', label: '1080p', desc: 'Full HD \u2022 MP4', iconClass: 'hd', iconText: 'FHD' },
      { quality: '720', label: '720p', desc: 'HD \u2022 MP4', iconClass: 'video', iconText: 'HD' },
      { quality: '480', label: '480p', desc: 'SD \u2022 MP4', iconClass: 'video', iconText: 'SD' },
      { quality: '360', label: '360p', desc: `${msg('dataSaver')} \u2022 MP4`, iconClass: 'video', iconText: 'SD' },
      { quality: 'audio', label: msg('audioMp3'), desc: '320kbps \u2022 MP3', iconClass: 'audio', iconText: 'MP3' },
    ];

    // Filter based on active tab
    let filtered = qualities;
    if (activeTab === 'audio') {
      filtered = qualities.filter((q) => q.quality === 'audio');
    } else if (activeTab === 'combined' || activeTab === 'video-only') {
      filtered = qualities.filter((q) => q.quality !== 'audio');
    }

    for (const q of filtered) {
      const item = document.createElement('div');
      item.className = 'format-item cobalt-item';

      const icon = document.createElement('div');
      icon.className = `format-icon ${q.iconClass}`;
      icon.textContent = q.iconText;
      item.appendChild(icon);

      const details = document.createElement('div');
      details.className = 'format-details';

      const qualityEl = document.createElement('div');
      qualityEl.className = 'format-quality';
      qualityEl.textContent = q.label;
      details.appendChild(qualityEl);

      const meta = document.createElement('div');
      meta.className = 'format-meta';
      meta.textContent = q.desc;
      details.appendChild(meta);
      item.appendChild(details);

      // Cobalt badge
      const badge = document.createElement('span');
      badge.className = 'cobalt-badge';
      badge.textContent = 'Cobalt';
      item.appendChild(badge);

      // Download button
      const dlBtn = document.createElement('button');
      dlBtn.className = 'format-dl-btn';
      dlBtn.title = msg('downloadViaCobalt');
      dlBtn.innerHTML = dlIconSvg;
      dlBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        downloadViaCobalt(q.quality, dlBtn, item);
      });
      item.appendChild(dlBtn);

      item.addEventListener('click', () => downloadViaCobalt(q.quality, dlBtn, item));

      formatList.appendChild(item);
    }

    // Add audio option in video tabs
    if (activeTab !== 'audio') {
      const audioQ = qualities.find((q) => q.quality === 'audio');
      if (audioQ) {
        const sep = document.createElement('div');
        sep.className = 'cobalt-separator';
        sep.innerHTML = `<span>${msg('audioLabel')}</span>`;
        formatList.appendChild(sep);

        const item = document.createElement('div');
        item.className = 'format-item cobalt-item';

        const icon = document.createElement('div');
        icon.className = `format-icon ${audioQ.iconClass}`;
        icon.textContent = audioQ.iconText;
        item.appendChild(icon);

        const details = document.createElement('div');
        details.className = 'format-details';
        const qualityEl = document.createElement('div');
        qualityEl.className = 'format-quality';
        qualityEl.textContent = audioQ.label;
        details.appendChild(qualityEl);
        const meta = document.createElement('div');
        meta.className = 'format-meta';
        meta.textContent = audioQ.desc;
        details.appendChild(meta);
        item.appendChild(details);

        const badge = document.createElement('span');
        badge.className = 'cobalt-badge';
        badge.textContent = 'Cobalt';
        item.appendChild(badge);

        const dlBtn = document.createElement('button');
        dlBtn.className = 'format-dl-btn';
        dlBtn.title = msg('downloadAudio');
        dlBtn.innerHTML = dlIconSvg;
        dlBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          downloadViaCobalt('audio', dlBtn, item);
        });
        item.appendChild(dlBtn);

        item.addEventListener('click', () => downloadViaCobalt('audio', dlBtn, item));
        formatList.appendChild(item);
      }
    }
  }

  /* ── Direct download ──────────────────────────────────────── */

  function downloadDirect(format, btnEl) {
    if (!videoData) return;

    const title = sanitize(videoData.title || videoData.videoId);
    let ext = 'mp4';
    if (format.mimeType?.includes('webm')) ext = 'webm';
    if (format.type === 'audio') {
      ext = format.mimeType?.includes('mp4') ? 'm4a' : 'webm';
    }

    const filename = `${title} [${format.quality}].${ext}`;

    chrome.runtime.sendMessage({
      type: 'DOWNLOAD',
      url: format.url,
      filename,
    });

    showDownloadFeedback(btnEl);
  }

  /* ── Cobalt download ──────────────────────────────────────── */

  async function downloadViaCobalt(quality, btnEl, rowEl) {
    const url = currentTabUrl;
    if (!url) return;

    // Show loading state
    if (btnEl) {
      btnEl.classList.add('downloading');
      btnEl.innerHTML = spinnerSvg;
    }
    if (rowEl) {
      rowEl.style.opacity = '0.7';
      rowEl.style.pointerEvents = 'none';
    }

    try {
      const isAudio = quality === 'audio';

      const body = {
        url,
        videoQuality: isAudio ? '720' : quality,
        filenameStyle: 'pretty',
      };

      if (isAudio) {
        body.isAudioOnly = true;
        body.audioFormat = 'mp3';
      }

      const resp = await fetch(`${COBALT_API}/`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!resp.ok) {
        throw new Error(`Cobalt returned ${resp.status}`);
      }

      const data = await resp.json();

      if (data.status === 'error' || data.status === 'rate-limit') {
        throw new Error(data.text || 'Cobalt error');
      }

      const downloadUrl = data.url;
      if (!downloadUrl) {
        throw new Error('No download URL from Cobalt');
      }

      // Build filename
      const title = sanitize(videoData?.title || 'video');
      const ext = isAudio ? 'mp3' : 'mp4';
      const filename = `${title} [${isAudio ? 'audio' : quality + 'p'}].${ext}`;

      chrome.runtime.sendMessage({
        type: 'DOWNLOAD',
        url: downloadUrl,
        filename,
      });

      showDownloadFeedback(btnEl);
    } catch (err) {
      console.error('[TubeForge] Cobalt error:', err);
      if (btnEl) {
        btnEl.classList.remove('downloading');
        btnEl.innerHTML = errorSvg;
        btnEl.title = msg('errorPrefix', [err.message]);
        setTimeout(() => {
          btnEl.innerHTML = dlIconSvg;
          btnEl.title = msg('download');
        }, 3000);
      }
    } finally {
      if (rowEl) {
        rowEl.style.opacity = '';
        rowEl.style.pointerEvents = '';
      }
    }
  }

  /* ── Download feedback ─────────────────────────────────────── */

  function showDownloadFeedback(btnEl) {
    if (!btnEl) return;
    btnEl.classList.add('downloading');
    btnEl.innerHTML = checkSvg;
    setTimeout(() => {
      btnEl.classList.remove('downloading');
      btnEl.innerHTML = dlIconSvg;
    }, 3000);
  }

  /* ── Tab handling ──────────────────────────────────────────── */

  for (const tab of tabButtons) {
    tab.addEventListener('click', () => {
      tabButtons.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      activeTab = tab.dataset.tab;

      const directFormats = videoData?.formats?.filter((f) => f.url) || [];
      if (directFormats.length > 0) {
        renderFormats();
      } else {
        renderCobaltFormats();
      }
    });
  }

  /* ── Retry button ─────────────────────────────────────────── */

  btnRetry.addEventListener('click', () => init());

  /* ── SVG icons ────────────────────────────────────────────── */

  const dlIconSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>`;

  const checkSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>`;

  const spinnerSvg = `<svg class="spinner" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
    <circle cx="12" cy="12" r="10" stroke-dasharray="60" stroke-dashoffset="20"/>
  </svg>`;

  const errorSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f87171" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>`;

  /* ── Utilities ────────────────────────────────────────────── */

  function isYouTubeVideo(url) {
    try {
      const u = new URL(url);
      const isYT =
        u.hostname === 'www.youtube.com' ||
        u.hostname === 'youtube.com' ||
        u.hostname === 'm.youtube.com';
      const isVideo = u.pathname === '/watch' || u.pathname.startsWith('/shorts/');
      return isYT && isVideo;
    } catch {
      return false;
    }
  }

  function extractVideoId(url) {
    try {
      const u = new URL(url);
      if (u.pathname === '/watch') return u.searchParams.get('v');
      const m = u.pathname.match(/\/shorts\/([a-zA-Z0-9_-]{11})/);
      return m ? m[1] : null;
    } catch {
      return null;
    }
  }

  function formatDuration(seconds) {
    if (!seconds || seconds <= 0) return msg('liveStream');
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  function formatSize(bytes) {
    if (!bytes || bytes <= 0) return '';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }

  function sanitize(str) {
    return str
      .replace(/[<>:"/\\|?*]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 150);
  }

  /* ── Start ────────────────────────────────────────────────── */

  init();
})();
