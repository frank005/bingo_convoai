# Latest Fixes - ConvoAI Integration & Player Presence

## Issues Fixed

### 1. ✅ ConvoAI Agent API Keys Not Being Sent
**Problem:** The ConvoAI agent was failing with errors like `'NoneType' object has no attribute 'output_modalities'` because API keys were not being injected into the request.

**Root Cause:** 
- The backend was building the config but not validating that environment variables were loaded
- Keys were missing from `llm.api_key`, `tts.params.key`, and `asr.params.key`

**Solution:**
1. **Added pre-flight validation** - Backend now checks for required keys before building config
2. **Added pre-send verification** - Logs show "🔑 API Keys Check" with ✅/❌ for each key
3. **Throws errors early** - If keys are missing, request is rejected before sending to Agora
4. **Detailed logging** - Terminal shows which keys are present/missing

**Files Changed:**
- `netlify/functions/convoai-agent.js` - Added validation and verification

**How to Verify:**
```bash
# Start dev server
./start-dev.sh

# Look for this in terminal:
Environment variables validated: {
  hasLLMKey: true,
  hasTTSKey: true,
  hasASRKey: true,
  ...
}

# When agent starts, look for:
🔑 API Keys Check: {
  LLM: '✅ (sk-proj-...)',
  TTS: '✅ (abc123...)',
  ASR: '✅ (xyz789...)'
}
```

### 2. ✅ Missing ConvoAI Configuration Parameters
**Problem:** The request body was missing several parameters that the working example had.

**Solution - Added:**
- `parameters.enable_metrics` (default: true)
- `parameters.enable_error_message` (default: true)
- `tts.params.sample_rate` (default: 24000)
- `remote_rtc_uids` control via env variable
- `idle_timeout` control via env variable

**New Environment Variables:**
```bash
# In .env file:
ENABLE_METRICS=true
ENABLE_ERROR_MESSAGE=true
AGENT_IDLE_TIMEOUT=60
AGENT_REMOTE_RTC_UIDS=*  # or "1001,1002,1003"
```

**Files Changed:**
- `env.example` - Added new variables
- `netlify/functions/convoai-agent.js` - Reads and applies these settings

### 3. ✅ Second Player Can't See First Player
**Problem:** When a second player joined a game, they couldn't see the first player's name or score.

**Root Cause:** 
- Players only broadcast their presence when creating/joining
- If a player joined after another was already there, they missed the initial broadcast

**Solution - Implemented Presence System:**
1. **Presence Request:** When a player joins, they send a `presence-request` message
2. **Presence Response:** All existing players respond with `player-presence` containing their name and score
3. **Automatic Discovery:** Players are automatically added to each other's maps

**Message Flow:**
```
Player 1 creates game → broadcasts "game-created"
Player 2 joins → broadcasts "player-joined" + "presence-request"
Player 1 receives "presence-request" → broadcasts "player-presence"
Player 2 receives "player-presence" → adds Player 1 to their map
```

**Files Changed:**
- `public/js/game-logic.js` - Added presence-request and player-presence handlers

### 4. ✅ Configuration Mapping to Match Working Example
**Problem:** The ConvoAI config structure didn't exactly match the working example.

**Solution - Now Matches:**
```json
{
  "name": "bingo_caller_1234567890",
  "properties": {
    "channel": "bingo_ABC123",
    "token": "",
    "agent_rtc_uid": "956240",
    "remote_rtc_uids": ["*"],           // ✅ Now configurable
    "enable_string_uid": false,
    "idle_timeout": 60,                  // ✅ Now configurable
    "agent_rtm_uid": "956240",
    "advanced_features": {
      "enable_rtm": true
    },
    "asr": {
      "vendor": "microsoft",
      "params": {
        "key": "abc123...",              // ✅ Now injected!
        "region": "eastus",
        "language": "en-US"
      }
    },
    "llm": {
      "url": "https://api.openai.com/v1/chat/completions",
      "api_key": "sk-proj-...",          // ✅ Now injected!
      "system_messages": [...],
      "greeting_message": "",
      "failure_message": "I didn't catch that.",
      "max_history": 1,
      "input_modalities": ["audio"],
      "output_modalities": ["audio"],
      "params": {
        "model": "gpt-4o-mini",
        "temperature": 0.7,
        "max_tokens": 50
      }
    },
    "tts": {
      "vendor": "microsoft",
      "params": {
        "key": "xyz789...",              // ✅ Now injected!
        "region": "eastus",
        "voice_name": "en-US-JennyNeural",
        "sample_rate": 24000             // ✅ Now included!
      }
    },
    "turn_detection": {
      "silence_duration_ms": 800,
      "vendor": "microsoft"
    },
    "parameters": {
      "audio_scenario": "chorus",
      "data_channel": "rtm",
      "enable_metrics": true,            // ✅ Now included!
      "enable_error_message": true,      // ✅ Now included!
      "transcript": {
        "enable": true
      }
    }
  }
}
```

