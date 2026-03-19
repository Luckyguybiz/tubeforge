#!/usr/bin/env bash
set -euo pipefail

echo "Building TubeForge iOS app..."

# Step 1: Build the Next.js app for static export
# Uncomment output: 'export' in next.config.ts first
# npm run build

# Step 2: Copy web assets to Capacitor
npx cap copy ios

# Step 3: Sync native plugins
npx cap sync ios

# Step 4: Open in Xcode
npx cap open ios

echo "iOS project opened in Xcode. Build and run from there."
