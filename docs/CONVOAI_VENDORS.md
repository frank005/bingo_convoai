# ConvoAI Vendor Configuration Guide

## Overview

The Bingo ConvoAI app supports **all major AI vendors** for LLM, TTS, and ASR. Simply set the environment variables for your chosen vendors, and the backend will automatically build the correct configuration.

## Quick Start

1. Copy `env.example` to `.env`
2. Uncomment the vendor sections you want to use
3. Add your API keys
4. Restart the dev server: `./start-dev.sh`

## Vendor Selection

Choose ONE vendor for each component by uncommenting the relevant section in `.env`:

- **LLM** (Language Model): Choose ONE
- **TTS** (Text-to-Speech): Choose ONE  
- **ASR** (Speech Recognition): Choose ONE

## LLM Vendors

### OpenAI (Default)
```bash
LLM_VENDOR=openai
LLM_URL=https://api.openai.com/v1/chat/completions
LLM_API_KEY=sk-...
LLM_MODEL=gpt-4o-mini
```

**Models:** `gpt-4o`, `gpt-4o-mini`, `gpt-4-turbo`, `gpt-3.5-turbo`

### Azure OpenAI
```bash
LLM_VENDOR=azure_openai
LLM_URL=https://your-resource.openai.azure.com/openai/deployments/your-deployment/chat/completions?api-version=2024-02-15-preview
LLM_API_KEY=your_azure_key
LLM_MODEL=gpt-4
```

### Anthropic Claude
```bash
LLM_VENDOR=anthropic
LLM_URL=https://api.anthropic.com/v1/messages
LLM_API_KEY=sk-ant-...
LLM_MODEL=claude-3-5-sonnet-20241022
```

**Models:** `claude-3-5-sonnet-20241022`, `claude-3-5-haiku-20241022`, `claude-3-opus-20240229`

### Google Gemini
```bash
LLM_VENDOR=google
LLM_URL=https://generativelanguage.googleapis.com/v1beta/models/
LLM_API_KEY=your_google_api_key
LLM_MODEL=gemini-2.0-flash-exp
```

**Models:** `gemini-2.0-flash-exp`, `gemini-1.5-pro`, `gemini-1.5-flash`

### Groq (Fast Inference)
```bash
LLM_VENDOR=groq
LLM_URL=https://api.groq.com/openai/v1/chat/completions
LLM_API_KEY=gsk_...
LLM_MODEL=llama-3.3-70b-versatile
```

**Models:** `llama-3.3-70b-versatile`, `mixtral-8x7b-32768`, `llama-3.1-8b-instant`

### Deepseek
```bash
LLM_VENDOR=deepseek
LLM_URL=https://api.deepseek.com/v1/chat/completions
LLM_API_KEY=sk-...
LLM_MODEL=deepseek-chat
```

### Cerebras (Ultra Fast)
```bash
LLM_VENDOR=cerebras
LLM_URL=https://api.cerebras.ai/v1/chat/completions
LLM_API_KEY=csk-...
LLM_MODEL=llama3.1-70b
```

## TTS (Text-to-Speech) Vendors

### Microsoft Azure (Default)
```bash
TTS_VENDOR=microsoft
MICROSOFT_TTS_KEY=your_key
MICROSOFT_TTS_REGION=eastus
MICROSOFT_TTS_VOICE=en-US-JennyNeural
MICROSOFT_TTS_RATE=1.0  # Optional: 0.5-2.0
MICROSOFT_TTS_VOLUME=100  # Optional: 0-100
```

**Popular Voices:**
- `en-US-JennyNeural` - Female, friendly
- `en-US-GuyNeural` - Male, professional
- `en-US-AriaNeural` - Female, expressive
- `en-US-DavisNeural` - Male, warm

[Full voice list](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support?tabs=tts)

### ElevenLabs (Highest Quality)
```bash
TTS_VENDOR=elevenlabs
ELEVENLABS_TTS_KEY=your_api_key
ELEVENLABS_MODEL_ID=eleven_turbo_v2_5
ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM
ELEVENLABS_STABILITY=0.5  # Optional: 0-1
ELEVENLABS_SIMILARITY_BOOST=0.75  # Optional: 0-1
```

**Models:**
- `eleven_turbo_v2_5` - Fastest, lowest latency
- `eleven_multilingual_v2` - Best quality, 29 languages
- `eleven_monolingual_v1` - English only, high quality

