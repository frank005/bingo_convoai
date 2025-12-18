// Main Application Logic
class BingoApp {
  constructor() {
    this.currentView = 'setup';
    this.initializeEventListeners();
    this.checkConfiguration();
  }
  
  initializeEventListeners() {
    // Lobby view (now the main landing page)
    document.getElementById('createGameBtn')?.addEventListener('click', () => {
      this.createGame();
    });
    
    document.getElementById('refreshGamesBtn')?.addEventListener('click', () => {
      this.refreshGameList();
    });
    
    // Game view
    document.getElementById('leaveGameBtn')?.addEventListener('click', () => {
      this.leaveGame();
    });
    
    document.getElementById('toggleMicBtn')?.addEventListener('click', () => {
      this.toggleMicrophone();
    });
    
    // BINGO button
    document.getElementById('callBingoBtn')?.addEventListener('click', async () => {
      if (window.game) {
        const bingoBtn = document.getElementById('callBingoBtn');
        bingoBtn.disabled = true;
        bingoBtn.innerHTML = '<span class="spinner"></span> Checking...';
        
        const result = await window.game.callBingo();
        
        if (result.success) {
          this.showNotification(result.message, 'success');
        } else {
          this.showNotification(result.message, 'error');
          // Re-enable button after false claim
          setTimeout(() => {
            bingoBtn.disabled = false;
            bingoBtn.innerHTML = '🎉 BINGO! 🎉';
          }, 3000);
        }
      }
    });
    
    // Host Controls
    document.getElementById('startGameBtn')?.addEventListener('click', async () => {
      if (window.game && window.game.isHost) {
        await window.game.startGame();
        this.showNotification('Game started!', 'success');
      }
    });
    
    document.getElementById('pauseGameBtn')?.addEventListener('click', () => {
      if (window.game && window.game.isHost) {
        window.game.pauseGame();
        this.showNotification('Game paused', 'info');
      }
    });
    
    document.getElementById('resumeGameBtn')?.addEventListener('click', async () => {
      if (window.game && window.game.isHost) {
        await window.game.resumeGame();
        this.showNotification('Game resumed!', 'success');
      }
    });
    
    document.getElementById('endGameBtn')?.addEventListener('click', async () => {
      if (window.game && window.game.isHost) {
        if (confirm('Are you sure you want to end the game early?')) {
          await window.game.endGame();
          this.showNotification('Game ended', 'warning');
        }
      }
    });
  }
  
  async checkConfiguration() {
    // Wait for config to load from backend
    const configured = await window.config.waitForConfig();
    
    const statusEl = document.getElementById('configStatus');
    if (configured) {
      statusEl.innerHTML = '<span style="color: var(--success);">✓ Server Connected</span>';
      // Auto-show lobby
      this.showLobby();
    } else {
      statusEl.innerHTML = '<span style="color: --danger);">✗ Server Not Configured</span>';
      statusEl.innerHTML += '<p style="margin-top: 0.5rem; font-size: 0.875rem;">Please configure environment variables on the server.</p>';
    }
  }
  
  showView(viewName) {
    // Hide all views
    document.querySelectorAll('.view').forEach(view => {
      view.classList.add('hidden');
    });
    
    // Show selected view
    const targetView = document.getElementById(`${viewName}View`);
    if (targetView) {
      targetView.classList.remove('hidden');
      targetView.classList.add('fade-in');
    }
    
    this.currentView = viewName;
  }
  
  showSetup() {
    this.showView('setup');
  }
  
  showLobby() {
    // Lobby is now the main view, just load saved name if available
    const savedName = localStorage.getItem('playerName');
    if (savedName) {
      document.getElementById('playerNameInput').value = savedName;
    }
    
    this.showView('lobby');
    this.refreshGameList();
    
    // Auto-refresh games every 10 seconds
    if (!this.gameRefreshInterval) {
      this.gameRefreshInterval = setInterval(() => {
        if (this.currentView === 'lobby') {
          this.refreshGameList();
        }
      }, 10000);
    }
  }
  
