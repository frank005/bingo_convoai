# ConvoAI Integration Fix

## Problem
The ConvoAI agent was failing with error:
```
'NoneType' object has no attribute 'output_modalities'
```

## Root Cause
The agent configuration was missing required fields that the Agora ConvoAI API expects, specifically:
- `input_modalities` and `output_modalities` in the LLM config
- Proper LLM configuration with API keys
- Complete TTS configuration with Microsoft Azure credentials

## Solution

### 1. Updated Agent Configuration

The agent now includes all required fields:

```javascript
{
  name: 'bingo_caller_timestamp',
  properties: {
    channel: channelName,
    agent_rtc_uid: agentRtcUid,
    remote_rtc_uids: ['*'],
    enable_string_uid: false,
    idle_timeout: 60,
    agent_rtm_uid: agentRtcUid,
    advanced_features: {
      enable_rtm: true
    },
    asr: {
      vendor: 'microsoft',
      language: 'en-US'
    },
    llm: {
      url: 'https://api.openai.com/v1/chat/completions',
      api_key: 'INJECTED_BY_BACKEND',
      system_messages: [{
        role: 'system',
        content: 'You are an energetic Bingo caller...'
      }],
      input_modalities: ['audio'],    // REQUIRED
      output_modalities: ['audio'],   // REQUIRED
      params: {
        model: 'gpt-4o-mini',
        temperature: 0.7,
        max_tokens: 50
      }
    },
    tts: {
      vendor: 'microsoft',
      params: {
        key: 'INJECTED_BY_BACKEND',
        region: 'INJECTED_BY_BACKEND',
        voice_name: 'en-US-JennyNeural',
        rate: 1.0,
        volume: 100
      }
    },
    turn_detection: {
      silence_duration_ms: 800,
      vendor: 'microsoft'
    },
    parameters: {
      audio_scenario: 'chorus',
      data_channel: 'rtm',
      transcript: {
        enable: true
      }
    }
  }
}
```

### 2. Backend API Key Injection

The backend function now injects sensitive API keys:

**`netlify/functions/convoai-agent.js`:**
```javascript
// Inject API keys from environment
if (agentConfig && agentConfig.properties) {
  if (agentConfig.properties.llm) {
    agentConfig.properties.llm.api_key = llmApiKey;
  }
  if (agentConfig.properties.tts && agentConfig.properties.tts.params) {
    agentConfig.properties.tts.params.key = microsoftTtsKey;
    agentConfig.properties.tts.params.region = microsoftTtsRegion;
  }
}
```

### 3. Required Environment Variables

Add these to your `.env` file:

```bash
# LLM Configuration (Required for ConvoAI)
LLM_API_KEY=your_openai_api_key_here

# Microsoft TTS Configuration (Required for ConvoAI Voice)
MICROSOFT_TTS_KEY=your_microsoft_tts_key_here
MICROSOFT_TTS_REGION=eastus
```

## How to Get the Keys

### OpenAI API Key (LLM_API_KEY)
1. Go to https://platform.openai.com/api-keys
2. Create a new API key
3. Copy and paste into `.env`

### Microsoft Azure TTS Key (MICROSOFT_TTS_KEY)
1. Go to https://portal.azure.com
2. Create a "Speech Services" resource
3. Go to "Keys and Endpoint"
4. Copy Key 1 and the Location/Region
5. Add to `.env`:
   ```
   MICROSOFT_TTS_KEY=your_key_here
   MICROSOFT_TTS_REGION=eastus  # or your region
   ```

## Testing

After adding the keys:

1. Restart the dev server:
   ```bash
   ./start-dev.sh
   ```

2. Create a game with 2+ players

3. The caller should automatically start after 10 seconds

4. You should hear the ConvoAI agent announce numbers like:
   - "The number is B-12! Frank is in the lead with 5 points!"

## Expected Behavior

### Successful Agent Start:
```
ConvoAI Request: {
  action: 'start',
  url: 'https://api.agora.io/api/conversational-ai-agent/v2/projects/.../join',
  method: 'POST'
}
ConvoAI Response: {
  status: 200,
  data: {
    agent_id: 'some-agent-id',
    channel: 'bingo_ABCDEF'
  }
}
```

### Agent Lifecycle:
1. Number called (e.g., B-12)
2. Agent joins RTC channel (~2 seconds)
3. RTM message sent to agent
4. Agent speaks announcement (~3 seconds)
5. Agent auto-stops after 5 seconds
6. Ready for next number (10 seconds later)

## Troubleshooting

### Still Getting 500 Error?
- Check that all environment variables are set
- Restart the dev server after adding keys
- Check terminal logs for specific error messages

### Agent Joins But Doesn't Speak?
- Check RTM message is being sent (console logs)
- Verify agent UID matches between RTC and RTM
- Check Microsoft TTS key is valid

### No Audio Heard?
- Check microphone permissions in browser
- Verify RTC channel is working (other players can hear each other)
- Check browser console for audio playback errors

## Files Modified

1. `public/js/convoai-manager.js` - Updated agent config with all required fields
2. `netlify/functions/convoai-agent.js` - Added API key injection
3. `env.example` - Added new required variables
4. `ENV_SETUP.md` - Updated documentation

## Reference

Based on the working implementation in `../convo_ai/src/js/utils.js` lines 929-1002.

