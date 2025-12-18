# ConvoAI Integration - Bingo Caller

## 🎙️ How It Works

### The Flow:

1. **Number is Called** (every 10 seconds)
   - Host's game logic picks a random number
   - Broadcasts to all players via RTM

2. **ConvoAI Agent Joins**
   - Agent joins the RTC channel
   - RTM is enabled for the agent
   - Takes ~2 seconds to fully join

3. **Announcement Sent**
   - RTM message sent directly to agent (USER channel type)
   - Message format: `"The number is B-12! PlayerName is in the lead with 5 points."`
   - Agent receives it as `user.transcription`

4. **Agent Speaks**
   - ConvoAI TTS converts text to speech
   - All players hear the announcement
   - Agent adds excitement and energy

5. **Agent Leaves**
   - After 5 seconds, agent automatically stops
   - Leaves the channel
   - Ready for next announcement

## 🔧 Technical Implementation

### ConvoAI Configuration:

```javascript
{
  channel: channelName,
  uid: agentRtcUid,
  properties: {
    system_instruction: 'You are an energetic Bingo caller. Announce numbers clearly and enthusiastically.',
    enable_rtm: true,
    agent_rtm_uid: agentRtcUid,
    tts: {
      vendor: 'microsoft',
      voice_name: 'en-US-JennyNeural',
      rate: 1.0,
      pitch: 1.0,
      volume: 100
    },
    asr: {
      vendor: 'microsoft',
      language: 'en-US'
    },
    turn_detection: {
      silence_duration_ms: 800
    }
  }
}
```

### Message Format:

**To Agent (RTM):**
```json
{
  "messageType": "TEXT",
  "message": "The number is B-12! Frank is in the lead with 5 points.",
  "uuid": "1234567890"
}
```

**Channel Type:** `USER` (peer-to-peer to agent)
**Custom Type:** `user.transcription`

## 📋 Key Features

### 1. **Number Announcements**
- Called every 10 seconds (configurable)
- Includes current leader and their score
- Agent adds energy and excitement

### 2. **Winner Announcements**
- When someone calls BINGO
- Announces winner name
- Reads final scores for all players
- Congratulates the winner

### 3. **Smart Timing**
- 10 seconds between calls gives players time to:
  - Find the number on their board
  - Click to mark it
  - Consider claiming BINGO
  - Listen to the announcement

### 4. **Agent Lifecycle**
Each number call:
- Start agent: ~2 seconds
- Send message: instant
- Agent speaks: ~3 seconds
- Auto-stop: +5 seconds total

## 🎯 Environment Variables Required

```env
# ConvoAI API
CONVOAI_API_URL=https://api.agora.io/api/conversational-ai-agent/v2

# These should already be set for Agora
AGORA_APP_ID=your_app_id
AGORA_CUSTOMER_ID=your_customer_id
AGORA_CUSTOMER_SECRET=your_customer_secret
```

## 🔄 API Calls

### Start Agent (Join Channel)
```
POST https://api.agora.io/api/conversational-ai-agent/v2/projects/{appId}/join
Authorization: Basic {base64(customerId:customerSecret)}
```

### Stop Agent (Leave Channel)
```
POST https://api.agora.io/api/conversational-ai-agent/v2/projects/{appId}/agents/{agentId}/leave
Authorization: Basic {base64(customerId:customerSecret)}
```

## 🎮 Game Timeline

```
0:00 - Game starts with 2+ players
0:00 - First number called
0:00 - Agent joins
0:02 - Agent announces "The number is B-12!"
0:05 - Agent leaves
0:10 - Second number called
0:10 - Agent joins again
0:12 - Agent announces "The number is I-23! Frank is in the lead with 2 points."
0:15 - Agent leaves
... continues every 10 seconds
```

## 🐛 Error Handling

### If Agent Fails to Start:
- Error logged to console
- Game continues without announcement
- Players still see the number on screen
- Next call will try again

### If Agent Fails to Leave:
- Timeout ensures it stops after 5 seconds
- Won't block next announcement
- Each agent has unique UID

## 🎨 User Experience

### What Players Hear:
1. **"The number is B-12!"** (clear announcement)
2. **"Frank is in the lead with 5 points."** (adds context)
3. Voice is energetic and game-show-host-like
4. Timing matches the visual display

### What Players See:
- Large display: **B-12**
- Number glows on their board
- Can click to mark it
- See scores update in real-time

## 🚀 Future Enhancements

- [ ] Add variety to announcements (different phrases)
- [ ] Add "Close to BINGO!" detection and commentary
- [ ] Add dramatic pause before announcing winners
- [ ] Add player name pronunciation handling
- [ ] Add crowd sound effects
- [ ] Allow custom voice selection
- [ ] Add multi-language support

## 📊 Performance

- **Agent Start Time:** ~2 seconds
- **Announcement Duration:** ~3 seconds  
- **Total Cycle:** ~5 seconds
- **Between Calls:** 10 seconds
- **Impact on Bandwidth:** Minimal (TTS audio stream)

## 🔐 Security

- Credentials stored in `.env` (never in frontend)
- Agent tokens generated server-side
- Each agent has unique UID
- Agents auto-stop (can't stay indefinitely)