### OpenAI TTS
```bash
TTS_VENDOR=openai
OPENAI_TTS_KEY=sk-...
OPENAI_TTS_MODEL=tts-1
OPENAI_TTS_VOICE=alloy
OPENAI_TTS_SPEED=1.0  # Optional: 0.25-4.0
```

**Voices:** `alloy`, `echo`, `fable`, `onyx`, `nova`, `shimmer`

### Cartesia
```bash
TTS_VENDOR=cartesia
CARTESIA_TTS_KEY=your_api_key
CARTESIA_MODEL_ID=sonic-english
CARTESIA_VOICE_ID=your_voice_id
```

### Google Cloud TTS
```bash
TTS_VENDOR=google
GOOGLE_TTS_CREDENTIALS={"type":"service_account",...}
GOOGLE_TTS_VOICE_NAME=en-US-Neural2-F
GOOGLE_TTS_SPEAKING_RATE=1.0  # Optional
```

### PlayHT
```bash
TTS_VENDOR=playht
PLAYHT_TTS_KEY=your_api_key
PLAYHT_USER_ID=your_user_id
PLAYHT_VOICE_ENGINE=PlayHT2.0-turbo
PLAYHT_VOICE=jennifer
```

### HumeAI (Emotional)
```bash
TTS_VENDOR=humeai
HUMEAI_TTS_KEY=your_api_key
HUMEAI_VOICE_ID=your_voice_id
HUMEAI_PROVIDER=HUME_AI
```

### Rime
```bash
TTS_VENDOR=rime
RIME_TTS_KEY=your_api_key
RIME_SPEAKER=your_speaker_id
RIME_MODEL_ID=mist
```

### FishAudio
```bash
TTS_VENDOR=fishaudio
FISHAUDIO_TTS_KEY=your_api_key
FISHAUDIO_REFERENCE_ID=your_reference_id
FISHAUDIO_BACKEND=v1.1
```

### Groq TTS
```bash
TTS_VENDOR=groq
GROQ_TTS_KEY=gsk_...
GROQ_TTS_MODEL=distil-whisper-large-v3-en
GROQ_TTS_VOICE=alloy
```

### Sarvam (Indic Languages)
```bash
TTS_VENDOR=sarvam
SARVAM_TTS_KEY=your_api_key
SARVAM_SPEAKER=meera
SARVAM_LANGUAGE_CODE=hi-IN
SARVAM_MODEL=bulbul:v1
```

## ASR (Speech Recognition) Vendors

### Microsoft Azure (Default)
```bash
ASR_VENDOR=microsoft
MICROSOFT_ASR_KEY=your_key
MICROSOFT_ASR_REGION=eastus
ASR_LANGUAGE=en-US
MICROSOFT_ASR_PHRASE_LIST=bingo,winner,number  # Optional
```

**Languages:** 100+ languages supported. Common: `en-US`, `en-GB`, `es-ES`, `fr-FR`, `de-DE`, `ja-JP`, `zh-CN`

### Deepgram (Fast & Accurate)
```bash
ASR_VENDOR=deepgram
DEEPGRAM_ASR_KEY=your_api_key
DEEPGRAM_ASR_URL=https://api.deepgram.com/v1/listen
DEEPGRAM_ASR_MODEL=nova-2  # Optional
ASR_LANGUAGE=en-US
```

**Models:**
- `nova-2` - Newest, most accurate
- `enhanced` - Previous generation
- `base` - Fastest, lower cost

### OpenAI Whisper
```bash
ASR_VENDOR=openai
OPENAI_ASR_KEY=sk-...
ASR_LANGUAGE=en
```

### Speechmatics
```bash
ASR_VENDOR=speechmatics
SPEECHMATICS_ASR_KEY=your_api_key
SPEECHMATICS_ASR_LANGUAGE=en
```

### AssemblyAI
```bash
ASR_VENDOR=assemblyai
ASSEMBLYAI_ASR_KEY=your_api_key
ASSEMBLYAI_ASR_LANGUAGE=en_us
```

### Agora ARES (Free!)
```bash
ASR_VENDOR=ares
ASR_LANGUAGE=en-US
```

**No API key required!** Agora's free ASR service.

## Recommended Combinations

### Best Quality (High Cost)
```bash
LLM_VENDOR=anthropic (Claude 3.5 Sonnet)
TTS_VENDOR=elevenlabs
ASR_VENDOR=deepgram
```

### Best Value (Medium Cost)
```bash
LLM_VENDOR=openai (GPT-4o-mini)
TTS_VENDOR=microsoft
ASR_VENDOR=microsoft
```

