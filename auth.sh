#!/bin/bash
set -e

# Path to Google Chrome on macOS
CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

# Launch Chrome with remote debugging and a temporary profile
echo "Launching Chrome with remote debugging enabled..."
echo "IMPORTANT: If this fails, please fully QUIT Google Chrome (Cmd+Q) first."
"$CHROME_PATH" --remote-debugging-port=9222 --remote-allow-origins=* --user-data-dir="/tmp/chrome_dev_profile" &
CHROME_PID=$!

# Give Chrome a moment to start
sleep 2

# Run the authentication command
echo "Running notebooklm-mcp-auth..."
~/.venv/bin/notebooklm-mcp-auth

echo "Authentication complete."
