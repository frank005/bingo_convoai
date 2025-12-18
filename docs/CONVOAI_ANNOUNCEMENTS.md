# ConvoAI Announcement System

## Overview

The ConvoAI agent acts as an **energetic bingo caller** and **game show host**. It joins the channel temporarily to make announcements, then leaves.

## When Does ConvoAI Join & Leave?

### 1. **Game Start** (Manual by Host)
**Triggers:** Host clicks "Start Game" button  
**Agent Says:** `"Let's start the bingo game! Get ready for the first number!"`  
**Lifecycle:**
- Agent joins channel (~2 seconds)
- Speaks announcement (~3 seconds)
- Auto-leaves after 5 seconds

### 2. **Number Called** (Every 10 seconds during gameplay)
**Triggers:** Automatic caller (host only)  
**Agent Says:** `"The number is B-12! Frank is in the lead with 5 points."`  
**Format:**
```
"The number is {COLUMN}-{NUMBER}! {LEADER_NAME} is in the lead with {SCORE} points."
```

**Lifecycle:**
- Agent joins channel (~2 seconds)
- Speaks number + score update (~3-4 seconds)
- Auto-leaves after 5 seconds
- Next call in 10 seconds

### 3. **Game Paused**
**Triggers:** Host clicks "Pause Game" button  
**Agent Says:** `"Game paused. We'll be right back!"`  
**Lifecycle:** Same as above (join → speak → leave)

### 4. **Game Resumed**
**Triggers:** Host clicks "Resume Game" button  
**Agent Says:** `"Game resumed! Let's continue!"`  
**Lifecycle:** Same as above

### 5. **Winner Announcement** (BINGO!)
**Triggers:** Player successfully calls BINGO  
**Agent Says:** 
```
"We have a winner! Frank got BINGO! Final scores: Frank: 15 points, Jane: 10 points, Mike: 8 points. Congratulations!"
```

**Lifecycle:**
- Agent joins channel (~2 seconds)
- Speaks full winner announcement (~5-7 seconds)
- Auto-leaves after 5 seconds

### 6. **Game Ended Early**
**Triggers:** Host clicks "End Game" button  
**Agent Says:** 
```
"Game over! Winner is Frank! Final scores: Frank: 12 points, Jane: 10 points. Congratulations!"
```

**Lifecycle:** Same as winner announcement

## ConvoAI Configuration

The agent's behavior is controlled by environment variables:

```bash
# System instruction (defines personality)
CONVOAI_SYSTEM_INSTRUCTION=You are an energetic Bingo caller. When given a number to call, repeat it clearly and add brief excitement. Keep responses under 10 words. Never use emojis.

# Greeting (what agent says when first joining - empty for silent join)
CONVOAI_GREETING_MESSAGE=

# Greeting mode
CONVOAI_GREETING_MODE=single_first  # or single_every

# Failure message (on errors)
CONVOAI_FAILURE_MESSAGE=I didn't catch that number.
```

## Timeline Example

```
0:00 - Game lobby (2 players join)
0:05 - Host sees "Ready to start!" message
0:05 - Host clicks "Start Game"
0:07 - ConvoAI joins and says "Let's start the bingo game!"
0:10 - ConvoAI leaves
0:10 - First number called: "B-12!"
0:12 - ConvoAI joins
0:14 - ConvoAI announces "The number is B-12! Frank has 0 points."
0:17 - ConvoAI leaves
0:20 - Second number called: "I-23!"
0:22 - ConvoAI joins
0:24 - ConvoAI announces "The number is I-23! Jane is in the lead with 1 point."
0:27 - ConvoAI leaves
... continues every 10 seconds ...
1:30 - Player clicks "BINGO!"
1:30 - ConvoAI joins
1:32 - ConvoAI announces winner and scores
1:37 - ConvoAI leaves
1:37 - Game over
```

## Agent Lifecycle Details

### Join Process
1. Frontend calls `convoAIManager.announceNumber(channelName, message)`
2. Backend builds full agent config from environment variables
3. Agent joins RTC channel with RTM enabled
4. Wait 2 seconds for full join

### Speak Process
1. RTM message sent to agent (USER channel type)
2. Message format:
   ```json
   {
     "messageType": "TEXT",
     "message": "The number is B-12! Frank is in the lead with 5 points.",
     "uuid": "1234567890"
   }
   ```
3. Agent processes through LLM
4. LLM adds personality/excitement
5. TTS converts to speech
6. All players hear via RTC

### Leave Process
1. Timeout timer (5 seconds after join)
2. Backend calls agent leave API
3. Agent disconnects from channel
4. Ready for next announcement

## Message Customization

### Number Announcement Template
Located in: `public/js/game-logic.js` → `announceNumber()`

```javascript
const announcement = `The number is ${callText}! ` + 
  (playerScores.length > 1 ? 
    `${playerScores[0].name} is in the lead with ${playerScores[0].score} points.` : 
    `${playerScores[0].name} has ${playerScores[0].score} points.`);
```

