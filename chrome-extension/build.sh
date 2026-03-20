#!/usr/bin/env bash
#
# TubeForge Chrome Extension — Build Script
# Creates a .zip file ready for Chrome Web Store upload.
#
# Usage:
#   ./build.sh          # creates tubeforge-chrome-v1.0.0.zip
#   ./build.sh --clean  # remove previous build artifacts first
#

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Read version from manifest.json
VERSION=$(grep -o '"version": *"[^"]*"' manifest.json | head -1 | grep -o '"[0-9][^"]*"' | tr -d '"')
if [ -z "$VERSION" ]; then
  echo "ERROR: Could not read version from manifest.json"
  exit 1
fi

BUILD_DIR="build"
ZIP_NAME="tubeforge-chrome-v${VERSION}.zip"

# Clean previous build if requested
if [ "${1:-}" = "--clean" ]; then
  echo "Cleaning previous build artifacts..."
  rm -rf "$BUILD_DIR"
  rm -f tubeforge-chrome-v*.zip
fi

echo "Building TubeForge Chrome Extension v${VERSION}..."
echo ""

# Create clean build directory
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"

# Copy extension files
cp manifest.json "$BUILD_DIR/"

# Icons
mkdir -p "$BUILD_DIR/icons"
cp icons/icon16.png "$BUILD_DIR/icons/"
cp icons/icon32.png "$BUILD_DIR/icons/"
cp icons/icon48.png "$BUILD_DIR/icons/"
cp icons/icon128.png "$BUILD_DIR/icons/"

# Source files
mkdir -p "$BUILD_DIR/src"
cp src/background.js "$BUILD_DIR/src/"
cp src/content.js "$BUILD_DIR/src/"
cp src/content.css "$BUILD_DIR/src/"
cp src/popup.html "$BUILD_DIR/src/"
cp src/popup.js "$BUILD_DIR/src/"
cp src/popup.css "$BUILD_DIR/src/"

# Locales
mkdir -p "$BUILD_DIR/_locales/en"
mkdir -p "$BUILD_DIR/_locales/ru"
cp _locales/en/messages.json "$BUILD_DIR/_locales/en/"
cp _locales/ru/messages.json "$BUILD_DIR/_locales/ru/"

# Validate required files exist
REQUIRED_FILES=(
  "manifest.json"
  "icons/icon16.png"
  "icons/icon48.png"
  "icons/icon128.png"
  "src/background.js"
  "src/content.js"
  "src/popup.html"
  "src/popup.js"
  "_locales/en/messages.json"
)

echo "Validating build..."
for f in "${REQUIRED_FILES[@]}"; do
  if [ ! -f "$BUILD_DIR/$f" ]; then
    echo "ERROR: Missing required file: $f"
    exit 1
  fi
done

# Verify no secrets or dev artifacts leaked into the build
echo "Checking for secrets..."
if grep -rq "API_KEY\|SECRET\|password\|\.env" "$BUILD_DIR/src/" 2>/dev/null; then
  echo "WARNING: Possible secret detected in source files. Please review before uploading."
fi

# Create zip
echo "Creating $ZIP_NAME..."
cd "$BUILD_DIR"
zip -r "../$ZIP_NAME" . -x "*.DS_Store" -x "__MACOSX/*" -x "*.map"
cd ..

# Report
ZIP_SIZE=$(du -h "$ZIP_NAME" | cut -f1)
FILE_COUNT=$(unzip -l "$ZIP_NAME" | tail -1 | awk '{print $2}')

echo ""
echo "Build complete!"
echo "  Output: $ZIP_NAME ($ZIP_SIZE)"
echo "  Files:  $FILE_COUNT"
echo "  Version: $VERSION"
echo ""
echo "Next steps:"
echo "  1. Test locally: chrome://extensions -> Load unpacked -> select '$BUILD_DIR/'"
echo "  2. Upload to Chrome Web Store: https://chrome.google.com/webstore/devconsole"

# Clean up build directory (keep the zip)
rm -rf "$BUILD_DIR"
