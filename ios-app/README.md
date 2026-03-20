# TubeForge iOS App

This directory contains instructions for building and distributing the TubeForge iOS app using [Capacitor](https://capacitorjs.com/). Capacitor wraps the existing Next.js web application in a native iOS WebView shell, providing access to native APIs (haptics, status bar, keyboard management, etc.).

---

## Prerequisites

1. **macOS** with **Xcode 15+** installed (includes iOS Simulator)
2. **CocoaPods** — install via `sudo gem install cocoapods` or `brew install cocoapods`
3. **Node.js 18+** and **npm**
4. **Apple Developer Account** (required for device testing and App Store submission)
5. The TubeForge Next.js project fully set up (`npm install` completed)

---

## Project Structure

```
tubeforge-next/
  capacitor.config.ts     # Capacitor configuration
  src/lib/capacitor.ts     # Native bridge helpers (haptics, status bar, etc.)
  src/components/NativeShell.tsx  # Root wrapper for native features
  scripts/build-ios.sh     # Build automation script
  public/apple-app-site-association  # Universal links config
  ios/                     # Generated native iOS project (after `npx cap add ios`)
```

---

## Initial Setup

### 1. Add the iOS platform

Run this once to generate the native Xcode project:

```bash
npx cap add ios
```

This creates the `ios/` directory with an Xcode workspace.

### 2. Install CocoaPods dependencies

```bash
cd ios/App
pod install
cd ../..
```

### 3. Open in Xcode

```bash
npx cap open ios
```

---

## Development Workflow

### Running with the Live Vercel URL (Default)

The default `capacitor.config.ts` points to the production Vercel deployment:

```typescript
server: {
  url: 'https://tubeforge.co',
  cleartext: false,
}
```

This means the iOS app loads the live site in a native shell. To test:

1. `npx cap sync ios` — sync plugin configurations
2. `npx cap open ios` — open Xcode
3. Build and run on a Simulator or physical device

### Running with Local Development Server

For local development, update `capacitor.config.ts`:

```typescript
server: {
  // Use your Mac's local IP (not localhost — the Simulator needs a real IP)
  url: 'http://192.168.x.x:3000',
  cleartext: true,  // Allow HTTP for local dev
}
```

Then:

```bash
npm run dev                 # Start Next.js dev server
npx cap sync ios           # Sync config changes
npx cap open ios           # Open in Xcode
# Build and run in Simulator
```

### Using Static Export (Offline-capable)

For a fully self-contained app that doesn't require a network connection:

1. Enable static export in `next.config.ts`:
   ```typescript
   output: 'export',
   ```
2. Build:
   ```bash
   npm run build
   ```
3. The `out/` directory contains the static site. Capacitor will bundle it into the app:
   ```bash
   npx cap copy ios
   npx cap sync ios
   npx cap open ios
   ```
4. Remove or comment out the `server.url` in `capacitor.config.ts` so Capacitor serves from the bundled files.

---

## Build and Run

### Using the Build Script

```bash
./scripts/build-ios.sh
```

### Manual Steps

```bash
# Copy web assets into the native project
npx cap copy ios

# Sync native plugins and configurations
npx cap sync ios

# Open in Xcode
npx cap open ios
```

In Xcode:
1. Select your target device (Simulator or physical device)
2. Click the **Run** button (or press `Cmd + R`)
3. For physical devices, you must configure signing (see below)

---

## Code Signing and Provisioning

### For Simulator Testing
No signing required — just build and run.

### For Physical Device Testing
1. Open `ios/App/App.xcworkspace` in Xcode
2. Select the **App** target
3. Go to **Signing & Capabilities**
4. Select your **Team** (Apple Developer account)
5. Xcode will auto-create a provisioning profile
6. Connect your device and select it as the run target

### For App Store Distribution
1. In Xcode, select **Product > Archive**
2. In the Organizer, click **Distribute App**
3. Choose **App Store Connect**
4. Follow the signing prompts (use your distribution certificate)

---

## App Store Submission Guide

### 1. App Store Connect Setup
1. Log in to [App Store Connect](https://appstoreconnect.apple.com/)
2. Create a new app:
   - **Bundle ID**: `com.tubeforge.app`
   - **Name**: TubeForge
   - **Primary Language**: English
   - **SKU**: `tubeforge-ios-001`

### 2. Prepare App Metadata
- **App Description**: Write a compelling description of TubeForge's features
- **Screenshots**: Capture screenshots on iPhone 15 Pro Max (6.7") and iPhone SE (4.7") at minimum
- **App Icon**: 1024x1024 PNG (no transparency, no rounded corners)
- **Keywords**: youtube, thumbnail, video, creator, tools
- **Category**: Utilities or Photo & Video
- **Privacy Policy URL**: Add your privacy policy URL
- **Support URL**: Add your support/contact URL

### 3. Build and Upload
```bash
# In Xcode:
# 1. Set version number (e.g., 1.0.0) in target General settings
# 2. Set build number (e.g., 1)
# 3. Select "Any iOS Device" as destination
# 4. Product > Archive
# 5. In Organizer: Distribute App > App Store Connect > Upload
```

### 4. Submit for Review
1. In App Store Connect, select your uploaded build
2. Fill in all required metadata
3. Complete the **App Review Information** section
4. Submit for review (typically 24-48 hours)

### Important Review Guidelines
- Since this is a WebView app, Apple may scrutinize it more closely
- Ensure the app provides value beyond a simple website wrapper
- The native features (haptics, status bar, keyboard handling) help demonstrate native integration
- Include proper error states for offline/no-network scenarios
- Consider adding at least one native-only feature (e.g., push notifications)

---

## Push Notifications (Optional)

### 1. Enable in Xcode
1. Select the App target
2. Go to **Signing & Capabilities**
3. Click **+ Capability**
4. Add **Push Notifications**

### 2. Install Capacitor Push Plugin
```bash
npm install @capacitor/push-notifications
npx cap sync ios
```

### 3. Configure in Code
```typescript
import { PushNotifications } from '@capacitor/push-notifications';

// Request permission
const result = await PushNotifications.requestPermissions();
if (result.receive === 'granted') {
  await PushNotifications.register();
}

// Get the device token
PushNotifications.addListener('registration', (token) => {
  console.log('Push token:', token.value);
  // Send this token to your server
});

// Handle incoming notifications
PushNotifications.addListener('pushNotificationReceived', (notification) => {
  console.log('Push received:', notification);
});
```

### 4. Server-Side Setup
- Create an Apple Push Notification service (APNs) key in Apple Developer portal
- Configure your backend to send push notifications using the APNs key
- Store device tokens from the registration listener

---

## Universal Links

The `public/apple-app-site-association` file enables universal links so that `tubeforge.co` URLs open directly in the iOS app when installed.

**Before deploying**, replace `TEAMID` with your actual Apple Developer Team ID:

```json
{
  "applinks": {
    "details": [
      {
        "appID": "YOUR_TEAM_ID.com.tubeforge.app",
        "paths": ["*"]
      }
    ]
  }
}
```

The file must be served from `https://tubeforge.co/.well-known/apple-app-site-association` with `Content-Type: application/json`. Vercel serves files from `public/` at the root, so you may need to configure a rewrite or move it to `public/.well-known/apple-app-site-association`.

---

## Troubleshooting

### "No matching provisioning profiles found"
- Ensure your Apple Developer account is added in Xcode preferences
- Try **Xcode > Settings > Accounts > Download Manual Profiles**

### White screen on launch
- Check that `capacitor.config.ts` has the correct `server.url`
- Verify the Vercel deployment is live
- Check the Xcode console for JavaScript errors

### Plugins not working
- Run `npx cap sync ios` after any plugin install
- Check `ios/App/Podfile` includes the new plugin pod
- Run `cd ios/App && pod install`

### App rejected by Apple Review
- Ensure the app does more than just wrap a website
- Add native features (haptics on button taps, etc.)
- Handle offline state gracefully
- Include a proper splash screen

---

## Useful Commands

| Command | Description |
|---------|-------------|
| `npx cap add ios` | Initialize the iOS project (run once) |
| `npx cap copy ios` | Copy web assets to native project |
| `npx cap sync ios` | Copy + update native plugins |
| `npx cap open ios` | Open project in Xcode |
| `npx cap doctor` | Check environment and dependencies |
| `npx cap ls` | List installed Capacitor plugins |
