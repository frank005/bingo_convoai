// Bingo Game Logic with Automated Caller
class BingoGame {
  constructor() {
    this.gameId = null;
    this.channelName = null;
    this.playerName = null;
    this.playerUid = null;
    
    this.players = new Map(); // uid -> {name, score, hasWon}
    this.board = [];
    this.markedCells = new Set();
    
    this.calledNumbers = [];
    this.allPossibleNumbers = this.generateAllNumbers();
    
    this.score = 0;
    this.gameStatus = 'waiting'; // waiting, ready, playing, paused, finished
    this.winner = null;
    this.isHost = false; // First player who created the game
    this.isPaused = false;
    
    this.agoraClient = null;
    this.convoAIManager = null;
    
    this.onGameStateChanged = null;
    this.callerInterval = null;
  }
  
  generateAllNumbers() {
    // Generate all possible bingo numbers (1-75)
    const numbers = [];
    for (let i = 1; i <= 75; i++) {
      numbers.push(i);
    }
    return numbers;
  }
  
  generateBoard() {
    const size = window.config.boardSize;
    const board = [];
    const usedNumbers = new Set();
    
    // Generate random numbers for each column
    const ranges = [
      [1, 15],   // B
      [16, 30],  // I
      [31, 45],  // N
      [46, 60],  // G
      [61, 75]   // O
    ];
    
    for (let col = 0; col < size; col++) {
      const [min, max] = ranges[col];
      const columnNumbers = [];
      
      while (columnNumbers.length < size) {
        const num = Math.floor(Math.random() * (max - min + 1)) + min;
        if (!usedNumbers.has(num)) {
          usedNumbers.add(num);
          columnNumbers.push(num);
        }
      }
      
      for (let row = 0; row < size; row++) {
        if (row === Math.floor(size / 2) && col === Math.floor(size / 2)) {
          // Free space in center
          board.push({ number: 'FREE', isFreeSpace: true, col, row });
        } else {
          board.push({ number: columnNumbers[row], isFreeSpace: false, col, row });
        }
      }
    }
    
    this.board = board;
    return board;
  }
  
  async createGame(playerName) {
    this.playerName = playerName;
    this.gameId = this.generateGameId();
    this.channelName = `bingo_${this.gameId}`;
    this.playerUid = Math.floor(Math.random() * 100000) + 100000;
    this.isHost = true;
    
    // Generate board
    this.generateBoard();
    
    // Initialize Agora client
    this.agoraClient = new AgoraClient();
    await this.agoraClient.initialize(this.channelName, this.playerUid);
    
    // Set up event handlers
    this.agoraClient.onMessageReceived = (event) => {
      this.handleMessage(event);
    };
    
    this.agoraClient.onUserJoined = (uid) => {
      console.log('User joined channel:', uid);
      // Request presence from this user
      setTimeout(() => {
        this.broadcastGameState('presence-request');
      }, 500);
    };
    
    this.agoraClient.onUserLeft = (uid) => {
      console.log('User left channel:', uid);
      if (this.players.has(uid)) {
        const player = this.players.get(uid);
        this.players.delete(uid);
        console.log(`Player ${player.name} left the game`);
        this.updateUI();
      }
    };
    
    // Join channel
    await this.agoraClient.join();
    
    // Add self to players
    this.players.set(this.playerUid, {
      name: this.playerName,
      score: 0,
      hasWon: false
    });
    
    // Initialize ConvoAI manager
    this.convoAIManager = new ConvoAIManager();
    
    // Broadcast game creation
    await this.broadcastGameState('game-created');
    
    console.log('Game created:', this.gameId);
    return this.gameId;
  }
  
