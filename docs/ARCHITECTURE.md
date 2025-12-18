# Architecture Overview

This document explains the technical architecture of the Bingo ConvoAI application.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend (Browser)                   │
├─────────────────────────────────────────────────────────────┤
│  HTML/CSS/JavaScript                                         │
│  ├─ index.html          Main application page               │
│  ├─ styles.css          Modern UI with Agora colors         │
│  ├─ config.js           Configuration management            │
│  ├─ agora-client.js     RTC/RTM integration                │
│  ├─ convoai-manager.js  AI agent management                │
│  ├─ game-logic.js       Bingo game rules & state           │
│  └─ app.js              Main application controller         │
└─────────────────────────────────────────────────────────────┘
                              ↓ ↑
                    HTTP/WebSocket/WebRTC
                              ↓ ↑
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Netlify Functions)               │
├─────────────────────────────────────────────────────────────┤
│  Node.js Serverless Functions                               │
│  ├─ generate-token.js   RTC/RTM token generation           │
│  └─ convoai-agent.js    ConvoAI agent lifecycle            │
└─────────────────────────────────────────────────────────────┘
                              ↓ ↑
                         REST API / WebSocket
                              ↓ ↑
┌─────────────────────────────────────────────────────────────┐
│                        Agora Platform                        │
├─────────────────────────────────────────────────────────────┤
│  ├─ RTC SDK             Real-time voice communication       │
│  ├─ RTM SDK             Real-time messaging & signaling     │
│  └─ ConvoAI API         AI agent with voice capabilities    │
└─────────────────────────────────────────────────────────────┘
```

## Component Breakdown

### Frontend Components

#### 1. Configuration Manager (`config.js`)
- **Purpose:** Centralized configuration management
- **Storage:** LocalStorage for persistence
- **Features:**
  - App ID management
  - Game settings (board size, token validity)
  - Voice configuration for ConvoAI
- **Pattern:** Singleton

#### 2. Agora Client (`agora-client.js`)
- **Purpose:** Unified interface to Agora RTC and RTM
- **Responsibilities:**
  - RTC client initialization and management
  - RTM client initialization and management
  - Token generation and renewal
  - Event handling and forwarding
- **Key Features:**
  - Automatic token renewal before expiration
  - Event-driven architecture
  - Connection pooling
- **Pattern:** Class-based with event handlers

#### 3. ConvoAI Manager (`convoai-manager.js`)
- **Purpose:** Manage AI game show host lifecycle
- **Responsibilities:**
  - Start/stop ConvoAI agents
  - Generate dynamic commentary from game state
  - Monitor agent state changes
  - Auto-cleanup after commentary
- **Key Features:**
  - Context-aware commentary generation
  - State-based agent lifecycle management
  - RTM message formatting for agent
- **Pattern:** Manager class

#### 4. Game Logic (`game-logic.js`)
- **Purpose:** Core bingo game mechanics
- **Responsibilities:**
  - Board generation with proper BINGO column ranges
  - Game state management
  - Win condition checking
  - Score tracking
  - Move validation
- **Key Features:**
  - Turn-based gameplay
  - Real-time state synchronization via RTM
  - Bingo detection (rows, columns, diagonals)
- **Pattern:** Game state machine

#### 5. Application Controller (`app.js`)
- **Purpose:** Main UI controller and view management
- **Responsibilities:**
  - View switching (setup, lobby, game)
  - UI event handling
  - Game creation and joining
  - URL parameter handling for invitations
- **Key Features:**
  - Multi-view SPA architecture
  - Modal management
  - Notification system
- **Pattern:** MVC Controller

### Backend Components

#### 1. Token Generation Function (`netlify/functions/generate-token.js`)
- **Purpose:** Secure server-side token generation
- **Input:**
  - Channel name
  - User UID
  - Role (publisher/subscriber)
- **Output:**
  - RTC token
  - RTM token
  - Expiration timestamp
- **Security:** Uses App Certificate (never exposed to client)
- **Libraries:** `agora-access-token` (official Agora SDK)

#### 2. ConvoAI Agent Function (`netlify/functions/convoai-agent.js`)
- **Purpose:** Proxy for ConvoAI API calls
- **Actions:**
  - `start`: Create and start an agent
  - `stop`: Stop an agent
  - `query`: Query agent status
- **Security:** Uses Customer ID/Secret (never exposed to client)
- **API:** Agora ConversationalAI REST API v2

## Data Flow

### Game Creation Flow

```
Player 1                    Frontend                    Backend                     Agora
   |                           |                          |                           |
   |--1. Create Game---------->|                          |                           |
   |                           |--2. Generate Tokens----->|                           |
   |                           |<----3. RTC/RTM Tokens----|                           |
   |                           |--4. Join RTC Channel----------------------------->|
   |                           |--5. Login to RTM------------------------------->|
   |                           |--6. Subscribe RTM Channel---------------------->|
   |                           |--7. Broadcast "game-created"-------------------->|
   |<--8. Display Game ID------|                          |                           |
