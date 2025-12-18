# API Key Configuration Fix

## Problem
The ConvoAI agent was failing because **API keys were not being injected** into the configuration. The request body was missing:
- `llm.api_key`
- `tts.params.key`
- `asr.params.key`

## Root Cause
The backend function (`netlify/functions/convoai-agent.js`) was not validating or verifying that environment variables were loaded before sending the request.

## Solution

### 1. Added API Key Validation
The backend now validates all required keys before building the config:

```javascript
// Validate ConvoAI API keys
const llmApiKey = process.env.LLM_API_KEY;
const ttsKey = process.env.MICROSOFT_TTS_KEY;
const asrKey = process.env.MICROSOFT_ASR_KEY;

if (!llmApiKey) {
  console.error('Missing LLM_API_KEY');
  return 500 error;
}

if (TTS vendor is microsoft && !ttsKey) {
  console.error('Missing MICROSOFT_TTS_KEY');
  return 500 error;
}

// etc...
```

### 2. Added Pre-Send Verification
Before sending the request, the backend now checks that keys are present in the final config:

```javascript
const hasLLMKey = agentConfig.properties.llm.api_key && agentConfig.properties.llm.api_key.length > 0;
const hasTTSKey = agentConfig.properties.tts.params.key && agentConfig.properties.tts.params.key.length > 0;
const hasASRKey = agentConfig.properties.asr.params?.key && agentConfig.properties.asr.params.key.length > 0;

console.log('🔑 API Keys Check:', {
  LLM: hasLLMKey ? `✅ (sk-xxx...)` : '❌ MISSING',
  TTS: hasTTSKey ? `✅ (abc123...)` : '❌ MISSING',
  ASR: hasASRKey ? `✅ (xyz789...)` : '❌ MISSING'
});
```

### 3. Added Missing Parameters
Matched the working config by adding:
- `parameters.enable_metrics` (default: true)
- `parameters.enable_error_message` (default: true)
- `tts.params.sample_rate` (default: 24000)

### 4. Added Environment Variable Controls
New env variables:
```bash
ENABLE_METRICS=true
ENABLE_ERROR_MESSAGE=true
AGENT_REMOTE_RTC_UIDS=*  # or comma-separated like "1001,1002"
AGENT_IDLE_TIMEOUT=60
```

### 5. Fixed Player Presence Detection
Second player can now see first player through presence system:
- When a player joins, they send a `presence-request`
- Existing players respond with `player-presence`
- Players are added to each other's maps

## How to Verify Keys Are Set

### Step 1: Check Terminal Logs
When you start the dev server, you should see:
```
Environment variables validated: {
  hasLLMKey: true,
  hasTTSKey: true,
  hasASRKey: true,
  llmVendor: 'openai',
  ttsVendor: 'microsoft',
  asrVendor: 'microsoft'
}
```

If any show `false`, that key is missing!

### Step 2: When Agent Starts
You'll see:
```
🔑 API Keys Check: {
  LLM: '✅ (sk-proj-...)
',
  TTS: '✅ (abc123...)',
  ASR: '✅ (xyz789...)'
}
```

All should show ✅. If any show ❌, the request will be rejected before sending.

### Step 3: Check Full Request Body
The full JSON will be logged with actual keys (first 8 chars shown):
```json
{
  "properties": {
    "llm": {
      "api_key": "sk-proj-abc123..."
    },
    "tts": {
      "params": {
        "key": "abc123...",
        "region": "eastus",
        "voice_name": "en-US-JennyNeural",
        "sample_rate": 24000
      }
    },
    "asr": {
      "params": {
        "key": "xyz789...",
        "region": "eastus",
        "language": "en-US"
      }
    }
  }
}
```

## Required .env File

Make sure your `.env` has:

```bash
# Agora
AGORA_APP_ID=your_app_id
AGORA_APP_CERTIFICATE=your_cert
AGORA_CUSTOMER_ID=your_customer_id
AGORA_CUSTOMER_SECRET=your_customer_secret

# LLM (OpenAI example)
LLM_VENDOR=openai
LLM_URL=https://api.openai.com/v1/chat/completions
LLM_API_KEY=sk-proj-YOUR_KEY_HERE  # <-- REQUIRED!
LLM_MODEL=gpt-4o-mini

# TTS (Microsoft example)
TTS_VENDOR=microsoft
MICROSOFT_TTS_KEY=YOUR_KEY_HERE  # <-- REQUIRED!
MICROSOFT_TTS_REGION=eastus
MICROSOFT_TTS_VOICE=en-US-JennyNeural

# ASR (Microsoft example)
ASR_VENDOR=microsoft
MICROSOFT_ASR_KEY=YOUR_KEY_HERE  # <-- REQUIRED!
MICROSOFT_ASR_REGION=eastus
ASR_LANGUAGE=en-US

# ConvoAI Settings
CONVOAI_SYSTEM_INSTRUCTION=You are an energetic Bingo caller.
ENABLE_METRICS=true
ENABLE_ERROR_MESSAGE=true
AGENT_IDLE_TIMEOUT=60
AGENT_REMOTE_RTC_UIDS=*
```

## Troubleshooting

### "Missing LLM_API_KEY" Error
**Problem:** `.env` file doesn't have `LLM_API_KEY` or it's commented out  
**Solution:** 
1. Open `.env`
2. Find `LLM_API_KEY=`
3. Add your actual key: `LLM_API_KEY=sk-proj-...`
4. Save and restart: `./start-dev.sh`

### "Missing MICROSOFT_TTS_KEY" Error
**Problem:** Using Microsoft TTS but key not set  
**Solution:**
1. Open `.env`
2. Find `MICROSOFT_TTS_KEY=`
3. Add your Azure TTS key
4. Restart dev server

### Keys Show ❌ in Logs
**Problem:** Environment variables not loaded  
**Solutions:**
1. Make sure `.env` file exists in project root
2. Restart the dev server: `./start-dev.sh`
3. Check for typos in variable names
4. Make sure no spaces around `=` in `.env`

### Request Still Fails
**Problem:** Keys in .env but still not working  
**Solutions:**
1. Check terminal for "Environment variables validated" log
2. Look for specific error messages
3. Verify keys are valid (test in vendor's playground)
4. Make sure you're using the script: `./start-dev.sh` not `netlify dev` directly

## Comparison: Before vs After

### BEFORE (Failed Request)
```json
{
  "llm": {
    "url": "https://api.openai.com/v1/chat/completions",
    // api_key MISSING!
    "system_messages": [...]
  },
  "tts": {
    "vendor": "microsoft",
    "params": {
      // key MISSING!
      "region": "eastus",
      "voice_name": "en-US-JennyNeural"
    }
  }
}
```

### AFTER (Working Request)
```json
{
  "llm": {
    "url": "https://api.openai.com/v1/chat/completions",
    "api_key": "sk-proj-abc123...",  // ✅ Present!
    "system_messages": [...]
  },
  "tts": {
    "vendor": "microsoft",
    "params": {
      "key": "abc123...",  // ✅ Present!
      "region": "eastus",
      "voice_name": "en-US-JennyNeural",
      "sample_rate": 24000  // ✅ Added!
    }
  },
  "asr": {
    "vendor": "microsoft",
    "params": {
      "key": "xyz789...",  // ✅ Present!
      "region": "eastus",
      "language": "en-US"
    }
  },
  "parameters": {
    "enable_metrics": true,  // ✅ Added!
    "enable_error_message": true,  // ✅ Added!
    "audio_scenario": "chorus",
    "data_channel": "rtm",
    "transcript": { "enable": true }
  }
}
```

## Testing

1. **Stop the dev server** (Ctrl+C in terminal)
2. **Check your .env file** has all 3 required keys
3. **Restart:** `./start-dev.sh`
4. **Check terminal** for validation logs
5. **Create a game** with 2+ players
6. **Start game** and wait 10 seconds
7. **Check terminal** for "🔑 API Keys Check" - all should be ✅
8. **Listen** for ConvoAI announcement

If all keys show ✅ and the request body is logged, the agent should work!

