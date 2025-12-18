// ConvoAI Manager for Game Commentary
class ConvoAIManager {
  constructor() {
    this.currentAgentId = null;
    this.agentRtcUid = null;
    this.isAgentActive = false;
  }
  
  async announceNumber(channelName, announcement) {
    // Simple method to announce a number - join, speak, leave
    if (this.isAgentActive) {
      console.log('Agent already active, skipping announcement');
      return;
    }
    
    try {
      console.log('Starting ConvoAI agent to announce:', announcement);
      
      // Generate unique agent UID
      this.agentRtcUid = Math.floor(Math.random() * 100000) + 900000;
      
      // Minimal config - backend will build complete config from environment variables
      const agentConfig = {
        name: `bingo_caller_${Date.now()}`,
        properties: {
          channel: channelName,
          agent_rtc_uid: this.agentRtcUid.toString(),
          agent_rtm_uid: this.agentRtcUid.toString(),
          remote_rtc_uids: ['*'],
          enable_string_uid: false
        }
      };
      
      // Start agent via backend
      const response = await fetch(window.config.convoAIEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start',
          channelName: channelName,
          agentConfig: agentConfig
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start agent');
      }
      
      const data = await response.json();
      this.currentAgentId = data.agent_id || data.agentId;
      this.isAgentActive = true;
      
      console.log('ConvoAI agent started:', this.currentAgentId);
      
      // Wait 3 seconds for agent to fully join and be ready for RTM messages
      console.log('Waiting 3 seconds for agent to come online...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Send announcement message to agent
      console.log('Agent should be online now, sending message...');
      await this.sendAnnouncementMessage(announcement);
      
      // Monitor agent state and stop after it finishes speaking
      console.log('Monitoring agent state to detect when it finishes speaking...');
      await this.monitorAgentUntilFinished();
      
    } catch (error) {
      console.error('Failed to announce with ConvoAI:', error);
      this.isAgentActive = false;
    }
  }
  
  async startAgent(channelName, gameState) {
    try {
      console.log('Starting ConvoAI agent for commentary...');
      
      // Generate unique agent UID
      this.agentRtcUid = Math.floor(Math.random() * 100000) + 900000;
      
      // Create commentary message from game state
      const commentary = this.generateCommentary(gameState);
      
      // Configure agent
      const agentConfig = {
        channel: channelName,
        uid: this.agentRtcUid.toString(),
        properties: {
          greeting_message: '',
          system_instruction: 'You are an energetic game show host. Provide exciting commentary about the game. Keep it brief and engaging. Never use emojis.',
          enable_rtm: true,
          agent_rtm_uid: this.agentRtcUid.toString(),
          tts: {
            vendor: 'microsoft',
            voice_name: 'en-US-JennyNeural',
            rate: 1.0,
            pitch: 1.0,
            volume: 100
          },
          asr: {
            vendor: 'microsoft',
            language: 'en-US'
          },
          turn_detection: {
            silence_duration_ms: 800,
            vendor: 'microsoft'
          }
        }
      };
      
      // Start agent via backend
      const response = await fetch(window.config.convoAIEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start',
          channelName: channelName,
          agentConfig: agentConfig
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start agent');
      }
      
      const data = await response.json();
      this.currentAgentId = data.agent_id || data.agentId;
      this.isAgentActive = true;
      
      console.log('ConvoAI agent started:', this.currentAgentId);
      
      // Wait a moment for agent to fully join
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Send commentary message to agent
      await this.sendCommentaryMessage(commentary);
      
      // Auto-stop after speaking
      setTimeout(async () => {
        if (this.isAgentActive) {
          await this.stopAgent();
        }
      }, 7000);
      
      return this.currentAgentId;
    } catch (error) {
      console.error('Failed to start ConvoAI agent:', error);
      this.isAgentActive = false;
      throw error;
    }
  }
  
  generateCommentary(gameState) {
    const { player1, player2, lastAction, scores } = gameState;
    
    let commentary = `Here is the game update. `;
    
    if (lastAction) {
      commentary += `${lastAction.playerName} just marked number ${lastAction.number}. `;
    }
    
    commentary += `${player1} has ${scores.player1} points and ${player2} has ${scores.player2} points. `;
    
    // Add excitement based on score difference
    const diff = Math.abs(scores.player1 - scores.player2);
    if (diff === 0) {
      commentary += `It's a tie game, this is intense!`;
    } else if (diff > 3) {
      const leader = scores.player1 > scores.player2 ? player1 : player2;
      commentary += `${leader} is dominating the game!`;
    } else {
      commentary += `This is a close match!`;
    }
    
    return commentary;
  }
  
  async sendAnnouncementMessage(announcement, retries = 5) {
    try {
      // Get the RTM client and channel from the game's Agora client
      const rtmClient = window.game?.agoraClient?.rtmClient;
      const rtmChannel = window.game?.agoraClient?.rtmChannel;
      
      if (!rtmClient || !this.agentRtcUid) {
        console.error('RTM client or agent UID not available');
        return;
      }
      
      const messagePayload = {
        messageType: 'TEXT',
        message: announcement,
        uuid: Date.now().toString()
      };
      
      console.log('Sending announcement to agent via peer-to-peer:', messagePayload);
      
      // Send message to agent via RTM with retry logic
      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          await rtmClient.publish(
            this.agentRtcUid.toString(),
            JSON.stringify(messagePayload),
            {
              channelType: 'USER',
              customType: 'user.transcription'
            }
          );
          
          console.log('✅ Announcement message sent to agent successfully');
          return; // Success!
          
        } catch (error) {
          if (error.code === -11033 && attempt < retries) {
            // Agent not online yet, wait and retry with exponential backoff
            const waitTime = attempt * 1000; // 1s, 2s, 3s, 4s, 5s
            console.log(`⏳ Agent not ready yet (attempt ${attempt}/${retries}), waiting ${waitTime/1000}s...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          } else if (attempt === retries) {
            console.error(`❌ Agent did not come online after ${retries} attempts`);
            throw error;
          } else {
            throw error; // Re-throw for different error
          }
        }
      }
      
    } catch (error) {
      console.error('Failed to send announcement message after all retries:', error);
    }
  }
  
  async sendCommentaryMessage(commentary, retries = 5) {
    try {
      // Get the RTM client from the game's Agora client
      const rtmClient = window.game?.agoraClient?.rtmClient;
      
      if (!rtmClient || !this.agentRtcUid) {
        console.error('RTM client or agent UID not available');
        return;
      }
      
      const messagePayload = {
        messageType: 'TEXT',
        message: `Here is a script, please take this script and repeat it but spruce it up in a more exciting way. Please make sure to keep the correct names and points that I describe. Don't use Emojis! "${commentary}"`,
        uuid: Date.now().toString()
      };
      
      console.log('Sending commentary to agent via peer-to-peer:', messagePayload);
      
      // Send message to agent via RTM with retry logic
      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          await rtmClient.publish(
            this.agentRtcUid.toString(),
            JSON.stringify(messagePayload),
            {
              channelType: 'USER',
              customType: 'user.transcription'
            }
          );
          
          console.log('✅ Commentary message sent to agent successfully');
          return; // Success!
          
        } catch (error) {
          if (error.code === -11033 && attempt < retries) {
            // Agent not online yet, wait and retry with exponential backoff
            const waitTime = attempt * 1000; // 1s, 2s, 3s, 4s, 5s
            console.log(`⏳ Agent not ready yet (attempt ${attempt}/${retries}), waiting ${waitTime/1000}s...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          } else if (attempt === retries) {
            console.error(`❌ Agent did not come online after ${retries} attempts`);
            throw error;
          } else {
            throw error; // Re-throw for different error
          }
        }
      }
      
    } catch (error) {
      console.error('Failed to send commentary message after all retries:', error);
    }
  }
  
  async monitorAgentUntilFinished() {
    if (!this.currentAgentId || !this.isAgentActive) {
      console.log('No active agent to monitor');
      return;
    }

    try {
      console.log('Starting agent state monitoring...');
      
      // Poll agent state every 500ms for faster detection
      const checkInterval = 500;
      const maxChecks = 20; // Max 10 seconds of monitoring
      let checks = 0;
      let lastState = null;
      let hasSpokeOnce = false;
      
      const checkAgentState = async () => {
        try {
          const response = await fetch(window.config.convoAIEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'query',
              agentId: this.currentAgentId
            })
          });
          
          if (!response.ok) {
            throw new Error('Failed to query agent');
          }
          
          const data = await response.json();
          const state = data.state || data.status;
          
          console.log(`Agent state: ${state} (check ${checks + 1}/${maxChecks})`);
          
          // Track if agent has spoken
          if (state === 'speaking') {
            hasSpokeOnce = true;
          }
          
          // Check if agent finished speaking (transitioned away from speaking after having spoken)
          if (hasSpokeOnce && state !== 'speaking' && state !== 'thinking') {
            console.log('✅ Agent finished speaking, stopping agent...');
            await this.stopAgent();
            return true; // Done
          }
          
          lastState = state;
          return false; // Not done yet
          
        } catch (error) {
          console.error('Error checking agent state:', error);
          return false;
        }
      };
      
      // Monitor loop
      while (checks < maxChecks && this.isAgentActive) {
        const isDone = await checkAgentState();
        if (isDone) {
          return;
        }
        
        checks++;
        await new Promise(resolve => setTimeout(resolve, checkInterval));
      }
      
      // Timeout - force stop
      if (this.isAgentActive) {
        console.log('⏰ Agent monitoring timeout, forcing stop...');
        await this.stopAgent();
      }
      
    } catch (error) {
      console.error('Error monitoring agent:', error);
      await this.stopAgent();
    }
  }

  async stopAgent() {
    if (!this.currentAgentId || !this.isAgentActive) {
      console.log('No active agent to stop');
      return;
    }
    
    try {
      console.log('Stopping ConvoAI agent:', this.currentAgentId);
      
      const response = await fetch(window.config.convoAIEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'stop',
          agentId: this.currentAgentId
        })
      });
      
      if (!response.ok) {
        console.error('Failed to stop agent via API');
      }
      
      this.isAgentActive = false;
      this.currentAgentId = null;
      this.agentRtcUid = null;
      
      console.log('ConvoAI agent stopped');
    } catch (error) {
      console.error('Failed to stop ConvoAI agent:', error);
      this.isAgentActive = false;
    }
  }
  
  cleanup() {
    // Stop agent if active
    if (this.isAgentActive) {
      this.stopAgent();
    }
  }
}

window.ConvoAIManager = ConvoAIManager;