```

### Player Join Flow

```
Player 2                    Frontend                    Backend                     Agora
   |                           |                          |                           |
   |--1. Join Game------------>|                          |                           |
   |                           |--2. Generate Tokens----->|                           |
   |                           |<----3. RTC/RTM Tokens----|                           |
   |                           |--4. Join RTC Channel----------------------------->|
   |                           |--5. Login to RTM------------------------------->|
   |                           |--6. Subscribe RTM Channel---------------------->|
   |                           |--7. Broadcast "player-joined"------------------>|
   |                           |<--8. Receive via RTM<----------------------------|
   |<--9. Update UI------------|                          |                           |
```

### Turn Flow with AI Commentary

```
Player                     Frontend                    Backend                  ConvoAI
   |                           |                          |                         |
   |--1. Mark Cell------------>|                          |                         |
   |                           |--2. Update Local State   |                         |
   |                           |--3. Broadcast via RTM--->|                         |
   |                           |--4. Start Agent--------->|                         |
   |                           |                          |--5. Create Agent------->|
   |                           |<--6. Agent ID------------|<----6b. Agent Info------|
   |                           |--7. Send Commentary----->|                         |
   |                           |                          |--8. RTM Message-------->|
   |                           |                          |                  9. Agent Speaks
   |                           |<--10. Audio via RTC<------------------------------|
   |                           |--11. Monitor State------>|                         |
   |                           |                          |<--12. State: thinking---|
   |                           |--13. Stop Agent--------->|                         |
   |                           |                          |--14. Leave------------>|
```

## Technology Stack

### Frontend
- **Language:** Vanilla JavaScript (ES6+)
- **UI:** Custom CSS with modern gradients and animations
- **Storage:** LocalStorage for configuration and game list
- **Real-Time:** Agora RTC SDK 4.21.0, Agora RTM SDK 2.2.2

### Backend
- **Platform:** Netlify Functions (AWS Lambda)
- **Runtime:** Node.js
- **Framework:** None (serverless functions)
- **Dependencies:**
  - `agora-access-token`: Token generation

### Agora Services
- **RTC SDK:** Real-time voice communication
- **RTM SDK:** Real-time messaging and signaling
- **ConvoAI API:** AI agent with voice capabilities

## Security Architecture

### Token Security
```
Frontend                Backend                      Agora
   |                       |                           |
   |--Request Token------->|                           |
   | (channel, uid)        |                           |
   |                   [Verify]                        |
   |                   [Generate Token]                |
   |                   [Uses App Certificate]          |
   |<--Return Token--------|                           |
   | (valid for 1 hour)    |                           |
   |--Use Token to Join-------------------------------->|
```

**Key Points:**
- ✅ App Certificate never leaves backend
- ✅ Tokens generated server-side only
- ✅ Short-lived tokens (1 hour default)
- ✅ Automatic renewal before expiration
- ✅ Customer credentials in environment variables

### ConvoAI Security
```
Frontend                Backend                   ConvoAI API
   |                       |                           |
   |--Start Agent--------->|                           |
   |                   [Verify]                        |
   |                   [Add Auth Header]               |
   |                   [Uses Customer Secret]          |
   |                       |--Create Agent------------>|
   |                       |<--Agent Details-----------|
   |<--Agent ID------------|                           |