### Fastest (Low Cost)
```bash
LLM_VENDOR=groq (Llama 3.3 70B)
TTS_VENDOR=elevenlabs (Turbo)
ASR_VENDOR=deepgram (Nova-2)
```

### Free Tier
```bash
LLM_VENDOR=groq (Free tier available)
TTS_VENDOR=microsoft (Free tier: 0.5M chars/month)
ASR_VENDOR=ares (Always free)
```

## Advanced Settings

### LLM Parameters
```bash
LLM_TEMPERATURE=0.7  # Creativity: 0.0-2.0 (lower = more consistent)
LLM_MAX_TOKENS=50  # Response length limit
LLM_MAX_HISTORY=1  # Conversation context (1 = only current turn)
```

### Agent Behavior
```bash
CONVOAI_SYSTEM_INSTRUCTION=You are an energetic Bingo caller...
CONVOAI_GREETING_MESSAGE=  # Optional: What agent says when first joining (leave empty for silent join)
CONVOAI_GREETING_MODE=single_first  # single_first = greet once, single_every = greet every join
CONVOAI_FAILURE_MESSAGE=I didn't catch that.  # What agent says on error/confusion
TURN_DETECTION_SILENCE_MS=800  # How long to wait before responding
AUDIO_SCENARIO=chorus  # chorus, music, speech_and_music
AGENT_IDLE_TIMEOUT=60  # Seconds before agent disconnects
```

**Greeting Modes:**
- `single_first` - Agent greets only on first join (default)
- `single_every` - Agent greets every time it joins

**Example Greeting Messages:**
- Empty string `""` - Silent join (for bingo caller)
- `"Hello! Ready to play bingo?"` - Friendly greeting
- `"Let's get this game started!"` - Excited greeting

## Getting API Keys

### OpenAI
1. https://platform.openai.com/api-keys
2. "Create new secret key"
3. Copy: `sk-...`

### Anthropic
1. https://console.anthropic.com/settings/keys
2. "Create Key"
3. Copy: `sk-ant-...`

### Microsoft Azure
1. https://portal.azure.com
2. Create "Speech Services" or "Cognitive Services"
3. Get Key 1 and Region from "Keys and Endpoint"

### ElevenLabs
1. https://elevenlabs.io/app/settings/api-keys
2. "Generate API Key"
3. Copy key

### Deepgram
1. https://console.deepgram.com/
2. "API Keys" → "Create New Key"
3. Copy key

### Groq
1. https://console.groq.com/keys
2. "Create API Key"
3. Copy: `gsk-...`

## Troubleshooting

### "Configuration error" in logs
- Check that you've set ALL required variables for your chosen vendor
- Make sure API keys don't have quotes around them in `.env`
- Restart dev server after changing `.env`

### Agent starts but doesn't speak
- Check TTS_VENDOR matches your TTS key variables
- Verify TTS key is valid (test in vendor's playground)
- Check browser console for audio errors

### Agent doesn't understand speech
- Check ASR_VENDOR matches your ASR key variables
- Try different ASR_LANGUAGE codes
- Check microphone permissions in browser

### High latency
- Use faster vendors: Groq (LLM), ElevenLabs Turbo (TTS), Deepgram Nova-2 (ASR)
- Reduce LLM_MAX_TOKENS
- Increase TURN_DETECTION_SILENCE_MS slightly

## Testing Your Configuration

After setting up your vendors:

1. Restart: `./start-dev.sh`
2. Check terminal logs for "Starting ConvoAI agent with config"
3. Create a game with 2+ players
4. Wait 10 seconds for first number
5. You should hear the agent announce it!

## Cost Optimization Tips

1. **Use free tiers:**
   - Groq: 14,400 requests/day free
   - Microsoft TTS: 0.5M chars/month free
   - Agora ARES: Always free

2. **Reduce tokens:**
   - Set `LLM_MAX_TOKENS=30` (vs default 50)
   - Keep `CONVOAI_SYSTEM_INSTRUCTION` brief

3. **Use cheaper models:**
   - OpenAI: `gpt-4o-mini` instead of `gpt-4o`
   - Anthropic: `claude-3-5-haiku` instead of `sonnet`

4. **Optimize calls:**
   - Increase time between announcements (edit `game-logic.js`)
   - Only announce on specific events (vs every number)

## Need Help?

Check the terminal logs for detailed error messages. Most issues are due to:
- Missing API keys
- Wrong API key format
- Vendor name typo
- Using variables from wrong vendor section