  async createGame() {
    try {
      const playerName = document.getElementById('playerNameInput').value.trim();
      
      if (!playerName) {
        alert('Please enter your name first');
        document.getElementById('playerNameInput').focus();
        return;
      }
      
      // Save player name
      localStorage.setItem('playerName', playerName);
      
      document.getElementById('createGameBtn').disabled = true;
      document.getElementById('createGameBtn').innerHTML = '<span class="spinner"></span> Creating...';
      
      // Create game instance
      window.game = new BingoGame();
      window.game.onGameStateChanged = (state) => this.updateGameUI(state);
      
      const gameId = await window.game.createGame(playerName);
      
      document.getElementById('gameIdDisplay').textContent = gameId;
      document.getElementById('inviteLink').value = `${window.location.origin}?join=${gameId}`;
      
      this.showView('game');
      this.updateGameUI(window.game);
      
      this.showNotification('Game created! Share the Game ID with your opponent.', 'success');
    } catch (error) {
      console.error('Failed to create game:', error);
      alert('Failed to create game: ' + error.message);
      document.getElementById('createGameBtn').disabled = false;
      document.getElementById('createGameBtn').innerHTML = '🎮 Create New Game';
    }
  }
  
  async joinGame(gameId) {
    try {
      let playerName = document.getElementById('playerNameInput').value.trim();
      
      if (!playerName) {
        playerName = localStorage.getItem('playerName');
      }
      
      if (!playerName) {
        alert('Please enter your name first');
        document.getElementById('playerNameInput').focus();
        return;
      }
      
      // Save player name
      localStorage.setItem('playerName', playerName);
      
      // Create game instance
      window.game = new BingoGame();
      window.game.onGameStateChanged = (state) => this.updateGameUI(state);
      
      await window.game.joinGame(gameId, playerName);
      
      document.getElementById('gameIdDisplay').textContent = gameId;
      
      this.showView('game');
      this.updateGameUI(window.game);
      
      this.showNotification('Joined game successfully!', 'success');
    } catch (error) {
      console.error('Failed to join game:', error);
      alert('Failed to join game: ' + error.message);
    }
  }
  
  async refreshGameList() {
    const gameListEl = document.getElementById('gameList');
    const gameCountEl = document.getElementById('onlineGameCount');
    
    try {
      // Query active channels from Agora backend
      const response = await fetch('/.netlify/functions/list-channels');
      const data = await response.json();
      
      if (!data.success || !data.games) {
        throw new Error('Failed to fetch games');
      }
      
      const activeGames = data.games.filter(g => g.status === 'waiting');
      
      // Update count
      if (gameCountEl) {
        gameCountEl.textContent = activeGames.length;
      }
      
      if (activeGames.length === 0) {
        gameListEl.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 2rem;">No games available. Create one!</p>';
        return;
      }
      
      gameListEl.innerHTML = activeGames.map(game => {
        return `
          <div class="game-item" onclick="app.joinGame('${game.gameId}')">
            <div class="game-info">
              <div class="game-name">Game ${game.gameId}</div>
              <div class="game-details">${game.userCount} player${game.userCount !== 1 ? 's' : ''} • Waiting for opponent</div>
            </div>
            <div class="game-status status-${game.status}">
              <span style="font-size: 0.875rem;">Join →</span>
            </div>
          </div>
        `;
      }).join('');
    } catch (error) {
      console.error('Failed to refresh game list:', error);
      
      // Fallback to localStorage for local testing
      const games = JSON.parse(localStorage.getItem('availableGames') || '[]');
      const oneHourAgo = Date.now() - (60 * 60 * 1000);
      const activeGames = games.filter(g => g.createdAt > oneHourAgo && g.status === 'waiting');
      
      if (gameCountEl) {
        gameCountEl.textContent = activeGames.length;
      }
      
      if (activeGames.length === 0) {
        gameListEl.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 2rem;">No games available. Create one!</p>';
        return;
      }
      
      gameListEl.innerHTML = activeGames.map(game => {
        const timeAgo = Math.floor((Date.now() - game.createdAt) / 1000 / 60);
        const timeText = timeAgo < 1 ? 'just now' : `${timeAgo}m ago`;
        
        return `
          <div class="game-item" onclick="app.joinGame('${game.gameId}')">
            <div class="game-info">
              <div class="game-name">Game ${game.gameId}</div>
              <div class="game-details">Created by ${game.creator} • ${timeText}</div>
            </div>
            <div class="game-status status-${game.status}">
              <span style="font-size: 0.875rem;">Join →</span>
            </div>
          </div>
        `;
      }).join('');
    }
  }
  