  async joinGame(gameId, playerName) {
    this.playerName = playerName;
    this.gameId = gameId;
    this.channelName = `bingo_${this.gameId}`;
    this.playerUid = Math.floor(Math.random() * 100000) + 200000;
    this.isHost = false;
    
    // Generate board
    this.generateBoard();
    
    // Initialize Agora client
    this.agoraClient = new AgoraClient();
    await this.agoraClient.initialize(this.channelName, this.playerUid);
    
    // Set up event handlers
    this.agoraClient.onMessageReceived = (event) => {
      this.handleMessage(event);
    };
    
    this.agoraClient.onUserJoined = (uid) => {
      console.log('User joined channel:', uid);
    };
    
    this.agoraClient.onUserLeft = (uid) => {
      console.log('User left channel:', uid);
      if (this.players.has(uid)) {
        const player = this.players.get(uid);
        this.players.delete(uid);
        console.log(`Player ${player.name} left the game`);
        this.updateUI();
      }
    };
    
    // Join channel
    await this.agoraClient.join();
    
    // Add self to players
    this.players.set(this.playerUid, {
      name: this.playerName,
      score: 0,
      hasWon: false
    });
    
    // Initialize ConvoAI manager
    this.convoAIManager = new ConvoAIManager();
    
    // Broadcast join and request game state
    await this.broadcastGameState('player-joined');
    
    // Request presence from all existing players
    setTimeout(() => {
      this.broadcastGameState('presence-request');
    }, 1000);
    
    console.log('Joined game:', this.gameId);
  }
  
  handleMessage(event) {
    try {
      const messageStr = typeof event.message === 'string' 
        ? event.message 
        : new TextDecoder().decode(event.message);
      
      const data = JSON.parse(messageStr);
      console.log('Received message:', data);
      
      switch (data.type) {
        case 'presence-request':
          // Someone is asking for our presence, broadcast it
          if (data.uid !== this.playerUid) {
            console.log('Received presence request from:', data.uid);
            this.broadcastGameState('player-presence', {
              score: this.score
            });
          }
          break;
          
        case 'player-presence':
          // Add or update player from presence broadcast
          if (data.uid !== this.playerUid && !this.players.has(data.uid)) {
            console.log('Received presence from:', data.uid, data.playerName);
            this.players.set(data.uid, {
              name: data.playerName,
              score: data.score || 0,
              hasWon: false
            });
            this.updateUI();
          }
          break;
        
        case 'game-created':
          if (data.uid !== this.playerUid) {
            this.players.set(data.uid, {
              name: data.playerName,
              score: 0,
              hasWon: false
            });
            this.updateUI();
          }
          break;
          
        case 'player-joined':
          if (data.uid !== this.playerUid) {
            this.players.set(data.uid, {
              name: data.playerName,
              score: 0,
              hasWon: false
            });
            
            // If we're the host and we have 2+ players, mark as ready
            if (this.isHost && this.players.size >= 2 && this.gameStatus === 'waiting') {
              console.log('Game ready with', this.players.size, 'players');
              this.gameStatus = 'ready';
              this.updateUI();
            }
            
            // If we just joined, send current state back
            if (this.gameStatus === 'playing' || this.calledNumbers.length > 0) {
              this.broadcastGameState('game-state-sync', {
                calledNumbers: this.calledNumbers,
                gameStatus: this.gameStatus,
                players: Array.from(this.players.entries()).map(([uid, player]) => ({
                  uid, ...player
                }))
              });
            }
            
            this.updateUI();
          }
          break;
          
        case 'game-state-sync':
          // Sync game state for late joiners
          if (data.calledNumbers) {
            this.calledNumbers = data.calledNumbers;
            // Don't auto-mark - let players mark manually
          }
          if (data.gameStatus) {
            this.gameStatus = data.gameStatus;
          }
          if (data.players) {
            data.players.forEach(player => {
              if (player.uid !== this.playerUid) {
                this.players.set(player.uid, {
                  name: player.name,
                  score: player.score,
                  hasWon: player.hasWon
                });
              }
            });
          }
          this.updateUI();
          break;
          
        case 'number-called':
          if (data.number) {
            this.calledNumbers.push(data.number);
            // Don't auto-mark - let players mark manually
            this.updateUI();
          }
          break;
          
        case 'player-score':
          if (data.uid && data.uid !== this.playerUid && this.players.has(data.uid)) {
            this.players.get(data.uid).score = data.score;
            this.updateUI();
          }
          break;
          
        case 'false-bingo':
          if (data.uid && data.uid !== this.playerUid && this.players.has(data.uid)) {
            const player = this.players.get(data.uid);
            player.score = data.score;
            console.log(`${player.name} called a false BINGO! -${data.penalty} points`);
            
            // Host announces the false bingo
            if (this.isHost) {
              await this.announceFalseBingo(player.name);
            }
            
            this.updateUI();
          }
          break;
          
        case 'game-won':
          if (data.uid && this.players.has(data.uid)) {
            this.gameStatus = 'finished';
            this.winner = this.players.get(data.uid).name;
            this.players.get(data.uid).hasWon = true;
            this.stopCaller();
            this.updateUI();
            
            // Trigger commentary
            if (this.isHost) {
              this.triggerWinnerCommentary();
            }
          }
          break;
          
        case 'game-started':
          if (!this.isHost) {
            this.gameStatus = 'playing';
            this.updateUI();
          }
          break;
          
        case 'game-paused':
          if (!this.isHost) {
            this.isPaused = true;
            this.updateUI();
          }
          break;
          
        case 'game-resumed':
          if (!this.isHost) {
            this.isPaused = false;
            this.gameStatus = 'playing';
            this.updateUI();
          }
          break;
          
        case 'game-ended':
          if (!this.isHost) {
            this.stopCaller();
            this.gameStatus = 'finished';
            if (data.winner) {
              this.winner = data.winner;
              if (this.players.has(data.uid)) {
                this.players.get(data.uid).hasWon = true;
              }
            }
            this.updateUI();
          }
          break;
      }
    } catch (error) {
      console.error('Failed to handle message:', error);
    }
  }
  
