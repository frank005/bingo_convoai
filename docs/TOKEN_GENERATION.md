# Token Generation - Current Implementation

## Overview

Both users and agents use **separate RTC and RTM tokens** generated using the `agora-access-token` library (v2.0.4).

## User Token Generation

**Location:** `netlify/functions/generate-token.js`

```javascript
// Generate RTC token
const rtcToken = RtcTokenBuilder.buildTokenWithUid(
  appId,
  appCertificate,
  channelName,
  uid,
  RtcRole.PUBLISHER,
  privilegeExpiredTs
);

// Generate RTM token
const rtmToken = RtmTokenBuilder.buildToken(
  appId,
  appCertificate,
  uid.toString(),
  RtmRole.Rtm_User,
  privilegeExpiredTs
);
```

**Returns:**
```json
{
  "rtcToken": "006abc123...",
  "rtmToken": "007xyz789...",
  "uid": 123456,
  "channelName": "bingo_ABC123",
  "expiresAt": 1703001234,
  "validitySeconds": 3600
}
```

**Validity:** 1 hour (configurable via `BINGO_TOKEN_VALIDITY_SECONDS`)

## Agent Token Generation

**Location:** `netlify/functions/convoai-agent.js`

```javascript
// Generate RTC token for agent
const rtcToken = RtcTokenBuilder.buildTokenWithUid(
  appId,
  appCertificate,
  channelName,
  agentUid,
  RtcRole.PUBLISHER,
  expirationTimeInSeconds
);

// Agent uses only RTC token - RTM is handled internally by ConvoAI
return rtcToken;
```

**Validity:** 24 hours (configurable via `AGENT_TOKEN_VALIDITY_SECONDS`)

## Why Separate Tokens?

### Library Limitation
The `agora-access-token@2.0.4` library (latest version) only provides:
- `RtcTokenBuilder.buildTokenWithUid()` - For RTC tokens
- `RtcTokenBuilder.buildTokenWithAccount()` - Alternative RTC method
- `RtmTokenBuilder.buildToken()` - For RTM tokens

There is **no `buildTokenWithRtm()` method** to create unified tokens.

### Agent Specific
ConvoAI agents only need the **RTC token**. The agent handles RTM internally through the `advanced_features.enable_rtm` configuration:

```javascript
{
  properties: {
    token: rtcToken,  // Only RTC token needed
    advanced_features: {
      enable_rtm: true  // Agent handles RTM internally
    }
  }
}
```

## Token Validity Comparison

| Entity | RTC Token | RTM Token | Validity | Why |
|--------|-----------|-----------|----------|-----|
| **User** | ✅ Yes | ✅ Yes | 1 hour | Normal game session |
| **Agent** | ✅ Yes | ❌ No | 24 hours | Persists across games |

## Configuration

### Environment Variables

```bash
# User token validity (default: 1 hour)
BINGO_TOKEN_VALIDITY_SECONDS=3600

# Agent token validity (default: 24 hours)
AGENT_TOKEN_VALIDITY_SECONDS=86400
```

### Required Credentials

```bash
AGORA_APP_ID=your_app_id
AGORA_APP_CERTIFICATE=your_app_certificate
```

## Usage

### Frontend - Users

```javascript
// Request tokens
const response = await fetch('/.netlify/functions/generate-token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    channelName: 'bingo_ABC123',
    uid: 123456,
    role: 'publisher'
  })
});

const { rtcToken, rtmToken, uid } = await response.json();

// Join RTC channel
await rtcClient.join(appId, channelName, rtcToken, uid);

// Login to RTM
await rtmClient.login(rtmToken);
```

### Backend - Agent

```javascript
// Agent token is generated automatically in convoai-agent.js
const agentToken = generateAgentToken(channelName, agentUid);

// Used in agent config
const agentConfig = {
  properties: {
    token: agentToken,
    agent_rtc_uid: agentUid,
    advanced_features: {
      enable_rtm: true  // Agent handles RTM itself
    }
  }
};
```

## Token Expiration & Renewal

### Users
- Initial token valid for 1 hour
- Frontend should implement renewal logic before expiration
- Check `expiresAt` timestamp and renew at ~5 minutes before

### Agent
- Token valid for 24 hours
- Long enough for multiple games
- No renewal needed in typical usage

## Logging

### User Token Generation
```
Generated RTC+RTM tokens for user 123456 in channel bingo_ABC123
```

### Agent Token Generation
```
Generated RTC token for agent UID 956240 in channel bingo_ABC123, valid for 86400s
Agent token generated: {
  channel: 'bingo_ABC123',
  rtcUid: 956240,
  rtmUid: 956240,
  hasToken: true
}
```

## Security

✅ **All tokens generated server-side**
- App Certificate never exposed to frontend
- Tokens have limited validity
- Different validity for users vs agents

✅ **Environment-based configuration**
- Credentials in `.env` file
- Not committed to version control
- Easy to rotate

✅ **Role-based access**
- Users get PUBLISHER role for RTC
- Agents get PUBLISHER role for RTC
- RTM users get Rtm_User role

## Troubleshooting

### Token Generation Fails

**Check credentials:**
```bash
# Make sure these are set in .env
AGORA_APP_ID=...
AGORA_APP_CERTIFICATE=...
```

**Check certificate is enabled:**
- Go to Agora Console
- Navigate to your project
- Ensure App Certificate is enabled

### RTC Join Fails

- Verify token hasn't expired (`expiresAt` timestamp)
- Check channel name matches token
- Verify UID matches token

### RTM Login Fails

- Verify RTM token is separate from RTC token
- Check UID is string format for RTM
- Ensure token hasn't expired

### Agent Can't Join

- Check agent token in logs
- Verify `AGENT_TOKEN_VALIDITY_SECONDS` is set
- Ensure App Certificate is correct

## Summary

✅ **Separate tokens** for RTC and RTM (library standard)  
✅ **Different validity** for users (1h) and agents (24h)  
✅ **Server-side generation** for security  
✅ **Agent only needs RTC token** (RTM handled internally)  
✅ **Same pattern** as working reference implementations  

This approach matches what the `agora-access-token` library supports and what works reliably! 🎉