  updateGameUI(state) {
    if (!state) return;
    
    // Update players list
    const playersListEl = document.getElementById('playersList');
    const playerCountEl = document.getElementById('playerCount');
    
    if (playersListEl && state.players) {
      const playerArray = Array.from(state.players.entries());
      playerCountEl.textContent = playerArray.length;
      
      playersListEl.innerHTML = playerArray.map(([uid, player]) => {
        const isYou = uid === state.playerUid;
        const badge = player.hasWon ? '👑' : '';
        
        return `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: ${isYou ? 'var(--agora-purple)' : 'var(--bg-secondary)'}; border-radius: 8px;">
            <div>
              <span style="font-weight: 600; color: ${isYou ? 'white' : 'var(--text-primary)'};">
                ${player.name} ${isYou ? '(You)' : ''} ${badge}
              </span>
            </div>
            <div style="font-size: 1.25rem; font-weight: 700; color: ${isYou ? 'white' : 'var(--agora-cyan)'};">
              ${player.score}
            </div>
          </div>
        `;
      }).join('');
    }
    
    // Update caller display
    if (state.calledNumbers && state.calledNumbers.length > 0) {
      const lastNumber = state.calledNumbers[state.calledNumbers.length - 1];
      const lastCalledEl = document.getElementById('lastCalledNumber');
      if (lastCalledEl) {
        lastCalledEl.textContent = state.getColumnLetter ? 
          `${state.getColumnLetter(lastNumber)}-${lastNumber}` : 
          lastNumber;
      }
      
      const calledListEl = document.getElementById('calledNumbersList');
      if (calledListEl) {
        const recentNumbers = state.calledNumbers.slice(-10).reverse();
        const formattedNumbers = recentNumbers.map(num => {
          const letter = state.getColumnLetter ? state.getColumnLetter(num) : '';
          return letter ? `${letter}-${num}` : num;
        });
        calledListEl.textContent = `Called: ${formattedNumbers.join(', ')}${state.calledNumbers.length > 10 ? '...' : ''}`;
      }
    }
    
    // Update host badge and controls
    const hostBadge = document.getElementById('hostBadge');
    const hostControls = document.getElementById('hostControls');
    const startGameBtn = document.getElementById('startGameBtn');
    const pauseGameBtn = document.getElementById('pauseGameBtn');
    const resumeGameBtn = document.getElementById('resumeGameBtn');
    const endGameBtn = document.getElementById('endGameBtn');
    
    if (state.isHost) {
      if (hostBadge) hostBadge.style.display = 'inline-block';
      if (hostControls) hostControls.style.display = 'block';
      
      // Show/hide appropriate buttons based on game state
      if (state.gameStatus === 'ready') {
        if (startGameBtn) startGameBtn.style.display = 'inline-block';
        if (pauseGameBtn) pauseGameBtn.style.display = 'none';
        if (resumeGameBtn) resumeGameBtn.style.display = 'none';
        if (endGameBtn) endGameBtn.style.display = 'none';
      } else if (state.gameStatus === 'playing' && !state.isPaused) {
        if (startGameBtn) startGameBtn.style.display = 'none';
        if (pauseGameBtn) pauseGameBtn.style.display = 'inline-block';
        if (resumeGameBtn) resumeGameBtn.style.display = 'none';
        if (endGameBtn) endGameBtn.style.display = 'inline-block';
      } else if (state.isPaused) {
        if (startGameBtn) startGameBtn.style.display = 'none';
        if (pauseGameBtn) pauseGameBtn.style.display = 'none';
        if (resumeGameBtn) resumeGameBtn.style.display = 'inline-block';
        if (endGameBtn) endGameBtn.style.display = 'inline-block';
      } else {
        if (startGameBtn) startGameBtn.style.display = 'none';
        if (pauseGameBtn) pauseGameBtn.style.display = 'none';
        if (resumeGameBtn) resumeGameBtn.style.display = 'none';
        if (endGameBtn) endGameBtn.style.display = 'none';
      }
    }
    
    // Update status message
    const statusEl = document.getElementById('gameStatus');
    const bingoBtn = document.getElementById('callBingoBtn');
    const bingoHint = document.getElementById('bingoHint');
    
    if (state.gameStatus === 'waiting') {
      statusEl.innerHTML = `<div class="status-message status-warning">⏳ Waiting for players... (${state.players.size}/10)</div>`;
      if (bingoBtn) bingoBtn.style.display = 'none';
      if (bingoHint) bingoHint.style.display = 'none';
    } else if (state.gameStatus === 'ready') {
      statusEl.innerHTML = `<div class="status-message status-success">✅ Ready to start! (${state.players.size} players)${state.isHost ? ' Click "Start Game" when ready.' : ' Waiting for host to start...'}</div>`;
      if (bingoBtn) bingoBtn.style.display = 'none';
      if (bingoHint) bingoHint.style.display = 'none';
    } else if (state.gameStatus === 'playing' && !state.isPaused) {
      statusEl.innerHTML = `<div class="status-message status-info">🎲 Game in Progress! Click called numbers to mark them...</div>`;
      if (bingoBtn) {
        bingoBtn.style.display = 'inline-block';
        bingoBtn.disabled = false;
      }
      if (bingoHint) bingoHint.style.display = 'block';
    } else if (state.isPaused) {
      statusEl.innerHTML = `<div class="status-message status-warning">⏸️ Game Paused${state.isHost ? ' - Click "Resume" to continue' : ' - Waiting for host...'}</div>`;
      if (bingoBtn) bingoBtn.style.display = 'none';
      if (bingoHint) bingoHint.style.display = 'none';
    } else if (state.gameStatus === 'finished') {
      const isWinner = state.winner === state.playerName;
      statusEl.innerHTML = `<div class="status-message status-${isWinner ? 'success' : 'warning'}">${isWinner ? '🎉 You Won! BINGO!' : '🏆 ' + state.winner + ' Won!'}</div>`;
      if (bingoBtn) bingoBtn.style.display = 'none';
      if (bingoHint) bingoHint.style.display = 'none';
      
      // Show winner banner
      if (isWinner) {
        this.showWinnerBanner(state.playerName);
      }
    }
    
    // Update board
    this.renderBoard(state);
  }
  