  async startGame() {
    if (this.gameStatus !== 'waiting' && this.gameStatus !== 'ready') return;
    
    this.gameStatus = 'playing';
    this.isPaused = false;
    this.updateUI();
    
    // Broadcast game start
    await this.broadcastGameState('game-started');
    
    // Only the host runs the caller
    if (this.isHost) {
      await this.announceGameEvent('Let\'s start the bingo game! Get ready for the first number!');
      this.startCaller();
    }
  }
  
  async pauseGame() {
    if (this.gameStatus !== 'playing') return;
    
    this.isPaused = true;
    this.stopCaller();
    
    if (this.isHost) {
      await this.announceGameEvent('Game paused. Taking a quick break, don\'t go anywhere!');
    }
    
    this.broadcastGameState('game-paused');
    this.updateUI();
  }
  
  async resumeGame() {
    if (!this.isPaused) return;
    
    this.isPaused = false;
    this.gameStatus = 'playing';
    this.broadcastGameState('game-resumed');
    
    if (this.isHost) {
      await this.announceGameEvent('Game resumed! Let\'s continue!');
      this.startCaller();
    }
    
    this.updateUI();
  }
  
  async endGame() {
    this.stopCaller();
    this.gameStatus = 'finished';
    
    // Find winner (highest score)
    let highestScore = -1;
    let winnerUid = null;
    
    this.players.forEach((player, uid) => {
      if (player.score > highestScore) {
        highestScore = player.score;
        winnerUid = uid;
      }
    });
    
    if (winnerUid) {
      const winnerPlayer = this.players.get(winnerUid);
      this.winner = winnerPlayer.name;
      winnerPlayer.hasWon = true;
    }
    
    // Announce winner with agent FIRST
    if (this.isHost && this.winner) {
      await this.triggerWinnerCommentary();
    }
    
    // Then broadcast to all players
    this.broadcastGameState('game-ended', {
      winner: this.winner,
      finalScores: Array.from(this.players.entries()).map(([uid, p]) => ({
        name: p.name,
        score: p.score
      }))
    });
    
    this.updateUI();
  }
  
