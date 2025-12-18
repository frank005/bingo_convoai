# Bingo ConvoAI Game

An interactive two-player bingo game featuring Agora ConvoAI, RTC (Real-Time Communication), and RTM (Real-Time Messaging) integration. The game includes an AI game show host that provides exciting commentary after each turn!

## Features

- 🎮 **Two-Player Bingo**: Real-time multiplayer bingo game
- 🤖 **AI Commentary**: ConvoAI agent acts as a game show host
- 🎤 **Voice Chat**: Built-in RTC voice communication
- 💬 **Real-Time Messaging**: RTM for game state synchronization
- 🎯 **Game Lobby**: Search for games and create/join sessions
- 👥 **Player Invitations**: Invite friends to play
- 🏆 **Score Tracking**: Keep track of player points
- 🔐 **Secure Tokens**: Backend token generation with auto-renewal
- 🎨 **Modern UI**: Beautiful Agora-themed interface

## Setup

1. **Clone the repository**
   ```bash
   cd bingo_convoai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   - Copy `.env.example` to `.env`
   - Fill in your Agora credentials:
     - App ID and App Certificate
     - REST API Customer ID and Customer Secret (for ConvoAI)
   - Adjust game configuration as needed (board size, token validity, etc.)

4. **Run locally**
   ```bash
   # Recommended: Properly loads .env file
   npm run dev
   
   # Alternative: Use bash script
   ./start-dev.sh
   ```
   
   **Important:** You should see output confirming API keys are loaded:
   ```
   ✓ Environment variables loaded
   Checking key variables:
     LLM_API_KEY: SET (sk-proj-...)
     MICROSOFT_TTS_KEY: SET (abc123...)
     MICROSOFT_ASR_KEY: SET (xyz789...)
   ```
   
   If any keys show "NOT SET", check your `.env` file!

5. **Deploy to Netlify**
   ```bash
   netlify login
   netlify init
   npm run deploy
   ```

## How to Play

1. **Enter Your Name**: On the home page, enter your player name
2. **Create or Join a Game**:
   - Create a new game and share the game ID with a friend
   - Or search for available games and join one
3. **Play Bingo**: 
   - Take turns marking numbers on your bingo board
   - First to complete a line (horizontal, vertical, or diagonal) wins!
4. **Listen to Commentary**: After each turn, the AI host provides exciting commentary

## Game Configuration

The game can be configured via environment variables:

- `BINGO_BOARD_SIZE`: Size of the bingo board (default: 5 for 5x5)
- `BINGO_TOKEN_VALIDITY_SECONDS`: How long tokens are valid (default: 3600 = 1 hour)
- `BINGO_TOKEN_RENEWAL_THRESHOLD_SECONDS`: When to renew tokens (default: 300 = 5 minutes before expiry)

## Architecture

- **Frontend**: Vanilla JavaScript with modern UI
- **Backend**: Netlify Functions for secure token generation
- **Real-Time Communication**: Agora RTC for voice
- **Messaging**: Agora RTM for game state sync
- **AI Commentary**: Agora ConvoAI for game host

## Technologies

- [Agora RTC SDK](https://www.agora.io/en/products/video-call/) - Real-time voice/video
- [Agora RTM SDK](https://www.agora.io/en/products/signaling/) - Real-time messaging
- [Agora ConvoAI](https://www.agora.io/en/products/conversational-ai/) - AI voice agent
- [Netlify Functions](https://www.netlify.com/products/functions/) - Serverless backend

## Documentation

Detailed documentation is available in the [`docs/`](docs/) folder:

### Setup & Configuration
- **[ENV_SETUP.md](docs/ENV_SETUP.md)** - Complete environment variable configuration guide
- **[QUICK_START.md](docs/QUICK_START.md)** - Fast setup instructions
- **[QUICK_REFERENCE.md](docs/QUICK_REFERENCE.md)** - Quick reference for common tasks
- **[LOCAL_DEVELOPMENT.md](docs/LOCAL_DEVELOPMENT.md)** - Local development guide
- **[DEPLOYMENT.md](docs/DEPLOYMENT.md)** - Deployment instructions

### Architecture & Features
- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** - System architecture overview
- **[FEATURES.md](docs/FEATURES.md)** - Complete feature list
- **[PROJECT_SUMMARY.md](docs/PROJECT_SUMMARY.md)** - Project overview

### Game Systems
- **[GAME_DISCOVERY.md](docs/GAME_DISCOVERY.md)** - How game discovery works
- **[CHANNEL_SYSTEM.md](docs/CHANNEL_SYSTEM.md)** - Channel naming and management
- **[INTERACTIVE_GAMEPLAY.md](docs/INTERACTIVE_GAMEPLAY.md)** - Interactive features (manual marking, BINGO button)
- **[BINGO_CALLER_UPDATE.md](docs/BINGO_CALLER_UPDATE.md)** - Automated bingo caller system

### ConvoAI Integration
- **[CONVOAI_INTEGRATION.md](docs/CONVOAI_INTEGRATION.md)** - ConvoAI integration overview
- **[CONVOAI_VENDORS.md](docs/CONVOAI_VENDORS.md)** - Vendor configuration (LLM, TTS, ASR)
- **[CONVOAI_ANNOUNCEMENTS.md](docs/CONVOAI_ANNOUNCEMENTS.md)** - How announcements work
- **[CONVOAI_FIX.md](docs/CONVOAI_FIX.md)** - ConvoAI configuration fixes
- **[API_KEY_FIX.md](docs/API_KEY_FIX.md)** - API key troubleshooting

### Updates & Fixes
- **[LATEST_FIXES.md](docs/LATEST_FIXES.md)** - Most recent fixes and improvements
- **[WHATS_FIXED.md](docs/WHATS_FIXED.md)** - Historical fix log

## License

MIT