  renderBoard(state) {
    const boardEl = document.getElementById('bingoBoard');
    if (!boardEl) return;
    
    boardEl.innerHTML = '';
    
    state.board.forEach((cell, index) => {
      const cellEl = document.createElement('div');
      cellEl.className = 'bingo-cell';
      cellEl.textContent = cell.number;
      
      if (cell.isFreeSpace) {
        cellEl.classList.add('free-space');
      } else if (state.markedCells.has(index)) {
        cellEl.classList.add('marked');
      } else if (state.gameStatus === 'playing') {
        // Check if this number has been called
        const isCalled = state.isNumberCalled && state.isNumberCalled(cell.number);
        
        if (isCalled) {
          // Number has been called - allow clicking and highlight it
          cellEl.classList.add('callable');
          cellEl.style.cursor = 'pointer';
          cellEl.addEventListener('click', async () => {
            const result = await window.game.markCell(index);
            if (!result.success) {
              this.showNotification(result.message, 'warning');
            }
          });
        } else {
          // Number not yet called - dim it
          cellEl.style.opacity = '0.4';
        }
      }
      
      boardEl.appendChild(cellEl);
    });
  }
  
  async handleCellClick(cellIndex) {
    if (window.game) {
      const success = await window.game.markCell(cellIndex);
      if (!success) {
        this.showNotification('Invalid move!', 'warning');
      }
    }
  }
  
  async leaveGame() {
    if (window.game) {
      await window.game.leaveGame();
      window.game = null;
    }
    
    this.showView('lobby');
    this.refreshGameList();
  }
  
  async toggleMicrophone() {
    if (!window.game?.agoraClient) return;
    
    const btn = document.getElementById('toggleMicBtn');
    const isEnabled = !btn.classList.contains('muted');
    
    await window.game.agoraClient.toggleMicrophone(!isEnabled);
    
    btn.classList.toggle('muted');
    btn.innerHTML = isEnabled ? '🔇 Unmute' : '🎤 Mute';
  }
  
  showWinnerBanner(winnerName) {
    const banner = document.createElement('div');
    banner.className = 'winner-banner';
    banner.innerHTML = `<h1 class="winner-text">🎉 ${winnerName} Wins! 🎉</h1>`;
    
    document.body.appendChild(banner);
    
    setTimeout(() => {
      banner.remove();
    }, 5000);
  }
  
  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `status-message status-${type}`;
    notification.style.position = 'fixed';
    notification.style.bottom = '2rem';
    notification.style.left = '50%';
    notification.style.transform = 'translateX(-50%)';
    notification.style.zIndex = '10000';
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }
  
  // Check for join parameter in URL
  checkURLParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const joinGameId = urlParams.get('join');
    
    if (joinGameId) {
      const playerName = localStorage.getItem('playerName');
      if (playerName) {
        this.joinGame(joinGameId);
      } else {
        // Store game ID and prompt for name
        localStorage.setItem('pendingJoinGameId', joinGameId);
        alert('Please enter your name to join the game');
      }
    }
  }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.app = new BingoApp();
  window.app.checkURLParameters();
  
  // Check for pending join after entering name
  const pendingJoinGameId = localStorage.getItem('pendingJoinGameId');
  if (pendingJoinGameId) {
    localStorage.removeItem('pendingJoinGameId');
    // Will be handled after clicking Start Game
  }
});

