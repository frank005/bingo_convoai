# Documentation

Complete documentation for the Bingo ConvoAI Game.

## 📖 Getting Started

Start here if you're new to the project:

1. **[QUICK_START.md](QUICK_START.md)** - Get up and running in 5 minutes
2. **[ENV_SETUP.md](ENV_SETUP.md)** - Configure your environment variables
3. **[LOCAL_DEVELOPMENT.md](LOCAL_DEVELOPMENT.md)** - Set up your local dev environment

## 🔧 Setup & Configuration

- **[ENV_SETUP.md](ENV_SETUP.md)** - Complete guide to environment variables
  - Agora credentials (App ID, Certificate, Customer ID/Secret)
  - ConvoAI configuration (LLM, TTS, ASR)
  - Token settings and game configuration
  
- **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** - Quick reference for common tasks
  - Starting dev server
  - Running on different ports
  - Building for production
  
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Deploy to Netlify
  - Initial setup
  - Environment variables in Netlify
  - Continuous deployment

## 🏗️ Architecture & Systems

- **[ARCHITECTURE.md](ARCHITECTURE.md)** - System architecture overview
  - Frontend/backend structure
  - Agora SDK integration
  - Token generation flow
  
- **[FEATURES.md](FEATURES.md)** - Complete feature list
  - All implemented features
  - Technology stack
  
- **[PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)** - High-level project overview

## 🎮 Game Systems

- **[GAME_DISCOVERY.md](GAME_DISCOVERY.md)** - How players find and join games
  - Active game listing
  - Channel Management API integration
  - Join/create flow
  
- **[CHANNEL_SYSTEM.md](CHANNEL_SYSTEM.md)** - Channel naming and management
  - Channel naming conventions (`bingo_XXXXXX`)
  - RTC and RTM channel coordination
  
- **[INTERACTIVE_GAMEPLAY.md](INTERACTIVE_GAMEPLAY.md)** - Interactive game features
  - Manual number marking
  - "BINGO!" announcement button
  - Visual feedback (glow/dim)
  
- **[BINGO_CALLER_UPDATE.md](BINGO_CALLER_UPDATE.md)** - Automated caller system
  - 10-second interval number calling
  - Multi-player support (up to 10 players)
  - Turn management

## 🤖 ConvoAI Integration

- **[CONVOAI_INTEGRATION.md](CONVOAI_INTEGRATION.md)** - ConvoAI overview
  - Agent lifecycle (join → speak → leave)
  - Number announcements
  - Winner announcements
  
- **[CONVOAI_VENDORS.md](CONVOAI_VENDORS.md)** - Vendor configuration
  - LLM options (OpenAI, Azure, Anthropic, Gemini, etc.)
  - TTS options (Microsoft, ElevenLabs, Google, etc.)
  - ASR options (Microsoft, Deepgram, Google, ARES)
  - API key configuration
  
- **[CONVOAI_ANNOUNCEMENTS.md](CONVOAI_ANNOUNCEMENTS.md)** - How announcements work
  - Message flow
  - RTM message format
  - Agent state monitoring

## 🔧 Troubleshooting

- **[API_KEY_FIX.md](API_KEY_FIX.md)** - **START HERE if ConvoAI isn't working!**
  - API key validation
  - Pre-send verification
  - Common errors and solutions
  - How to verify keys are loaded
  
- **[TOKEN_GENERATION.md](TOKEN_GENERATION.md)** - **Current token implementation**
  - Separate RTC and RTM tokens
  - Why we use this approach
  - User vs agent token validity
  - Library capabilities and limitations
  
- **[AGENT_TOKEN_FIX.md](AGENT_TOKEN_FIX.md)** - Agent token details
  - Why agents need tokens
  - Automatic token generation (24-hour validity)
  - Token comparison (users vs agents)
  - Troubleshooting token issues
  
- **[AGENT_RTM_FIX.md](AGENT_RTM_FIX.md)** - **Agent message delivery (Error -11033)**
  - RTM configuration for peer-to-peer messages
  - Timing and retry logic
  - Message format requirements
  - How messages reach the agent
  
