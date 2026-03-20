# TubeForge Chrome Extension - Privacy & Data Handling

## Overview

TubeForge is committed to user privacy. This document describes the extension's
data practices for Chrome Web Store compliance.

## Data Collection

**TubeForge does NOT collect, store, or transmit any personal data.**

Specifically, the extension:
- Does NOT collect personally identifiable information
- Does NOT track browsing history
- Does NOT use analytics or telemetry
- Does NOT create user accounts or profiles
- Does NOT use cookies or local storage for tracking
- Does NOT share data with third parties for advertising

## Data Handled Locally (Never Transmitted)

The following data is processed entirely within the user's browser and is never
sent to any server:

| Data                | Purpose                                       | Storage Duration       |
|---------------------|-----------------------------------------------|------------------------|
| Current video ID    | Identify which YouTube video is being viewed  | In-memory only; cleared on tab close or navigation |
| Video metadata      | Display title, author, thumbnail in popup     | In-memory only; cleared on tab close or navigation |
| Streaming URLs      | Enable direct download of video/audio streams | In-memory only; cleared on tab close or navigation |
| Download state      | Track active downloads for UI badge updates   | In-memory only; cleared when download completes    |

## Third-Party Services

### Cobalt API (api.cobalt.tools)
When direct YouTube stream URLs are unavailable, the extension sends the
current YouTube video URL to the Cobalt API to obtain a download link.

- **Data sent:** The YouTube video page URL only
- **When:** Only when the user explicitly clicks a "Cobalt" download option
- **Privacy policy:** https://cobalt.tools/about/privacy

No other third-party services are contacted by the extension.

## Permissions Justification

| Permission                          | Reason                                                    |
|-------------------------------------|-----------------------------------------------------------|
| `activeTab`                         | Access the current tab to detect YouTube videos and inject the download button |
| `downloads`                         | Save video/audio files using Chrome's built-in download manager |
| `https://www.youtube.com/*`         | Read YouTube page data to extract video streaming information |
| `https://youtube.com/*`             | Same as above (non-www variant)                           |
| `https://m.youtube.com/*`           | Same as above (mobile variant)                            |
| `https://*.googlevideo.com/*`       | YouTube serves video streams from googlevideo.com subdomains |
| `https://api.cobalt.tools/*`        | Fallback download service when direct URLs are unavailable |

## Content Security Policy

The extension enforces a strict CSP: `script-src 'self'; object-src 'self'`

This prevents execution of any remote or inline scripts within extension pages.

## Main Privacy Policy

For the full TubeForge privacy policy covering all products and services:
https://tubeforge.co/privacy

## Contact

For privacy questions or data concerns:
- Email: support@tubeforge.co
- Website: https://tubeforge.co
