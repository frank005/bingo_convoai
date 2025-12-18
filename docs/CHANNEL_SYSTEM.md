# Channel System & Game Discovery

Complete guide to how channels, game discovery, and RTC/RTM work together in Bingo ConvoAI.

## 📡 Technologies Used

### 1. Agora RTC (Real-Time Communication)
- **Purpose:** Voice chat between players
- **SDK:** `AgoraRTC_N-4.21.0.js`
- **Usage:** Audio streaming during gameplay

### 2. Agora RTM 2.x (Real-Time Messaging / Signaling)
- **Purpose:** Game state synchronization
- **SDK:** `agora-rtm@2.2.2` from jsDelivr CDN
- **Usage:** 
  - Broadcasting moves
  - Turn management
  - Score updates
  - Win conditions

### 3. Agora Channel Management API
- **Purpose:** Game discovery
- **API:** `https://api.sd-rtn.com/dev/v1/channel/{appid}`
- **Usage:** Query active channels to find available games

## 🎮 Channel Architecture

### Channel Naming Convention

```javascript
// Game ID generation (6-character alphanumeric)
function generateGameId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}
// Examples: "ABC123", "XY7K2P", "FN9W42"

// Channel name format
channelName = `bingo_${gameId}`;
// Examples: "bingo_ABC123", "bingo_XY7K2P"
```

### Why This Format?

- **Prefix `bingo_`:** Easy to filter in channel queries
- **6 characters:** Short, memorable, easy to share
- **Uppercase:** Better readability
- **Base-36:** Uses 0-9 and A-Z (36 possible characters)
- **Collision probability:** ~2.2 billion combinations (36^6)

## 🔍 Game Discovery Flow

### Traditional Approach (What We DON'T Use)
```
❌ LocalStorage
- Only shows YOUR games
- Not synchronized
- Lost on cache clear

❌ Manual Channel List
- Players manually type game IDs
- No way to browse available games
```

### Our Approach (What We USE)
```
✅ Agora Channel Management API
- Shows ALL active games
- Real-time accurate
- No polling needed (query on demand)
- Backed by Agora's infrastructure
```

## 🏗️ Implementation

### Backend: Channel List Function

**File:** `netlify/functions/list-channels.js`

```javascript
// Query Agora for all active channels
GET https://api.sd-rtn.com/dev/v1/channel/{appId}

// Filter for bingo games
channels.filter(ch => ch.channel_name.startsWith('bingo_'))

// Only show waiting games (1 player)
.filter(ch => ch.user_count > 0 && ch.user_count < 2)

// Return game list
return {
  games: [{
    gameId: "ABC123",
    channelName: "bingo_ABC123",
    userCount: 1,
    status: "waiting"
  }]
}
```

**Security:** Uses Customer ID/Secret (never exposed to frontend)

### Frontend: Refresh Game List

**File:** `public/js/app.js`

```javascript
async refreshGameList() {
  // Call backend function
  const response = await fetch('/.netlify/functions/list-channels');
  const data = await response.json();
  
  // Display available games
  const games = data.games.filter(g => g.status === 'waiting');
  // ... render UI ...
}
```

**Auto-refresh:** Every 10 seconds when on lobby page

## 🎯 Complete Game Flow

### 1. Player 1 Creates Game

```
Player 1 Browser
   |
   |-- Enter name: "Alice"
   |-- Click "Create New Game"
   |
   v
Game Logic (game-logic.js)
   |
   |-- Generate gameId: "ABC123"
   |-- Create channelName: "bingo_ABC123"
   |-- Generate player UID: 123456
   |
   v
Agora Client (agora-client.js)
   |
   |-- Request tokens from backend
   |   - RTC token for "bingo_ABC123"
   |   - RTM token for "bingo_ABC123"
   |
   |-- Join RTC channel "bingo_ABC123"
   |   - Publish audio track
   |
   |-- Login to RTM with token
   |-- Subscribe to RTM channel "bingo_ABC123"
   |
   v
Agora Backend
   |
   |-- Channel "bingo_ABC123" now exists
   |-- User count: 1
   |-- Status: Active
```