```

**Key Points:**
- ✅ Customer ID/Secret never exposed to client
- ✅ All ConvoAI calls proxied through backend
- ✅ Basic Auth with Customer credentials
- ✅ Agent lifecycle controlled server-side

## State Management

### Game State
```javascript
{
  gameId: string,           // Unique 6-char game ID
  channelName: string,      // RTC/RTM channel
  playerName: string,       // Local player name
  playerUid: number,        // Local player UID
  opponent: string,         // Opponent name
  opponentUid: number,      // Opponent UID
  board: Array<Cell>,       // Bingo board cells
  markedCells: Set<number>, // Local player marks
  opponentMarkedCells: Set<number>, // Opponent marks
  scores: {
    player: number,
    opponent: number
  },
  currentTurn: number,      // UID of player whose turn it is
  gameStatus: string,       // 'waiting' | 'playing' | 'finished'
  winner: string | null     // Winner name if game finished
}
```

### Synchronization
- **Method:** RTM pub/sub messaging
- **Events:**
  - `game-created`: Initial game state
  - `player-joined`: Opponent joined
  - `cell-marked`: Player marked a cell
  - `game-won`: Game finished
- **Reliability:** RTM ensures ordered, reliable delivery

## Performance Considerations

### Optimization Strategies

1. **Token Caching:**
   - Tokens valid for 1 hour
   - Renewed 5 minutes before expiry
   - Reduces backend calls

2. **Efficient Rendering:**
   - Only re-render changed cells
   - Event-driven UI updates
   - No polling, pure event-based

3. **Connection Reuse:**
   - Single RTC client per game
   - Single RTM client per game
   - Shared across game session

4. **Minimal Payload:**
   - JSON messages for game state
   - Only send changed data
   - Compact message format

### Scalability

**Current Limits:**
- **Concurrent Games:** Limited by Agora RTC channel capacity (thousands)
- **Function Calls:** Netlify free tier = 125k/month
- **Bandwidth:** Netlify free tier = 100GB/month

**Bottlenecks:**
- Token generation function calls (2 per player join = ~60k games/month)
- ConvoAI agent starts (1 per turn)
- RTM bandwidth (minimal, ~1KB per message)

**Optimization Opportunities:**
- Implement token caching on client (reduce by 50%)
- Batch multiple turns before commentary
- Use smaller game boards for faster games

## Error Handling

### Retry Logic
- **Token Renewal:** Automatic retry on failure
- **ConvoAI Start:** Single attempt with error message
- **RTM Messages:** SDK handles retries automatically

### Graceful Degradation
- **No ConvoAI:** Game continues without commentary
- **No Voice:** Players can still see moves via UI
- **No RTM:** Can't sync state (game breaks)
- **No RTC:** No voice, but game logic works

### Error Boundaries
- Try-catch around all async operations
- User-friendly error messages
- Console logs for debugging
- Cleanup on errors to prevent memory leaks

## Testing Strategy

### Manual Testing Checklist
- [ ] Create game flow
- [ ] Join game flow
- [ ] Turn-based gameplay
- [ ] Win condition detection
- [ ] Voice chat functionality
- [ ] AI commentary trigger
- [ ] Token renewal
- [ ] Mobile responsiveness
- [ ] Error scenarios
- [ ] Browser compatibility

### Load Testing
- Simulate multiple concurrent games
- Monitor Netlify function performance
- Check Agora usage metrics
- Verify token generation under load

## Future Enhancements

### Potential Features
1. **Multiple Board Sizes:** 3x3, 4x4, 6x6 options
2. **Game Modes:** Speed bingo, multiple winners
3. **Leaderboards:** Track wins across sessions
4. **Replay System:** Review past games
5. **Custom AI Personalities:** Different host styles
6. **Video Chat:** Add camera support
7. **Spectator Mode:** Watch ongoing games
8. **Tournament Mode:** Multi-round competitions

### Technical Improvements
1. **State Persistence:** Backend database for game state
2. **Reconnection Logic:** Handle temporary disconnects
3. **Progressive Web App:** Offline support, installable
4. **Analytics:** Track game metrics
5. **A/B Testing:** Optimize UI/UX
6. **CDN Optimization:** Faster asset delivery

---

This architecture provides a solid foundation for a production-ready multiplayer game with AI integration, while remaining simple enough to understand and maintain.

