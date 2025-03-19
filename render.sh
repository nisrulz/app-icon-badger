#!/usr/bin/env bash

# Set some variables for better readability
PUBLIC_DIR="public"
PUG_CLI="pug3"
INDEX_PUG="src/index.pug"
OUTPUT_HTML="public"

# Check if pug3-cli is installed
if ! command -v "$PUG_CLI" &> /dev/null; then
  echo ""
  echo " ⚠️ pug3-cli is not installed."
  echo " Please install it using npm:"
  echo "  npm install -g @tokilabs/pug3-cli"
  echo ""
  exit 1 # Exit with an error code if pug3-cli is not installed
fi

# Calculate the size before minification in bytes
size_before=$(du -s public | cut -f1)

echo ""
echo " 👨🏻‍💻 Starting..."
echo ""

# Using pug-cli to render from pug to html
# Specifically a fork
# - NPM: https://www.npmjs.com/package/@tokilabs/pug3-cli
# - Github: https://github.com/tokilabs/pug3-cli
# because the original is not maintained anymore!
# Generate HTML from Pug file
pug3 "$INDEX_PUG" --out "$OUTPUT_HTML" --silent

echo " ✅  STEP 1: RENDER PUG > HTML"

# Calculate the size after minification in bytes
size_after=$(du -s public | cut -f1)

# Calculate the size difference
size_diff=$((size_before - size_after))

# Display the size difference in a nice message
echo ""
echo " 📈  STEP 2: Size difference of optimized website: $size_diff bytes"