### 2. Player 2 Discovers Game

```
Player 2 Browser
   |
   |-- Opens app
   |-- Sees lobby page
   |
   v
Auto-refresh (every 10 seconds)
   |
   |-- Call /.netlify/functions/list-channels
   |
   v
Backend Function
   |
   |-- Query Agora: GET /dev/v1/channel/{appId}
   |-- Response: [{channel_name: "bingo_ABC123", user_count: 1}, ...]
   |-- Filter: startsWith("bingo_") && user_count == 1
   |-- Return: [{gameId: "ABC123", status: "waiting"}]
   |
   v
Frontend
   |
   |-- Display "Game ABC123 - 1 player • Waiting for opponent"
   |-- Player 2 clicks "Join →"
```

### 3. Player 2 Joins Game

```
Player 2 Browser
   |
   |-- Enter name: "Bob"
   |-- Click join on "Game ABC123"
   |
   v
Game Logic
   |
   |-- Parse gameId: "ABC123"
   |-- Construct channelName: "bingo_ABC123"
   |-- Generate player UID: 234567
   |
   v
Agora Client
   |
   |-- Request tokens for "bingo_ABC123"
   |-- Join RTC channel "bingo_ABC123"
   |-- Login to RTM
   |-- Subscribe to RTM channel "bingo_ABC123"
   |
   v
Agora Backend
   |
   |-- Channel "bingo_ABC123"
   |-- User count: 2 (NOW FULL!)
   |-- Status: Active
```

### 4. Game Discovery Updates

```
Any Player Refreshing Lobby
   |
   |-- Call /.netlify/functions/list-channels
   |
   v
Backend Query
   |
   |-- GET /dev/v1/channel/{appId}
   |-- bingo_ABC123: user_count = 2
   |-- Filter: user_count < 2
   |-- Result: [] (game not shown - it's full!)
   |
   v
Frontend
   |
   |-- "No games available. Create one!"
```

## 🔐 Security & Tokens

### Token Generation

```
Frontend                    Backend                      Agora
   |                           |                           |
   |--Request Token----------->|                           |
   | channelName: bingo_ABC123 |                           |
   | uid: 123456               |                           |
   |                           |                           |
   |                     [Uses App Certificate]            |
   |                     [Generates RTC Token]             |
   |                     [Generates RTM Token]             |
   |                           |                           |
   |<--Return Tokens-----------|                           |
   | rtcToken: "006abc..."     |                           |
   | rtmToken: "006xyz..."     |                           |
   |                           |                           |
   |--Join with Tokens----------------------------------->|
   |                           |                           |
   |<--Connected------------------------------------------|
```

**Security Features:**
- ✅ App Certificate never exposed to frontend
- ✅ Tokens generated server-side only
- ✅ Tokens expire after 1 hour
- ✅ Auto-renewal 5 minutes before expiry
- ✅ Customer credentials in environment variables

## 📊 Channel States

### Channel Lifecycle

```
1. CREATED
   - Player 1 joins
   - user_count: 1
   - Visible in game list ✅

2. FULL
   - Player 2 joins
   - user_count: 2
   - Hidden from game list ❌

3. PLAYING
   - Game in progress
   - Both players active
   - user_count: 2

4. ABANDONED
   - Player leaves
   - user_count: 1 or 0
   - Automatically shows in list again (if 1)
   - Auto-cleanup by Agora (if 0)
```

### Channel Cleanup

**Automatic:**
- Agora removes empty channels after ~5 minutes
- No manual cleanup needed

**Manual:**
- Players can leave game
- Channel persists until all leave

## 🔧 API Reference

### Query Channels

**Endpoint:**
```
GET https://api.sd-rtn.com/dev/v1/channel/{appId}
```

**Query Parameters:**
- `page_no` (optional): Page number (default: 0)
- `page_size` (optional): Results per page (1-500, default: 100)

**Authentication:**
```
Authorization: Basic base64(customerId:customerSecret)
```