  async startCaller() {
    console.log('Starting bingo caller...');
    
    // Shuffle available numbers
    const availableNumbers = this.allPossibleNumbers
      .filter(num => !this.calledNumbers.includes(num));
    
    // Use recursive setTimeout to ensure announcements complete before next call
    const callNextNumber = async () => {
      if (this.gameStatus !== 'playing' || availableNumbers.length === 0) {
        this.stopCaller();
        return;
      }
      
      // Pick random number FIRST
      const randomIndex = Math.floor(Math.random() * availableNumbers.length);
      const number = availableNumbers.splice(randomIndex, 1)[0];
      
      console.log('Calling number:', number);
      
      // Broadcast immediately so other players see it
      await this.broadcastGameState('number-called', { number });
      
      // Add to our list and update UI
      this.calledNumbers.push(number);
      this.updateUI();
      
      // THEN announce with ConvoAI (includes agent join, speak, leave)
      await this.announceNumber(number);
      
      // Schedule next number after 3 seconds delay
      this.callerInterval = setTimeout(callNextNumber, 3000);
    };
    
    // Start calling numbers
    callNextNumber();
  }
  
  stopCaller() {
    if (this.callerInterval) {
      clearTimeout(this.callerInterval);
      this.callerInterval = null;
      console.log('Stopped bingo caller');
    }
  }
  
  isNumberCalled(number) {
    // Check if a number has been called by the caller
    return this.calledNumbers.includes(number);
  }
  
  async markCell(cellIndex) {
    const cell = this.board[cellIndex];
    
    // Can't mark free space
    if (cell.isFreeSpace) {
      return { success: false, message: 'Free space is already marked!' };
    }
    
    // Can't mark if already marked
    if (this.markedCells.has(cellIndex)) {
      return { success: false, message: 'Already marked!' };
    }
    
    // Can only mark if the number has been called
    if (!this.isNumberCalled(cell.number)) {
      return { success: false, message: 'This number has not been called yet!' };
    }
    
    // Mark the cell
    this.markedCells.add(cellIndex);
    this.score += 1;
    
    // Update our player entry in the players map
    if (this.players.has(this.playerUid)) {
      this.players.get(this.playerUid).score = this.score;
    }
    
    // Broadcast our score
    await this.broadcastGameState('player-score', {
      score: this.score
    });
    
    this.updateUI();
    
    return { success: true };
  }
  
  async callBingo() {
    // Player is claiming BINGO!
    const hasBingo = this.checkBingo();
    
    if (hasBingo) {
      // Correct BINGO!
      await this.handleBingo();
      return { success: true, message: 'BINGO! You won!' };
    } else {
      // False BINGO claim
      const penalty = 5;
      this.score = Math.max(0, this.score - penalty);
      
      // Update our player entry
      if (this.players.has(this.playerUid)) {
        this.players.get(this.playerUid).score = this.score;
      }
      
      await this.broadcastGameState('false-bingo', {
        score: this.score,
        penalty: penalty
      });
      
      // Announce the false bingo with agent
      if (this.isHost) {
        await this.announceFalseBingo(this.playerName);
      }
      
      this.updateUI();
      
      return { success: false, message: `False BINGO! -${penalty} points` };
    }
  }
  
  async handleBingo() {
    console.log('BINGO! You won!');
    this.gameStatus = 'finished';
    this.winner = this.playerName;
    
    if (this.players.has(this.playerUid)) {
      this.players.get(this.playerUid).hasWon = true;
      this.players.get(this.playerUid).score += 10; // Bonus
      this.score += 10;
    }
    
    // Stop caller if we're host
    if (this.isHost) {
      this.stopCaller();
    }
    
    // Broadcast win
    await this.broadcastGameState('game-won');
    
    this.updateUI();
  }
  