## Required .env Configuration

**Minimum Required:**
```bash
# Agora Credentials
AGORA_APP_ID=your_app_id
AGORA_APP_CERTIFICATE=your_certificate
AGORA_CUSTOMER_ID=your_customer_id
AGORA_CUSTOMER_SECRET=your_customer_secret

# LLM (REQUIRED!)
LLM_VENDOR=openai
LLM_URL=https://api.openai.com/v1/chat/completions
LLM_API_KEY=sk-proj-YOUR_KEY_HERE
LLM_MODEL=gpt-4o-mini

# TTS (REQUIRED if using Microsoft!)
TTS_VENDOR=microsoft
MICROSOFT_TTS_KEY=YOUR_AZURE_KEY_HERE
MICROSOFT_TTS_REGION=eastus
MICROSOFT_TTS_VOICE=en-US-JennyNeural

# ASR (REQUIRED if using Microsoft!)
ASR_VENDOR=microsoft
MICROSOFT_ASR_KEY=YOUR_AZURE_KEY_HERE
MICROSOFT_ASR_REGION=eastus
ASR_LANGUAGE=en-US

# ConvoAI Settings
CONVOAI_SYSTEM_INSTRUCTION=You are an energetic Bingo caller.
ENABLE_METRICS=true
ENABLE_ERROR_MESSAGE=true
AGENT_IDLE_TIMEOUT=60
AGENT_REMOTE_RTC_UIDS=*
```

## Testing Checklist

### Before Starting
- [ ] `.env` file exists in project root
- [ ] All 3 required API keys are set (LLM, TTS, ASR)
- [ ] Agora credentials are correct

### Starting Dev Server
```bash
./start-dev.sh
```

- [ ] Terminal shows "Environment variables validated"
- [ ] All keys show `true` in validation log
- [ ] No errors about missing keys

### Testing Multi-Player
1. **Open two browser windows** (or one normal + one incognito)
2. **Window 1:** Enter name "Player1" → Create New Game
3. **Window 2:** Enter name "Player2" → Join the game from Active Games list
4. **Verify:**
   - [ ] Window 1 shows "Player2" in players list
   - [ ] Window 2 shows "Player1" in players list
   - [ ] Both show correct scores (0 initially)

### Testing ConvoAI
1. **Start a game** with 2 players
2. **Wait 10 seconds** for first number to be called
3. **Check terminal** for:
   - [ ] "🔑 API Keys Check" with all ✅
   - [ ] Full request body logged
   - [ ] No errors about missing keys
4. **In browser:**
   - [ ] Number appears in "Called Numbers" section
   - [ ] Number glows on the board
   - [ ] ConvoAI voice announces the number

### If ConvoAI Fails
1. **Check terminal** for "🔑 API Keys Check"
   - If any show ❌, that key is missing from .env
2. **Check for error messages:**
   - "Missing LLM_API_KEY" → Add to .env
   - "Missing MICROSOFT_TTS_KEY" → Add to .env
   - "Missing MICROSOFT_ASR_KEY" → Add to .env
3. **Restart dev server** after fixing .env
4. **Try again**

## Documentation
- **`API_KEY_FIX.md`** - Detailed troubleshooting for API keys
- **`ENV_SETUP.md`** - Complete environment variable guide
- **`CONVOAI_VENDORS.md`** - Vendor configuration options
- **`env.example`** - Template with all variables

## Next Steps
1. **Test with your actual API keys** - Make sure they're valid
2. **Try different vendors** - Uncomment different LLM/TTS/ASR options in .env
3. **Adjust timing** - Change `AGENT_IDLE_TIMEOUT` if agent leaves too quickly
4. **Customize voice** - Try different `MICROSOFT_TTS_VOICE` options
5. **Monitor logs** - Watch terminal for any issues

## Summary
✅ **API keys are now validated and injected**  
✅ **Configuration matches working example**  
✅ **Players can see each other when joining**  
✅ **All parameters are configurable via .env**  
✅ **Detailed logging for troubleshooting**  

The ConvoAI agent should now work properly! 🎉