**Response:**
```json
{
  "success": true,
  "data": {
    "channels": [
      {
        "channel_name": "bingo_ABC123",
        "user_count": 1
      },
      {
        "channel_name": "bingo_XY7K2P",
        "user_count": 2
      }
    ],
    "total_size": 2
  }
}
```

**Our Filtering:**
```javascript
// Only bingo channels
.filter(ch => ch.channel_name.startsWith('bingo_'))

// Only waiting for players (not full)
.filter(ch => ch.user_count > 0 && ch.user_count < 2)

// Result: Shows games waiting for 2nd player
```

## 🎪 ConvoAI Integration

ConvoAI agent also uses the same channel system:

```
After each turn:
   |
   |-- Game logic triggers commentary
   |
   v
ConvoAI Manager
   |
   |-- Generate unique agent UID: 900000+random
   |-- Create agent via REST API
   |   POST /api/conversational-ai-agent/v2/projects/{appId}/join
   |   {
   |     channel: "bingo_ABC123",
   |     uid: "912345",
   |     enable_rtm: true,
   |     agent_rtm_uid: "912345"
   |   }
   |
   |-- Agent joins same channel "bingo_ABC123"
   |-- Agent speaks commentary
   |-- Both players hear via RTC
   |
   |-- Agent monitors own state
   |-- When state = "thinking" or "silent"
   |-- Agent leaves channel
   |
   v
Result: 
   - Players: 2 users in channel
   - Agent: Temporarily joins, speaks, leaves
   - user_count during commentary: 3
   - user_count after commentary: 2
```

## 🚀 Testing Game Discovery

### Test Scenario 1: No Games

```bash
# Query channels
curl http://localhost:8888/.netlify/functions/list-channels

# Expected result (no games active):
{"success":true,"games":[],"total":0}

# UI shows: "No games available. Create one!"
```

### Test Scenario 2: Create Game

```
1. Browser 1: Create game
   - Game ID: ABC123
   - Channel: bingo_ABC123
   - User count: 1

2. Wait 1 second

3. Browser 2: Refresh lobby
   - Calls list-channels
   - Shows: "Game ABC123 - 1 player • Waiting"

4. Browser 2: Join game
   - Channel: bingo_ABC123
   - User count: 2

5. Browser 3: Refresh lobby
   - Calls list-channels
   - Shows: "No games available" (game is full)
```

### Test Scenario 3: Player Leaves

```
1. Player 1 or Player 2 leaves game
   - Clicks "Leave Game"
   - Disconnects from RTC/RTM
   - User count: 1

2. Other players refresh lobby
   - Game appears again!
   - "Game ABC123 - 1 player • Waiting"
   - Can be joined by new player
```

## 📝 Key Files

| File | Purpose |
|------|---------|
| `netlify/functions/list-channels.js` | Backend: Query Agora channels |
| `public/js/agora-client.js` | RTC/RTM connection management |
| `public/js/game-logic.js` | Game rules & channel creation |
| `public/js/app.js` | UI updates & game list refresh |
| `public/js/convoai-manager.js` | AI agent channel management |

## 🎯 Benefits of This Approach

✅ **Accurate:** Shows real active channels from Agora  
✅ **Real-time:** Query returns current state  
✅ **Scalable:** Agora handles infrastructure  
✅ **Secure:** No client-side channel manipulation  
✅ **Simple:** No complex presence/polling logic  
✅ **Reliable:** Backed by Agora's production systems  
✅ **Cross-device:** Works globally, any network  

## 🔮 Future Enhancements

1. **Pagination:** Handle 100+ concurrent games
2. **Filters:** By board size, difficulty, etc.
3. **Search:** Find specific game IDs
4. **Sorting:** Newest first, by player count
5. **Metadata:** Store game settings in channel metadata
6. **Private Games:** Password-protected channels
7. **Matchmaking:** Auto-pair players by skill
8. **Tournaments:** Multi-game brackets

---

**Current Implementation:** ✅ Using Agora Channel Management API

**Game Discovery:** ✅ Real-time, accurate, scalable

**Next Steps:** Start playing and test the discovery system!

