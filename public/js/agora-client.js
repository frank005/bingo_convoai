// Agora RTC and RTM Client Module
class AgoraClient {
  constructor() {
    this.rtcClient = null;
    this.rtmClient = null;
    this.rtcToken = null;
    this.rtmToken = null;
    this.channelName = null;
    this.uid = null;
    this.tokenExpiresAt = null;
    this.tokenRenewalTimer = null;
    
    this.localAudioTrack = null;
    this.remoteUsers = new Map();
    
    // Event handlers
    this.onMessageReceived = null;
    this.onPresenceChanged = null;
    this.onUserJoined = null;
    this.onUserLeft = null;
  }
  
  async initialize(channelName, uid) {
    this.channelName = channelName;
    this.uid = uid;
    
    // Initialize RTC client
    this.rtcClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
    
    // Initialize RTM client with userId (required in v2.x)
    const RTMClass = typeof AgoraRTM !== 'undefined' ? AgoraRTM.RTM : (typeof RTM !== 'undefined' ? RTM : null);
    if (!RTMClass) {
      throw new Error('RTM SDK not loaded. Make sure agora-rtm.js is included.');
    }
    
    // RTM config based on reference implementation
    const rtmConfig = {
      presenceTimeout: 30, // in seconds
      logUpload: false,
      logLevel: "debug",
      cloudProxy: false,
      useStringUserId: true,
    };
    
    // Create RTM client with appId, userId (as string), and config
    this.rtmClient = new RTMClass(window.config.appId, uid.toString(), rtmConfig);
    
    // Set up event listeners
    this.setupRTCEventListeners();
    this.setupRTMEventListeners();
    
    console.log('Agora clients initialized');
  }
  
  setupRTCEventListeners() {
    this.rtcClient.on('user-published', async (user, mediaType) => {
      await this.rtcClient.subscribe(user, mediaType);
      console.log('Subscribed to user:', user.uid, mediaType);
      
      if (mediaType === 'audio') {
        const remoteAudioTrack = user.audioTrack;
        remoteAudioTrack.play();
        this.remoteUsers.set(user.uid, user);
        
        if (this.onUserJoined) {
          this.onUserJoined(user.uid);
        }
      }
    });
    
    this.rtcClient.on('user-unpublished', (user, mediaType) => {
      console.log('User unpublished:', user.uid, mediaType);
    });
    
    this.rtcClient.on('user-left', (user) => {
      console.log('User left:', user.uid);
      this.remoteUsers.delete(user.uid);
      
      if (this.onUserLeft) {
        this.onUserLeft(user.uid);
      }
    });
    
    this.rtcClient.on('token-privilege-will-expire', async () => {
      console.log('Token privilege will expire, renewing...');
      await this.renewTokens();
    });
  }
  
  setupRTMEventListeners() {
    this.rtmClient.addEventListener('message', (event) => {
      console.log('RTM Message received:', event);
      if (this.onMessageReceived) {
        this.onMessageReceived(event);
      }
    });
    
    this.rtmClient.addEventListener('presence', (event) => {
      console.log('RTM Presence event:', event);
      if (this.onPresenceChanged) {
        this.onPresenceChanged(event);
      }
    });
    
    this.rtmClient.addEventListener('status', (event) => {
      console.log('RTM Status:', event);
    });
  }
  
  async generateTokens() {
    try {
      const response = await fetch(window.config.tokenEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelName: this.channelName,
          uid: this.uid,
          role: 'publisher'
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate tokens');
      }
      
      const data = await response.json();
      this.rtcToken = data.rtcToken;
      this.rtmToken = data.rtmToken;
      this.tokenExpiresAt = data.expiresAt;
      
      console.log('Tokens generated, expires at:', new Date(this.tokenExpiresAt * 1000));
      
      // Schedule token renewal
      this.scheduleTokenRenewal();
      
      return data;
    } catch (error) {
      console.error('Token generation failed:', error);
      throw error;
    }
  }
  
  scheduleTokenRenewal() {
    if (this.tokenRenewalTimer) {
      clearTimeout(this.tokenRenewalTimer);
    }
    
    const now = Math.floor(Date.now() / 1000);
    const timeUntilRenewal = (this.tokenExpiresAt - now - window.config.renewalThresholdSeconds) * 1000;
    
    if (timeUntilRenewal > 0) {
      console.log(`Scheduling token renewal in ${Math.floor(timeUntilRenewal / 1000)} seconds`);
      this.tokenRenewalTimer = setTimeout(() => {
        this.renewTokens();
      }, timeUntilRenewal);
    }
  }
  
  async renewTokens() {
    console.log('Renewing tokens...');
    try {
      await this.generateTokens();
      
      // Renew RTC token
      await this.rtcClient.renewToken(this.rtcToken);
      console.log('RTC token renewed');
      
      // Note: RTM token renewal is automatic in SDK v2.x
      console.log('Tokens renewed successfully');
    } catch (error) {
      console.error('Token renewal failed:', error);
    }
  }
  
  async join() {
    try {
      // Generate tokens
      await this.generateTokens();
      
      // Join RTC channel
      await this.rtcClient.join(
        window.config.appId,
        this.channelName,
        this.rtcToken,
        this.uid
      );
      console.log('Joined RTC channel:', this.channelName);
      
      // Create and publish audio track
      this.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
      await this.rtcClient.publish([this.localAudioTrack]);
      console.log('Published audio track');
      
      // Login to RTM
      await this.rtmClient.login({
        token: this.rtmToken,
        uid: this.uid.toString()
      });
      console.log('Logged in to RTM');
      
      // Subscribe to RTM channel
      await this.rtmClient.subscribe(this.channelName, {
        withMessage: true,
        withPresence: true,
        withMetadata: false,
        withLock: false
      });
      console.log('Subscribed to RTM channel:', this.channelName);
      
      return true;
    } catch (error) {
      console.error('Failed to join:', error);
      throw error;
    }
  }
  
  async sendMessage(message, customType = 'game-state') {
    try {
      const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
      
      // For channel messages, don't specify channelType (only use for USER messages)
      // Based on rtc-signaling reference implementation
      await this.rtmClient.publish(this.channelName, messageStr);
      
      console.log('Message sent:', message);
      return true;
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }
  
  async leave() {
    try {
      // Stop token renewal
      if (this.tokenRenewalTimer) {
        clearTimeout(this.tokenRenewalTimer);
        this.tokenRenewalTimer = null;
      }
      
      // Leave RTM
      if (this.rtmClient) {
        await this.rtmClient.unsubscribe(this.channelName);
        await this.rtmClient.logout();
        console.log('Left RTM channel');
      }
      
      // Leave RTC
      if (this.localAudioTrack) {
        this.localAudioTrack.stop();
        this.localAudioTrack.close();
      }
      
      if (this.rtcClient) {
        await this.rtcClient.leave();
        console.log('Left RTC channel');
      }
      
      this.remoteUsers.clear();
      return true;
    } catch (error) {
      console.error('Failed to leave:', error);
      throw error;
    }
  }
  
  async toggleMicrophone(enabled) {
    if (this.localAudioTrack) {
      await this.localAudioTrack.setEnabled(enabled);
      console.log('Microphone:', enabled ? 'enabled' : 'disabled');
    }
  }
}

window.AgoraClient = AgoraClient;

