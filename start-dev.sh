#!/bin/bash
# Development startup script that loads .env and starts Netlify Dev

set -a  # Automatically export all variables
if [ -f .env ]; then
  echo "Loading environment variables from .env..."
  source .env
  echo "✓ Environment variables loaded"
  echo "Checking key variables:"
  echo "  AGORA_APP_ID: ${AGORA_APP_ID:0:8}..."
  echo "  LLM_API_KEY: ${LLM_API_KEY:+SET (${LLM_API_KEY:0:8}...)}"
  echo "  MICROSOFT_TTS_KEY: ${MICROSOFT_TTS_KEY:+SET (${MICROSOFT_TTS_KEY:0:8}...)}"
  echo "  MICROSOFT_ASR_KEY: ${MICROSOFT_ASR_KEY:+SET (${MICROSOFT_ASR_KEY:0:8}...)}"
else
  echo "⚠️  Warning: .env file not found"
  exit 1
fi
set +a  # Stop auto-exporting

# Start Netlify Dev
echo ""
echo "Starting Netlify Dev..."
netlify dev "$@"

