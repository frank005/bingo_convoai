// Configuration Module
class Config {
  constructor() {
    // These will be loaded from backend
    this.appId = null;
    this.boardSize = 5;
    this.tokenValiditySeconds = 3600;
    this.renewalThresholdSeconds = 300;
    this.isConfigured = false;
    this.configLoaded = false;
    
    // API endpoints (relative to current domain when deployed)
    this.configEndpoint = '/.netlify/functions/get-config';
    this.tokenEndpoint = '/.netlify/functions/generate-token';
    this.convoAIEndpoint = '/.netlify/functions/convoai-agent';
    
    // ConvoAI Configuration
    this.convoAISystemPrompt = `You are an energetic game show host for a bingo game. You will receive game state information including player names, their scores, and notable events. Provide exciting and entertaining commentary about the game progress. Keep your responses brief and engaging - around 2-3 sentences. Never use emojis. Focus on the competitive nature and celebrate good plays.`;
    
    this.convoAIGreeting = "Welcome to Bingo Battle! Let the games begin!";
    
    // Voice settings for ConvoAI
    this.voice = {
      vendor: 'microsoft',
      voiceName: 'en-US-AndrewMultilingualNeural',
      rate: 1.0,
      pitch: 1.0,
      volume: 100
    };
  }
  
  async loadFromBackend() {
    try {
      const response = await fetch(this.configEndpoint);
      const data = await response.json();
      
      if (data.configured && data.appId) {
        this.appId = data.appId;
        this.boardSize = data.boardSize || 5;
        this.isConfigured = true;
        this.configLoaded = true;
        console.log('✅ Configuration loaded from backend');
        return true;
      } else {
        console.error('❌ Backend not configured:', data.error);
        this.configLoaded = true;
        return false;
      }
    } catch (error) {
      console.error('❌ Failed to load config from backend:', error);
      this.configLoaded = true;
      return false;
    }
  }
  
  async waitForConfig() {
    if (this.configLoaded) {
      return this.isConfigured;
    }
    
    // Wait for config to load
    return new Promise((resolve) => {
      const check = setInterval(() => {
        if (this.configLoaded) {
          clearInterval(check);
          resolve(this.isConfigured);
        }
      }, 100);
    });
  }
}

// Export singleton instance
window.config = new Config();

// Auto-load configuration on page load
window.config.loadFromBackend();

