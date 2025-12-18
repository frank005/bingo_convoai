// Game Discovery System using RTM Presence
class GameDiscovery {
  constructor() {
    this.rtmClient = null;
    this.discoveryChannel = 'bingo_lobby'; // Central lobby channel
    this.activeGames = new Map();
    this.onGamesUpdated = null;
    this.presenceUpdateInterval = null;
  }
  
  async initialize(appId) {
    try {
      // Create RTM client for game discovery
      const RTMClass = typeof RTM !== 'undefined' ? RTM.RTM : (typeof AgoraRTM !== 'undefined' ? AgoraRTM.RTM : null);
      if (!RTMClass) {
        console.error('RTM SDK not loaded for game discovery');
        return false;
      }
      
      this.rtmClient = new RTMClass(appId);
      console.log('Game discovery RTM client created');
      return true;
    } catch (error) {
      console.error('Failed to initialize game discovery:', error);
      return false;
    }
  }
  
  async connect(rtmToken, uid) {
    try {
      // Login to RTM
      await this.rtmClient.login({
        token: rtmToken,
        uid: uid.toString()
      });
      
      // Subscribe to lobby channel with presence
      await this.rtmClient.subscribe(this.discoveryChannel, {
        withMessage: true,
        withPresence: true,
        withMetadata: true,
        withLock: false
      });
      
      // Listen for presence updates
      this.rtmClient.addEventListener('presence', (event) => {
        this.handlePresenceUpdate(event);
      });
      
      // Listen for game announcements
      this.rtmClient.addEventListener('message', (event) => {
        this.handleLobbyMessage(event);
      });
      
      console.log('Connected to game discovery lobby');
      
      // Periodically request presence data
      this.startPresencePolling();
      
      return true;
    } catch (error) {
      console.error('Failed to connect to game discovery:', error);
      return false;
    }
  }
  
  async announceGame(gameInfo) {
    try {
      const announcement = {
        type: 'game-available',
        gameId: gameInfo.gameId,
        channelName: gameInfo.channelName,
        creator: gameInfo.creator,
        createdAt: Date.now(),
        status: 'waiting'
      };
      
      // Publish game announcement to lobby
      await this.rtmClient.publish(
        this.discoveryChannel,
        JSON.stringify(announcement),
        {
          channelType: 'STREAM',
          customType: 'game-announcement'
        }
      );
      
      // Also set as presence state
      await this.rtmClient.presence.setState(
        this.discoveryChannel,
        'STREAM',
        {
          game: gameInfo.gameId,
          channel: gameInfo.channelName,
          creator: gameInfo.creator,
          status: 'waiting',
          timestamp: Date.now()
        }
      );
      
      console.log('Game announced:', gameInfo.gameId);
      return true;
    } catch (error) {
      console.error('Failed to announce game:', error);
      return false;
    }
  }
  
  async updateGameStatus(gameId, status) {
    try {
      await this.rtmClient.presence.setState(
        this.discoveryChannel,
        'STREAM',
        {
          game: gameId,
          status: status,
          timestamp: Date.now()
        }
      );
      
      console.log('Game status updated:', gameId, status);
    } catch (error) {
      console.error('Failed to update game status:', error);
    }
  }
  
  handlePresenceUpdate(event) {
    // Process presence updates to track active games
    if (event.eventType === 'SNAPSHOT') {
      // Full snapshot of who's in the channel
      this.processPresenceSnapshot(event.snapshot);
    } else if (event.stateChanged) {
      // Someone's state changed
      this.processPresenceChange(event);
    }
  }
  
  processPresenceSnapshot(snapshot) {
    if (!snapshot) return;
    
    this.activeGames.clear();
    
    // Each user in the lobby might be hosting a game
    snapshot.forEach(user => {
      if (user.states && user.states.length > 0) {
        user.states.forEach(state => {
          if (state.game && state.status === 'waiting') {
            this.activeGames.set(state.game, {
              gameId: state.game,
              channelName: state.channel || `bingo_${state.game}`,
              creator: state.creator || 'Unknown',
              createdAt: state.timestamp || Date.now(),
              status: state.status
            });
          }
        });
      }
    });
    
    this.notifyGamesUpdated();
  }
  
  processPresenceChange(event) {
    const userId = event.publisher;
    const states = event.stateChanged;
    
    if (states && states.game) {
      if (states.status === 'waiting') {
        // New game or game became available
        this.activeGames.set(states.game, {
          gameId: states.game,
          channelName: states.channel || `bingo_${states.game}`,
          creator: states.creator || userId,
          createdAt: states.timestamp || Date.now(),
          status: states.status
        });
      } else {
        // Game no longer available (playing or finished)
        this.activeGames.delete(states.game);
      }
      
      this.notifyGamesUpdated();
    }
  }
  
  handleLobbyMessage(event) {
    try {
      const messageStr = typeof event.message === 'string' 
        ? event.message 
        : new TextDecoder().decode(event.message);
      
      const data = JSON.parse(messageStr);
      
      if (data.type === 'game-available' && data.status === 'waiting') {
        this.activeGames.set(data.gameId, {
          gameId: data.gameId,
          channelName: data.channelName,
          creator: data.creator,
          createdAt: data.createdAt,
          status: data.status
        });
        
        this.notifyGamesUpdated();
      } else if (data.type === 'game-full' || data.type === 'game-started') {
        this.activeGames.delete(data.gameId);
        this.notifyGamesUpdated();
      }
    } catch (error) {
      console.error('Failed to handle lobby message:', error);
    }
  }
  
  startPresencePolling() {
    // Request presence data every 10 seconds
    this.presenceUpdateInterval = setInterval(async () => {
      try {
        const whoNow = await this.rtmClient.presence.whoNow(
          this.discoveryChannel,
          'STREAM',
          {
            includeState: true,
            includeUserId: true
          }
        );
        
        if (whoNow && whoNow.occupants) {
          this.processPresenceSnapshot(whoNow.occupants);
        }
      } catch (error) {
        console.error('Failed to get presence data:', error);
      }
    }, 10000);
  }
  
  stopPresencePolling() {
    if (this.presenceUpdateInterval) {
      clearInterval(this.presenceUpdateInterval);
      this.presenceUpdateInterval = null;
    }
  }
  
  notifyGamesUpdated() {
    if (this.onGamesUpdated) {
      const gamesList = Array.from(this.activeGames.values())
        .filter(game => game.status === 'waiting')
        .sort((a, b) => b.createdAt - a.createdAt); // Newest first
      
      this.onGamesUpdated(gamesList);
    }
  }
  
  getActiveGames() {
    return Array.from(this.activeGames.values())
      .filter(game => game.status === 'waiting');
  }
  
  async disconnect() {
    try {
      this.stopPresencePolling();
      
      if (this.rtmClient) {
        await this.rtmClient.unsubscribe(this.discoveryChannel);
        await this.rtmClient.logout();
      }
      
      this.activeGames.clear();
      console.log('Disconnected from game discovery');
    } catch (error) {
      console.error('Failed to disconnect from game discovery:', error);
    }
  }
}

window.GameDiscovery = GameDiscovery;

