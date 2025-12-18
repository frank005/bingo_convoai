# Agent RTM Message Delivery Fix

## The Problem

When trying to send RTM messages to the ConvoAI agent, the system was getting:

```
Error Code -11033 - Publish a message to user now is offline
```

This happened because:
1. The agent wasn't fully online yet when messages were sent
2. The agent's toolkit wasn't enabled to receive peer-to-peer messages
3. The timing window was too short (only 2 seconds wait)

## The Solution

### 1. Increased Wait Time

Extended the wait period from 2 seconds to 4 seconds to ensure the agent is fully online and ready to receive RTM messages:

```javascript
// Wait longer for agent to fully join and be ready for RTM messages
console.log('Waiting for agent to come online...');
await new Promise(resolve => setTimeout(resolve, 4000));
```

### 2. Added Retry Logic

Implemented automatic retry (up to 3 attempts) if the agent isn't ready:

```javascript
async sendAnnouncementMessage(announcement, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await rtmClient.publish(
        this.agentRtcUid.toString(),
        JSON.stringify(messagePayload),
        {
          channelType: 'USER',
          customType: 'user.transcription'
        }
      );
      
      console.log('✅ Announcement message sent to agent successfully');
      return; // Success!
      
    } catch (error) {
      if (error.code === -11033 && attempt < retries) {
        // Agent not online yet, wait and retry
        console.log(`⏳ Agent not ready yet (attempt ${attempt}/${retries}), waiting 2s...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        throw error;
      }
    }
  }
}
```

### 3. Extended Agent Lifetime

Increased the auto-stop timeout to 10 seconds to allow for:
- 4 seconds: Wait for agent to come online
- 6 seconds: Agent processes message and speaks

```javascript
setTimeout(async () => {
  if (this.isAgentActive) {
    console.log('Auto-stopping agent...');
    await this.stopAgent();
  }
}, 10000); // 10 seconds total
```

## How It Works Now

### Timeline

```
0:00 - User triggers number announcement
0:00 - Backend creates agent and joins channel
0:00 - Agent starts joining RTC + RTM
0:04 - First attempt to send message (after 4s wait)
0:04 - ✅ If agent ready: Message delivered
0:04 - ⏳ If agent not ready: Wait 2s, retry
0:06 - Second attempt (if needed)
0:08 - Third attempt (if needed)
0:04-0:10 - Agent processes and speaks
0:10 - Agent auto-stops and leaves
```

### Message Flow

1. **User's RTM Client** sends message to **Agent's UID**
2. Message type: `USER` (peer-to-peer)
3. Custom type: `user.transcription` (tells agent it's a transcript to speak)
4. Message format:
   ```json
   {
     "messageType": "TEXT",
     "message": "The number is B-12! Frank is in the lead with 5 points.",
     "uuid": "1234567890"
   }
   ```

## Configuration

### Environment Variables

The agent configuration is handled automatically through the backend. The key setting is:

```bash
# Agent idle timeout (how long agent stays in channel)
AGENT_IDLE_TIMEOUT=60
```

### Agent Config Structure

The complete agent configuration includes:

```javascript
{
  properties: {
    channel: "bingo_ABC123",
    token: "006abc...",
    agent_rtc_uid: 956240,
    agent_rtm_uid: 956240,
    advanced_features: {
      enable_rtm: true        // ✅ Enable RTM for peer-to-peer messages
    },
    // ... rest of config
  }
}
```

## Logs to Look For

### Successful Message Delivery

```
Waiting for agent to come online...
Agent should be online now, sending message...
Sending announcement to agent: { messageType: 'TEXT', message: '...', uuid: '...' }
✅ Announcement message sent to agent successfully
```

### Retry in Progress

```
Waiting for agent to come online...
Agent should be online now, sending message...
Sending announcement to agent: { messageType: 'TEXT', message: '...', uuid: '...' }
⏳ Agent not ready yet (attempt 1/3), waiting 2s...
⏳ Agent not ready yet (attempt 2/3), waiting 2s...
✅ Announcement message sent to agent successfully
```

### Failure After All Retries

```
Waiting for agent to come online...
Agent should be online now, sending message...
Sending announcement to agent: { messageType: 'TEXT', message: '...', uuid: '...' }
⏳ Agent not ready yet (attempt 1/3), waiting 2s...
⏳ Agent not ready yet (attempt 2/3), waiting 2s...
⏳ Agent not ready yet (attempt 3/3), waiting 2s...
Failed to send announcement message after all retries: RtmUnavailableError: Error Code -11033
```

## Troubleshooting

### Messages Still Failing

**Check agent tokens:**

Make sure both RTC and RTM tokens are being generated (see logs):

```
Generated agent RTC+RTM tokens for channel bingo_ABC123, UID 956240, valid for 86400s
```

**Increase wait time:**

If your network is slow, increase the initial wait:

```javascript
// In convoai-manager.js, line ~60
await new Promise(resolve => setTimeout(resolve, 6000)); // 6 seconds instead of 4
```

**Increase retry count:**

If the agent takes a long time to come online:

```javascript
// In convoai-manager.js
await this.sendAnnouncementMessage(announcement, 5); // 5 retries instead of 3
```

### Agent Joins But Doesn't Speak

**Check message format:**

The message must be JSON with these exact fields:

```json
{
  "messageType": "TEXT",
  "message": "Your text here",
  "uuid": "unique_id"
}
```

**Check custom type:**

Must be `user.transcription` for the agent to process it as speech:

```javascript
{
  channelType: 'USER',
  customType: 'user.transcription'  // Critical!
}
```

**Check agent's system instruction:**

Make sure the agent's LLM prompt tells it to speak the message:

```bash
# In .env
CONVOAI_SYSTEM_INSTRUCTION=You are an energetic Bingo caller. When you receive a message, repeat it clearly with enthusiasm.
```

### Agent Speaks But Message is Garbled

**Check LLM temperature:**

Lower temperature = more accurate repetition:

```bash
LLM_TEMPERATURE=0.3  # Lower for accuracy (default: 0.7)
```

**Check max_tokens:**

Make sure the agent has enough tokens to speak the full message:

```bash
LLM_MAX_TOKENS=100  # Increase if messages are cut off (default: 50)
```

## Comparison with Reference Demo

This implementation matches the `../convo_ai` reference demo pattern:

| Feature | Our Implementation | Reference Demo |
|---------|-------------------|----------------|
| **Toolkit enabled** | ✅ Yes | ✅ Yes |
| **Peer-to-peer messages** | ✅ USER channel type | ✅ USER channel type |
| **Custom type** | ✅ user.transcription | ✅ user.transcription |
| **Wait before sending** | ✅ 4 seconds | ✅ 2-4 seconds |
| **Retry logic** | ✅ Up to 3 retries | ✅ Varies |
| **Message format** | ✅ JSON with messageType/message/uuid | ✅ Same format |

## Summary

✅ **RTM enabled** for peer-to-peer messaging  
✅ **Wait time increased** to 4 seconds for agent to come online  
✅ **Retry logic added** (up to 3 attempts with 2s delays)  
✅ **Extended agent lifetime** to 10 seconds for full cycle  
✅ **Proper message format** with `user.transcription` custom type  
✅ **Matches reference demo** pattern from `../convo_ai`  

The agent should now reliably receive messages from users and announce numbers! 🎉

## Files Changed

- **`netlify/functions/convoai-agent.js`** - Agent configuration with RTM enabled
- **`public/js/convoai-manager.js`** - Increased wait time, added retry logic
- **`docs/AGENT_RTM_FIX.md`** - This documentation

