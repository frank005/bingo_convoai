# Local Development Guide

Instructions for running and developing the Bingo ConvoAI application locally.

## Prerequisites

- [Node.js](https://nodejs.org/) v14 or higher
- [npm](https://www.npmjs.com/) (comes with Node.js)
- Agora App ID and credentials
- A code editor (VS Code recommended)

## Initial Setup

### 1. Clone/Navigate to Project

```bash
cd bingo_convoai
```

### 2. Install Dependencies

```bash
npm install
```

This installs:
- `netlify-cli` - For running Netlify functions locally
- `agora-access-token` - For token generation

### 3. Create Environment File

Create a `.env` file in the project root:

```bash
# Copy from example
cp env.example .env

# Or create manually
touch .env
```

Add your credentials to `.env`:

```bash
# Agora Configuration
AGORA_APP_ID=your_app_id_here
AGORA_APP_CERTIFICATE=your_app_certificate_here

# Agora REST API Credentials
AGORA_CUSTOMER_ID=your_customer_id_here
AGORA_CUSTOMER_SECRET=your_customer_secret_here

# Optional: Custom configurations
CONVOAI_API_URL=https://api.agora.io/api/conversational-ai-agent/v2
BINGO_BOARD_SIZE=5
BINGO_TOKEN_VALIDITY_SECONDS=3600
BINGO_TOKEN_RENEWAL_THRESHOLD_SECONDS=300
```

**⚠️ Important:** Never commit the `.env` file to git!

### 4. Verify Project Structure

Your project should look like this:

```
bingo_convoai/
├── .env                    (you created this)
├── .gitignore
├── package.json
├── netlify.toml
├── README.md
├── netlify/
│   └── functions/
│       ├── generate-token.js
│       └── convoai-agent.js
└── public/
    ├── index.html
    ├── css/
    │   └── styles.css
    └── js/
        ├── config.js
        ├── agora-client.js
        ├── convoai-manager.js
        ├── game-logic.js
        └── app.js
```

## Running Locally

### Start Development Server

**Default Port (8888):**
```bash
npm run dev
```

**Custom Port:**
```bash
# Run on a specific port (e.g., 3000)
netlify dev --port 3000

# Or use the npm script
npm run dev:port 3000
```

This command:
- Starts Netlify Dev server
- Runs functions at `http://localhost:[PORT]/.netlify/functions/`
- Serves frontend at `http://localhost:[PORT]`
- Hot-reloads on file changes

### Access the Application

Open your browser and navigate to:
```
http://localhost:8888  (or your custom port)
```

## Testing Locally

### Single Browser Testing

1. Open `http://localhost:8888`
2. Configure App ID
3. Enter your name as "Player 1"
4. Create a new game
5. Note the Game ID

### Multi-Player Testing

**Method 1: Incognito Window**
1. Open game in normal browser window
2. Open `http://localhost:8888` in incognito/private window
3. Join the game using the Game ID

**Method 2: Different Browsers**
1. Open game in Chrome
2. Open game in Firefox or Safari
3. Join from the second browser

**Method 3: Different Devices**
1. Get your local IP: `ifconfig` (Mac/Linux) or `ipconfig` (Windows)
2. Access from another device: `http://YOUR_LOCAL_IP:8888`
3. Both devices must be on same WiFi network

### Testing Functions Locally

#### Test Token Generation

```bash
curl -X POST http://localhost:8888/.netlify/functions/generate-token \
  -H "Content-Type: application/json" \
  -d '{"channelName":"test","uid":12345,"role":"publisher"}'
```

Expected response:
```json
{
  "rtcToken": "...",
  "rtmToken": "...",
  "uid": 12345,
  "channelName": "test",
  "expiresAt": 1234567890,
  "validitySeconds": 3600
}
```

#### Test ConvoAI Agent Start

```bash
curl -X POST http://localhost:8888/.netlify/functions/convoai-agent \
  -H "Content-Type: application/json" \
  -d '{
    "action": "start",
    "channelName": "test_channel",
    "agentConfig": {
      "channel": "test_channel",
      "uid": "999999",
      "properties": {
        "greeting_message": "Hello from local test!",
        "system_instruction": "You are a test agent.",
        "enable_rtm": true
      }
    }
  }'
```

## Development Workflow

### Making Changes

1. **Edit Files**
   - Frontend: Edit files in `public/`
   - Functions: Edit files in `netlify/functions/`
   - Styles: Edit `public/css/styles.css`

2. **Auto-Reload**
   - Frontend changes reload automatically
   - Function changes require restart (Ctrl+C, then `npm run dev`)

3. **Test Changes**
   - Refresh browser for frontend changes
   - Re-run function curl commands for backend changes

### Common Development Tasks

#### Adjust Board Size

Edit `.env`:
```bash
BINGO_BOARD_SIZE=3  # For 3x3 board
```
Restart server, refresh browser.

#### Change AI Personality

Edit `.env`:
```bash
CONVOAI_SYSTEM_PROMPT=You are a pirate captain hosting a bingo game. Arr!
```
The next agent started will use the new prompt.

#### Modify Token Validity

Edit `.env`:
```bash
BINGO_TOKEN_VALIDITY_SECONDS=7200  # 2 hours
```
Restart server, generate new tokens.

#### Update UI Styles

Edit `public/css/styles.css`:
```css
/* Change primary color */
--agora-cyan: #your-color;
```
Save and refresh browser.

## Debugging

### Browser Console

Open browser DevTools (F12):
- **Console tab:** See logs from JavaScript
- **Network tab:** Monitor API calls and WebSocket connections
- **Application tab:** Inspect LocalStorage

### Function Logs

Netlify Dev shows function logs in the terminal:
```bash
# Look for these in your terminal
◈ Functions server is listening on 57732

# Function invocation logs appear as:
◈ Rewrote URL to /.netlify/functions/generate-token
Request from ::1: POST /.netlify/functions/generate-token
```

### Common Issues

#### "Failed to generate tokens"

**Check:**
1. Is `.env` file in project root?
2. Are credentials correct in `.env`?
3. Did you restart Netlify Dev after editing `.env`?

**Fix:**
```bash
# Verify .env exists
ls -la .env

# Check .env content (don't share!)
cat .env

# Restart server
# Ctrl+C to stop
npm run dev
```

#### "ConvoAI agent won't start"

**Check:**
1. Customer ID and Secret correct?
2. ConversationalAI enabled in Agora Console?
3. Function logs for error details?

**Fix:**
```bash
# Test function directly
curl -X POST http://localhost:8888/.netlify/functions/convoai-agent \
  -H "Content-Type: application/json" \
  -d '{"action":"start","channelName":"test",...}'
```

#### "Can't connect to game"

**Check:**
1. Is App ID configured in the UI?
2. Are RTC/RTM SDKs loading?
3. Microphone permissions granted?

**Fix:**
- Open browser console
- Look for Agora SDK errors
- Check Network tab for failed requests
- Grant microphone permission when prompted

#### Port Already in Use

```bash
# Error: Port 8888 is already in use

# Option 1: Use a different port
netlify dev --port 3000

# Option 2: Find and kill the process using the port
lsof -i :8888  # Mac/Linux
netstat -ano | findstr :8888  # Windows

# Then kill the process
kill -9 [PID]  # Mac/Linux
taskkill /PID [PID] /F  # Windows
```

## Advanced Development

### Custom Function Development

1. Create new function in `netlify/functions/`:
```javascript
// netlify/functions/my-function.js
exports.handler = async (event, context) => {
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Hello!' })
  };
};
```

2. Access at `http://localhost:8888/.netlify/functions/my-function`

### Environment-Specific Code

```javascript
// Check if running locally
const isDev = process.env.NETLIFY_DEV === 'true';

if (isDev) {
  console.log('Running in development mode');
}
```

### Hot Module Replacement

For faster development:
1. Use browser DevTools Workspaces
2. Enable "Save all updates to disk"
3. Changes persist without page refresh

## Testing Checklist

Before deploying, test these scenarios locally:

### Basic Functionality
- [ ] Configure App ID
- [ ] Create game
- [ ] Join game (incognito window)
- [ ] Mark cells
- [ ] Hear voice chat
- [ ] Win game
- [ ] Leave game

### Edge Cases
- [ ] Try to mark opponent's cell
- [ ] Mark cell not on your turn
- [ ] Leave game mid-game
- [ ] Refresh page during game
- [ ] Multiple games simultaneously
- [ ] Join full game

### ConvoAI
- [ ] Agent starts after turn
- [ ] Agent speaks commentary
- [ ] Agent stops automatically
- [ ] Commentary matches game state
- [ ] Agent handles rapid turns

### Performance
- [ ] Page loads quickly
- [ ] Game responds instantly
- [ ] Voice has low latency
- [ ] No console errors
- [ ] No memory leaks (use DevTools Memory profiler)

## Building for Production

### Pre-Deploy Checklist

1. **Test Thoroughly**
   - All features working locally
   - No console errors
   - Tested with 2 players

2. **Code Quality**
   - Remove debug console.logs (or wrap in `if (isDev)`)
   - Check for TODOs and FIXMEs
   - Ensure all files have proper comments

3. **Configuration**
   - Verify `.env` not committed
   - Update README if needed
   - Check all environment variables documented

4. **Performance**
   - No unnecessary network calls
   - Optimize large assets
   - Check bundle size

### Deploy

```bash
# Deploy to Netlify
netlify deploy --prod

# Or push to GitHub (if connected)
git add .
git commit -m "Ready for production"
git push
```

## IDE Setup

### VS Code Recommended Extensions

- **ES6 Code Snippets** - Quick JavaScript snippets
- **Prettier** - Code formatting
- **ESLint** - Code linting
- **Live Server** - Quick preview (alternative to Netlify Dev)
- **Path Intellisense** - Autocomplete file paths

### VS Code Settings

Create `.vscode/settings.json`:
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "files.associations": {
    "*.js": "javascript"
  }
}
```

## Getting Help

### Resources
- [Netlify Dev Documentation](https://docs.netlify.com/cli/get-started/)
- [Agora RTC Web SDK](https://docs.agora.io/en/video-calling/overview/product-overview)
- [Agora RTM Web SDK](https://docs.agora.io/en/signaling/overview/product-overview)
- [Agora ConvoAI API](https://docs.agora.io/en/conversational-ai/overview/product-overview)

### Community
- [Agora Developer Community](https://www.agora.io/en/community/)
- [Netlify Community](https://answers.netlify.com/)

---

Happy Coding! 🚀

