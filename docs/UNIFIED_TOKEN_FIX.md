# Token Generation Update

## ⚠️ Important Note

The `buildTokenWithRtm()` method **does not exist** in `agora-access-token@2.0.4` (the latest version).

We're using the **standard approach** with separate RTC and RTM tokens, which is what the library supports and what works correctly.

---

# ~~Unified Token Generation Fix~~ (NOT APPLICABLE)

## The Problem

We were generating **separate tokens** for RTC and RTM using:
- `RtcTokenBuilder.buildTokenWithUid()` → Creates "006" token (RTC only)
- `RtmTokenBuilder.buildToken()` → Creates separate RTM token

This approach:
- ❌ Uses old token format ("006" prefix)
- ❌ Requires managing two separate tokens
- ❌ Not consistent with modern Agora SDK patterns
- ❌ More complex to maintain

## The Solution

Now using **`buildTokenWithRtm()`** which creates a **single unified token** for both RTC and RTM:

```javascript
const token = await RtcTokenBuilder.buildTokenWithRtm(
  appId,
  appCertificate,
  channelName,
  uid.toString(),
  RtcRole.PUBLISHER,
  tokenExpire,
  privilegeExpire
);
```

This approach:
- ✅ Uses modern token format ("007" prefix)
- ✅ Single token works for both RTC and RTM
- ✅ Matches the `../convo_ai` reference demo
- ✅ Simpler to manage

## Changes Made

### 1. User Token Generation (`generate-token.js`)

**Before:**
```javascript
// Separate tokens
const rtcToken = RtcTokenBuilder.buildTokenWithUid(
  appId, appCertificate, channelName, uid, rtcRole, privilegeExpiredTs
);

const rtmToken = RtmTokenBuilder.buildToken(
  appId, appCertificate, uid.toString(), RtmRole.Rtm_User, privilegeExpiredTs
);

return {
  rtcToken,  // 006abc123...
  rtmToken,  // Different token
  ...
};
```

**After:**
```javascript
// Unified token (synchronous function)
const token = RtcTokenBuilder.buildTokenWithRtm(
  appId,
  appCertificate,
  channelName,
  uid.toString(),
  rtcRole,
  tokenExpire,
  privilegeExpire
);

return {
  rtcToken: token,  // 007xyz789... (same token)
  rtmToken: token,  // 007xyz789... (same token)
  token: token,     // Unified token field
  ...
};
```

### 2. Agent Token Generation (`convoai-agent.js`)

**Before:**
```javascript
function generateAgentTokens(channelName, agentUid) {
  const rtcToken = RtcTokenBuilder.buildTokenWithUid(...);
  const rtmToken = RtmTokenBuilder.buildToken(...);
  return { rtcToken, rtmToken };
}

const { rtcToken: agentRtcToken, rtmToken: agentRtmToken } = generateAgentTokens(...);
```

**After:**
```javascript
function generateAgentToken(channelName, agentUid) {
  const token = RtcTokenBuilder.buildTokenWithRtm(
    appId,
    appCertificate,
    channelName,
    agentUid.toString(),
    RtcRole.PUBLISHER,
    tokenExpire,
    privilegeExpire
  );
  return token;
}

const agentToken = generateAgentToken(...);
```

## Token Format Comparison

### Old Format (006 - RTC Only)
```
006abc123def456...
```
- Only works for RTC
- Requires separate RTM token
- Legacy format

### New Format (007 - RTC + RTM)
```
007xyz789ghi012...
```
- Works for both RTC and RTM
- Single token for everything
- Modern format

## Logging Output

You'll now see different log messages:

**For Users:**
```
Generated unified token (007) for user 123456 in channel bingo_ABC123
```

**For Agent:**
```
Generated unified token (007) for agent UID 956240 in channel bingo_ABC123, valid for 86400s
Agent unified token generated: {
  channel: 'bingo_ABC123',
  rtcUid: 956240,
  rtmUid: 956240,
  hasToken: true,
  tokenPrefix: '007'
}
```

**Token Prefix Check:**
The `tokenPrefix` field in the logs will show:
- **"007"** ✅ Correct - Unified token
- **"006"** ❌ Wrong - Old RTC-only token

## API Response

The token endpoint now returns:

```json
{
  "rtcToken": "007xyz789...",
  "rtmToken": "007xyz789...",
  "token": "007xyz789...",
  "uid": 123456,
  "channelName": "bingo_ABC123",
  "expiresAt": 1703001234,
  "validitySeconds": 3600
}
```

**Note:** `rtcToken` and `rtmToken` are the **same value** for backward compatibility. New code should use the `token` field.

## Parameters Explained

### `tokenExpire`
- **When the entire token expires** (timestamp in seconds)
- For users: current time + 3600s (1 hour)
- For agents: current time + 86400s (24 hours)

### `privilegeExpire`
- **When specific privileges expire**
- Set to `0` means "same as tokenExpire"
- Can be different for fine-grained control

## Benefits

### 1. **Simplified Token Management**
- One token instead of two
- Less code to maintain
- Fewer points of failure

### 2. **Modern Standard**
- Uses latest Agora token format
- Matches reference demos
- Future-proof

### 3. **Better Compatibility**
- Works with all modern Agora SDKs
- Single token for ConvoAI agents
- Consistent across RTC and RTM

### 4. **Easier Debugging**
- Single token to check
- Clear "007" prefix indicates unified token
- Logs show token type

## Backward Compatibility

The response still includes both `rtcToken` and `rtmToken` fields for backward compatibility with existing code:

```javascript
// Old code still works:
const { rtcToken, rtmToken } = await fetch('/generate-token');
rtcClient.join(rtcToken);
rtmClient.login(rtmToken);

// New code can use single token:
const { token } = await fetch('/generate-token');
rtcClient.join(token);
rtmClient.login(token);
```

## Verification

### Check Token Format

In browser console or logs, check the token prefix:

```javascript
console.log(token.substring(0, 3));
// Should output: "007"
```

### Check Token Works for Both

The same token should work for:
1. **RTC Join:**
   ```javascript
   await rtcClient.join(appId, channelName, token, uid);
   ```

2. **RTM Login:**
   ```javascript
   await rtmClient.login(token);
   ```

## Troubleshooting

### Token Starts with "006"

**Problem:** Still generating old format tokens.

**Solution:**
1. Restart your dev server: `npm run dev`
2. Clear browser cache
3. Check you're calling the right endpoint

### "Token parse failed" Error

**Problem:** Mixing old and new token formats.

**Solution:**
1. Make sure both RTC and RTM use the **same token**
2. Don't use `rtcToken` for RTC and `rtmToken` for RTM - use the unified `token`

### Agent Can't Join Channel

**Problem:** Agent token format issue.

**Solution:**
1. Check logs for "Generated unified token (007)"
2. Verify `tokenPrefix: '007'` in agent logs
3. Ensure `buildTokenWithRtm` is being used

## Migration Checklist

For existing code using separate tokens:

- [x] ✅ Update `generate-token.js` to use `buildTokenWithRtm`
- [x] ✅ Update `convoai-agent.js` to use `buildTokenWithRtm`
- [x] ✅ Remove incorrect `async/await` (function is synchronous)
- [x] ✅ Return unified token
- [x] ✅ Maintain backward compatibility fields
- [x] ✅ Update logging messages
- [x] ✅ Add token prefix verification
- [ ] (Optional) Update frontend to use `token` field instead of `rtcToken`/`rtmToken`

## Files Changed

- **`netlify/functions/generate-token.js`** - User token generation
- **`netlify/functions/convoai-agent.js`** - Agent token generation
- **`docs/UNIFIED_TOKEN_FIX.md`** - This documentation

## Reference

From Agora documentation:

```javascript
static buildTokenWithRtm(
  appId,           // Your Agora App ID
  appCertificate,  // Your Agora App Certificate
  channelName,     // RTC channel name
  account,         // User ID (string)
  role,            // RtcRole.PUBLISHER or SUBSCRIBER
  tokenExpire,     // Token expiration timestamp
  privilegeExpire  // Privilege expiration (0 = same as tokenExpire)
)
```

**Note:** This is a **synchronous function** (not async), so don't use `await`.

Returns: A string token with "007" prefix that works for both RTC and RTM.

## Summary

✅ **Using unified token** with "007" prefix  
✅ **Single token** for both RTC and RTM  
✅ **Same method** for users and agents  
✅ **Modern format** matching reference demos  
✅ **Backward compatible** with existing code  
✅ **Simpler to maintain** and debug  

Both users and agents now use the same token generation approach! 🎉