- **[ENV_LOADING_FIX.md](ENV_LOADING_FIX.md)** - Environment variable loading issues
  - Why .env files weren't loading
  - Node.js wrapper solution
  - How to properly start dev server
  - Verification that keys are loaded
  
- **[CONVOAI_FIX.md](CONVOAI_FIX.md)** - ConvoAI configuration fixes
  - Required environment variables
  - Configuration structure
  - Debugging tips

## 📝 Updates & Changes

- **[LATEST_FIXES.md](LATEST_FIXES.md)** - **Most recent updates (READ THIS FIRST!)**
  - API key injection fix
  - Player presence system
  - Configuration mapping
  - Testing checklist
  
- **[WHATS_FIXED.md](WHATS_FIXED.md)** - Historical change log
  - Previous fixes and improvements
  - Evolution of the project

## 🚨 Common Issues

### ConvoAI Agent Fails
→ See **[API_KEY_FIX.md](API_KEY_FIX.md)** for detailed troubleshooting

### Players Can't See Each Other
→ Check **[LATEST_FIXES.md](LATEST_FIXES.md)** - Presence system section

### Environment Variables Not Loading
→ See **[ENV_SETUP.md](ENV_SETUP.md)** - Use `./start-dev.sh` not `netlify dev`

### Game Discovery Not Working
→ See **[GAME_DISCOVERY.md](GAME_DISCOVERY.md)** - Channel Management API setup

## 📚 Recommended Reading Order

### For First-Time Setup:
1. [QUICK_START.md](QUICK_START.md)
2. [ENV_SETUP.md](ENV_SETUP.md)
3. [API_KEY_FIX.md](API_KEY_FIX.md) ← Important for ConvoAI!
4. [LOCAL_DEVELOPMENT.md](LOCAL_DEVELOPMENT.md)

### For Understanding the System:
1. [ARCHITECTURE.md](ARCHITECTURE.md)
2. [GAME_DISCOVERY.md](GAME_DISCOVERY.md)
3. [CONVOAI_INTEGRATION.md](CONVOAI_INTEGRATION.md)
4. [INTERACTIVE_GAMEPLAY.md](INTERACTIVE_GAMEPLAY.md)

### For Troubleshooting:
1. [LATEST_FIXES.md](LATEST_FIXES.md) ← Check this first!
2. [API_KEY_FIX.md](API_KEY_FIX.md) ← For ConvoAI issues
3. [ENV_SETUP.md](ENV_SETUP.md) ← For configuration issues
4. [CONVOAI_FIX.md](CONVOAI_FIX.md) ← For specific ConvoAI problems

## 🔗 Quick Links

- **Main README**: [../README.md](../README.md)
- **Environment Template**: [../env.example](../env.example)
- **Start Script**: [../start-dev.sh](../start-dev.sh)

## 📦 Documentation Structure

```
docs/
├── README.md (you are here)
│
├── Setup & Configuration
│   ├── ENV_SETUP.md
│   ├── QUICK_START.md
│   ├── QUICK_REFERENCE.md
│   ├── LOCAL_DEVELOPMENT.md
│   └── DEPLOYMENT.md
│
├── Architecture
│   ├── ARCHITECTURE.md
│   ├── FEATURES.md
│   └── PROJECT_SUMMARY.md
│
├── Game Systems
│   ├── GAME_DISCOVERY.md
│   ├── CHANNEL_SYSTEM.md
│   ├── INTERACTIVE_GAMEPLAY.md
│   └── BINGO_CALLER_UPDATE.md
│
├── ConvoAI
│   ├── CONVOAI_INTEGRATION.md
│   ├── CONVOAI_VENDORS.md
│   ├── CONVOAI_ANNOUNCEMENTS.md
│   └── CONVOAI_FIX.md
│
├── Troubleshooting
│   └── API_KEY_FIX.md
│
└── Updates
    ├── LATEST_FIXES.md
    └── WHATS_FIXED.md
```

---

**Need help?** Start with [LATEST_FIXES.md](LATEST_FIXES.md) to see the most recent updates and [API_KEY_FIX.md](API_KEY_FIX.md) if you're having ConvoAI issues!

