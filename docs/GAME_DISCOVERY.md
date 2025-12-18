# Game Discovery System

This document explains how the game discovery and channel system works in Bingo ConvoAI.

## Channel Naming Convention

### Format
```
bingo_<GAMEID>
```

### Examples
- `bingo_ABC123`
- `bingo_XY7K2P`
- `bingo_9FN4W2`

### Game ID Generation
```javascript
generateGameId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}
```

This creates a 6-character alphanumeric ID (uppercase):
- Uses base-36 encoding (0-9, A-Z)
- Substring removes the "0." prefix
- Uppercase for readability
- Example outputs: `ABC123`, `XY7K2P`, `9FN4W2`

## Active Games Discovery

### Current Implementation: LocalStorage (Simple)

**Location:** `public/js/game-logic.js`

```javascript
saveGameToList() {
  const games = JSON.parse(localStorage.getItem('availableGames') || '[]');
  games.push({
    gameId: this.gameId,
    creator: this.playerName,
    createdAt: Date.now(),
    status: 'waiting'
  });
  localStorage.setItem('availableGames', JSON.stringify(games));
}
```

**Limitations:**
- ❌ Only shows games created in YOUR browser
- ❌ Doesn't show games from other players
- ❌ Not synchronized across devices
- ❌ Cleared when browser cache is cleared
- ✅ Simple and works for testing

**Use Case:** 
- Single-player testing
- Development
- Demo purposes

### Improved Implementation: RTM Presence (Recommended)

**Location:** `public/js/game-discovery.js`

Uses **Agora RTM Presence** to discover active games across all players.

#### How It Works

1. **Lobby Channel**
   ```javascript
   discoveryChannel = 'bingo_lobby'; // Central meeting point
   ```

2. **Game Announcement**
   When a player creates a game:
   ```javascript
   // Publish to lobby
   await rtmClient.publish('bingo_lobby', {
     type: 'game-available',
     gameId: 'ABC123',
     channelName: 'bingo_ABC123',
     creator: 'Player1',
     status: 'waiting'
   });
   
   // Set presence state
   await rtmClient.presence.setState('bingo_lobby', {
     game: 'ABC123',
     channel: 'bingo_ABC123',
     creator: 'Player1',
     status: 'waiting'
   });
   ```

3. **Game Discovery**
   Other players query presence:
   ```javascript
   const whoNow = await rtmClient.presence.whoNow('bingo_lobby', {
     includeState: true
   });
   // Returns all users in lobby with their game info
   ```

4. **Auto-Update**
   - Polls presence data every 10 seconds
   - Listens for presence events in real-time
   - Updates game list automatically

#### Benefits
- ✅ Shows ALL active games from ANY player
- ✅ Real-time updates
- ✅ Automatic cleanup (when player leaves)
- ✅ Works across devices
- ✅ Synchronized globally

#### Usage

```javascript
// Initialize
const discovery = new GameDiscovery();
await discovery.initialize(appId);

// Connect to lobby
await discovery.connect(rtmToken, userId);

// Listen for updates
discovery.onGamesUpdated = (games) => {
  console.log('Active games:', games);
  updateGameListUI(games);
};

// Announce new game
await discovery.announceGame({
  gameId: 'ABC123',
  channelName: 'bingo_ABC123',
  creator: 'Player1'
});

// Update status when game starts
await discovery.updateGameStatus('ABC123', 'playing');

// Cleanup
await discovery.disconnect();
```

## Channel Architecture

### Channel Types

1. **Discovery Lobby**
   - Channel: `bingo_lobby`
   - Purpose: Game discovery and matchmaking
   - All players join this to see available games
   - Uses RTM Presence for game listings

2. **Game Channels**
   - Format: `bingo_<GAMEID>`
   - Purpose: Actual gameplay
   - Only 2 players per game channel
   - Used for:
     - RTC voice chat
     - RTM game state synchronization
     - Turn management
     - Score updates

### Flow Diagram