**Customize this to add:**
- Different phrases ("Next up:", "Here comes:", "And the number is...")
- Excitement levels based on game progress
- Special callouts for close games
- Milestone announcements (10 points, 20 points, etc.)

### Winner Announcement Template
Located in: `public/js/game-logic.js` → `triggerWinnerCommentary()`

```javascript
const announcement = `We have a winner! ${this.winner} got BINGO! Final scores: ${playerScores}. Congratulations!`;
```

**Customize to add:**
- Game duration
- Number of calls it took
- Closest runner-up
- Special achievements

## Host Controls

### Start Game Button
- **Visible:** When gameStatus === 'ready' (2+ players joined)
- **Action:** Starts number caller, announces game start
- **ConvoAI:** "Let's start the bingo game!"

### Pause Game Button  
- **Visible:** During active gameplay
- **Action:** Stops caller, pauses game
- **ConvoAI:** "Game paused. We'll be right back!"

### Resume Game Button
- **Visible:** When game is paused
- **Action:** Restarts caller, resumes game
- **ConvoAI:** "Game resumed! Let's continue!"

### End Game Button
- **Visible:** During gameplay (active or paused)
- **Action:** Stops game, determines winner by highest score, announces
- **ConvoAI:** Full winner announcement with scores

## Configuration Tips

### For Faster Announcements
```bash
LLM_MAX_TOKENS=30  # Shorter responses
TURN_DETECTION_SILENCE_MS=500  # Quicker detection
TTS_VENDOR=elevenlabs  # Use Turbo model
ELEVENLABS_MODEL_ID=eleven_turbo_v2_5
```

### For More Personality
```bash
LLM_TEMPERATURE=0.9  # More creative
LLM_MAX_TOKENS=80  # Longer responses
CONVOAI_SYSTEM_INSTRUCTION=You are an extremely energetic and funny bingo caller. Add excitement, sound effects with words like 'Woohoo!', and make it fun! Keep it brief but exciting.
```

### For Professional Tone
```bash
LLM_TEMPERATURE=0.3  # More consistent
CONVOAI_SYSTEM_INSTRUCTION=You are a professional bingo caller. Announce numbers clearly and concisely with a warm, friendly tone. Keep responses brief and focused.
```

### For Different Languages
```bash
ASR_LANGUAGE=es-ES
MICROSOFT_TTS_VOICE=es-ES-ElviraNeural
CONVOAI_SYSTEM_INSTRUCTION=Eres un anunciador de bingo enérgico. Anuncia los números claramente y con entusiasmo. Respuestas breves y sin emojis.
```

## Troubleshooting

### Agent Joins But Doesn't Speak
- Check terminal logs for full request body
- Verify all required environment variables are set
- Check LLM API key is valid
- Try reducing `LLM_MAX_TOKENS` if timeout

### Agent Speaks But Nothing Heard
- Verify TTS_VENDOR matches your configured TTS keys
- Check TTS key is valid
- Test TTS voice in vendor's playground
- Check browser audio permissions

### Agent Takes Too Long
- Use faster vendors (Groq for LLM, ElevenLabs Turbo for TTS)
- Reduce `LLM_MAX_TOKENS`
- Reduce `TURN_DETECTION_SILENCE_MS`
- Consider increasing time between calls (currently 10 seconds)

### Multiple Agents Overlapping
- Each announcement creates a new agent instance
- Agents auto-leave after 5 seconds
- If calls are < 5 seconds apart, they may overlap
- Increase call interval in `game-logic.js` line ~335

## Full Request Body Example

When you start the dev server and trigger an announcement, check the terminal for:

```
==================== ConvoAI Start Request ====================
URL: https://api.agora.io/api/conversational-ai-agent/v2/projects/YOUR_APP_ID/join
Method: POST
Body (Full Agent Config):
{
  "name": "bingo_caller_1234567890",
  "properties": {
    "channel": "bingo_ABCDEF",
    "token": "",
    "agent_rtc_uid": "912345",
    "remote_rtc_uids": ["*"],
    "enable_string_uid": false,
    "idle_timeout": 60,
    "agent_rtm_uid": "912345",
    "advanced_features": {
      "enable_rtm": true
    },
    "asr": {
      "vendor": "microsoft",
      "params": {
        "key": "[REDACTED]",
        "region": "eastus",
        "language": "en-US"
      }
    },
    "llm": {
      "url": "https://api.openai.com/v1/chat/completions",
      "api_key": "[REDACTED]",
      "system_messages": [{
        "role": "system",
        "content": "You are an energetic Bingo caller..."
      }],
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
        "key": "[REDACTED]",
        "region": "eastus",
        "voice_name": "en-US-JennyNeural",
        "rate": 1.0,
        "volume": 100
      }
    },
    "turn_detection": {
      "silence_duration_ms": 800,
      "vendor": "microsoft"
    },
    "parameters": {
      "audio_scenario": "chorus",
      "data_channel": "rtm",
      "transcript": {
        "enable": true
      }
    }
  }
}
===============================================================
```

This full body is logged on every agent start for debugging!