  checkBingo() {
    const size = window.config.boardSize;
    
    // Check rows
    for (let row = 0; row < size; row++) {
      let hasRow = true;
      for (let col = 0; col < size; col++) {
        const index = row * size + col;
        if (!this.markedCells.has(index) && !this.board[index].isFreeSpace) {
          hasRow = false;
          break;
        }
      }
      if (hasRow) return true;
    }
    
    // Check columns
    for (let col = 0; col < size; col++) {
      let hasCol = true;
      for (let row = 0; row < size; row++) {
        const index = row * size + col;
        if (!this.markedCells.has(index) && !this.board[index].isFreeSpace) {
          hasCol = false;
          break;
        }
      }
      if (hasCol) return true;
    }
    
    // Check diagonals
    let hasDiag1 = true;
    let hasDiag2 = true;
    for (let i = 0; i < size; i++) {
      const index1 = i * size + i;
      const index2 = i * size + (size - 1 - i);
      
      if (!this.markedCells.has(index1) && !this.board[index1].isFreeSpace) {
        hasDiag1 = false;
      }
      if (!this.markedCells.has(index2) && !this.board[index2].isFreeSpace) {
        hasDiag2 = false;
      }
    }
    
    return hasDiag1 || hasDiag2;
  }
  
  async announceNumber(number) {
    if (!this.convoAIManager || !this.isHost) return;
    
    const column = this.getColumnLetter(number);
    const callText = `${column} ${number}`;
    
    // Get current player scores
    const playerScores = Array.from(this.players.entries())
      .map(([uid, player]) => ({
        name: player.name,
        score: player.score,
        isLeading: false
      }))
      .sort((a, b) => b.score - a.score);
    
    if (playerScores.length > 0) {
      playerScores[0].isLeading = true;
    }
    
    // Build player stats message - make it more exciting
    const playerStats = playerScores.map(p => `${p.name} has ${p.score} hit${p.score !== 1 ? 's' : ''}`).join(' and ');
    
    const announcement = `${callText}! ${playerStats}!`;
    
    try {
      await this.convoAIManager.announceNumber(this.channelName, announcement);
    } catch (error) {
      console.error('Failed to announce number:', error);
    }
  }
  
  async announceGameEvent(message) {
    if (!this.convoAIManager || !this.isHost) return;
    
    try {
      await this.convoAIManager.announceNumber(this.channelName, message);
    } catch (error) {
      console.error('Failed to announce game event:', error);
    }
  }
  
  async announceFalseBingo(playerName) {
    if (!this.convoAIManager || !this.isHost) return;
    
    const announcement = `Oops! ${playerName} called BINGO but they didn't have it! That's a penalty!`;
    
    try {
      await this.convoAIManager.announceNumber(this.channelName, announcement);
    } catch (error) {
      console.error('Failed to announce false bingo:', error);
    }
  }
  
  async triggerWinnerCommentary() {
    if (!this.convoAIManager || !this.isHost) return;
    
    const playerScores = Array.from(this.players.entries())
      .map(([uid, player]) => `${player.name} with ${player.score} hit${player.score !== 1 ? 's' : ''}`)
      .join(' and ');
    
    const announcement = `Game over! ${this.winner} wins with BINGO! Final scores: ${playerScores}! Congratulations!`;
    
    try {
      await this.convoAIManager.announceNumber(this.channelName, announcement);
    } catch (error) {
      console.error('Failed to trigger winner commentary:', error);
    }
  }
  
  getColumnLetter(number) {
    if (number >= 1 && number <= 15) return 'B';
    if (number >= 16 && number <= 30) return 'I';
    if (number >= 31 && number <= 45) return 'N';
    if (number >= 46 && number <= 60) return 'G';
    if (number >= 61 && number <= 75) return 'O';
    return '';
  }
  
  async broadcastGameState(type, extraData = {}) {
    const message = {
      type,
      uid: this.playerUid,
      playerName: this.playerName,
      gameId: this.gameId,
      timestamp: Date.now(),
      ...extraData
    };
    
    try {
      await this.agoraClient.sendMessage(message);
    } catch (error) {
      console.error('Failed to broadcast:', error);
    }
  }
  
  updateUI() {
    if (this.onGameStateChanged) {
      this.onGameStateChanged(this);
    }
  }
  
  generateGameId() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }
  
  async leaveGame() {
    this.stopCaller();
    
    if (this.convoAIManager) {
      this.convoAIManager.cleanup();
    }
    
    if (this.agoraClient) {
      await this.agoraClient.leave();
    }
    
    // Clear state
    this.players.clear();
    this.markedCells.clear();
    this.calledNumbers = [];
  }
}

window.BingoGame = BingoGame;