```
Player 1                     Lobby Channel                    Player 2
   |                             |                                |
   |--1. Join bingo_lobby------->|                                |
   |                             |<-----2. Join bingo_lobby-------|
   |                             |                                |
   |--3. Create game ABC123----->|                                |
   |   Set presence:             |                                |
   |   {game: ABC123,            |                                |
   |    status: waiting}         |                                |
   |                             |                                |
   |                             |--4. Presence update----------->|
   |                             |    Shows: Game ABC123          |
   |                             |           waiting              |
   |                             |                                |
   |                             |<-----5. Join game ABC123-------|
   |<--6. Player joined----------|                                |
   |                             |                                |
   |--7. Update status---------->|                                |
   |   {game: ABC123,            |                                |
   |    status: playing}         |                                |
   |                             |                                |
   Both join bingo_ABC123 channel for gameplay
   |                                                              |
   |<------------------RTC Voice Chat------------------------->|
   |<------------------RTM Game State-------------------------->|
```

## Switching from LocalStorage to RTM Presence

### In `app.js`, replace:

**Old (LocalStorage):**
```javascript
refreshGameList() {
  const games = JSON.parse(localStorage.getItem('availableGames') || '[]');
  const activeGames = games.filter(g => g.status === 'waiting');
  // Display games...
}
```

**New (RTM Presence):**
```javascript
async initGameDiscovery() {
  this.gameDiscovery = new GameDiscovery();
  await this.gameDiscovery.initialize(window.config.appId);
  
  // Generate token for lobby
  const lobbyToken = await this.generateToken('bingo_lobby', this.lobbyUid);
  await this.gameDiscovery.connect(lobbyToken.rtmToken, this.lobbyUid);
  
  // Listen for updates
  this.gameDiscovery.onGamesUpdated = (games) => {
    this.displayGameList(games);
  };
}

async createGame() {
  // ... create game logic ...
  
  // Announce to lobby
  await this.gameDiscovery.announceGame({
    gameId: gameId,
    channelName: `bingo_${gameId}`,
    creator: playerName
  });
}
```

## Testing Game Discovery

### Local Testing (Current - LocalStorage)
1. Create game in browser window 1
2. Open browser window 2 (same browser)
3. Window 2 will see the game (shared localStorage)

### Network Testing (With RTM Presence)
1. Create game in browser window 1
2. Open browser window 2 (different device/network)
3. Window 2 will see the game (RTM presence)
4. Any player anywhere can discover the game

## Security Considerations

### Channel Name Validation
```javascript
// Always sanitize channel names
function sanitizeChannelName(name) {
  return name.replace(/[^a-zA-Z0-9_]/g, '_').substring(0, 64);
}
```

### Game ID Collision
- Probability of collision with 6-char base-36:
  - 36^6 = ~2.2 billion possible IDs
  - Extremely low collision chance for casual games
  - For production, consider adding timestamp prefix

### Access Control
- RTM channels are public by default
- Consider adding:
  - Password-protected games
  - Private game invites
  - Channel-level encryption

## Future Enhancements

1. **Game Filters**
   - Filter by game mode
   - Filter by board size
   - Filter by player skill level

2. **Matchmaking**
   - Auto-match players
   - Ranked matches
   - Quick play

3. **Game History**
   - Store in backend database
   - Player statistics
   - Match replays

4. **Spectator Mode**
   - Watch ongoing games
   - Learn from others

5. **Tournament Support**
   - Multi-game brackets
   - Leaderboards
   - Prize tracking

## Troubleshooting

### "No games available"
- Check if RTM is properly initialized
- Verify lobby channel connection
- Check presence polling is running
- Look for RTM errors in console

### "Can't see my own game"
- Game discovery shows OTHER players' games
- Your own game is in "Game Room" view
- This is intentional (you don't join your own game)

### "Games not updating"
- Check presence polling interval
- Verify RTM connection is active
- Check browser console for errors
- Ensure tokens haven't expired

---

**Current Status:** LocalStorage implementation (simple, works for testing)

**Recommended:** Implement RTM Presence for production use

**Next Step:** Integrate `GameDiscovery` class into `app.js` for real-time game discovery

