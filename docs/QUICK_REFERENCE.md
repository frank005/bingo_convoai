# Quick Reference

Common commands and configurations for Bingo ConvoAI.

## 🚀 Getting Started

### First Time Setup

```bash
# 1. Copy environment file
cp env.example .env

# 2. Edit .env with your Agora credentials
nano .env

# 3. Install dependencies
npm install

# 4. Run development server
npm run dev
```

## 💻 Development Commands

### Run Development Server

```bash
# Default port (8888)
npm run dev

# Custom port
netlify dev --port 3000

# Specific port examples
netlify dev --port 5000
netlify dev --port 9000
```

### Other Commands

```bash
# Build (no build step needed for this project)
npm run build

# Deploy to Netlify
netlify deploy --prod

# Deploy preview
netlify deploy
```

## 🔧 Port Configuration

### Why Use a Different Port?

- Port 8888 is already in use
- Running multiple Netlify projects
- Personal preference
- Conflict with other services

### How to Change Port

**Method 1: Command Line Flag**
```bash
netlify dev --port 3000
```

**Method 2: Netlify Config**

Create or edit `netlify.toml`:
```toml
[dev]
  port = 3000
```

**Method 3: Environment Variable**
```bash
NETLIFY_DEV_PORT=3000 netlify dev
```

## 📁 Environment Variables

### Required

```bash
AGORA_APP_ID=your_app_id
AGORA_APP_CERTIFICATE=your_certificate
AGORA_CUSTOMER_ID=your_customer_id
AGORA_CUSTOMER_SECRET=your_customer_secret
```

### Optional (with defaults)

```bash
CONVOAI_API_URL=https://api.agora.io/api/conversational-ai-agent/v2
BINGO_BOARD_SIZE=5
BINGO_TOKEN_VALIDITY_SECONDS=3600
BINGO_TOKEN_RENEWAL_THRESHOLD_SECONDS=300
```

## 🌐 Accessing the App

### Local Development

```bash
# Default
http://localhost:8888

# Custom port
http://localhost:3000  # (or whatever port you chose)
```

### From Other Devices (Same WiFi)

```bash
# Find your local IP
ifconfig  # Mac/Linux
ipconfig  # Windows

# Access from other device
http://YOUR_LOCAL_IP:8888
```

## 🧪 Testing Functions Locally

### Generate Token

```bash
curl -X POST http://localhost:8888/.netlify/functions/generate-token \
  -H "Content-Type: application/json" \
  -d '{"channelName":"test","uid":12345,"role":"publisher"}'
```

### Start ConvoAI Agent

```bash
curl -X POST http://localhost:8888/.netlify/functions/convoai-agent \
  -H "Content-Type: application/json" \
  -d '{
    "action": "start",
    "channelName": "test",
    "agentConfig": {...}
  }'
```

## 🐛 Common Issues

### Port Already in Use

```bash
# Use different port
netlify dev --port 3000

# Or find and kill process
lsof -i :8888  # Shows process using port 8888
kill -9 [PID]  # Kill that process
```

### Environment Variables Not Working

```bash
# Make sure .env is in project root
ls -la .env

# Restart Netlify Dev after editing .env
# Press Ctrl+C, then:
npm run dev
```

### Functions Not Found

```bash
# Verify functions directory structure
ls netlify/functions/

# Should show:
# - generate-token.js
# - convoai-agent.js
```

## 📦 Project Structure

```
bingo_convoai/
├── .env                    ← Your credentials (create from env.example)
├── env.example             ← Template for .env
├── package.json            ← Dependencies
├── netlify.toml            ← Netlify config
├── netlify/functions/      ← Backend functions
└── public/                 ← Frontend files
```

## 🔑 Where to Get Credentials

1. **Agora Console:** https://console.agora.io
   - Create/select a project
   - Get App ID and Certificate
   - Go to ConversationalAI tab
   - Get Customer ID and Secret

2. **Netlify:** https://app.netlify.com
   - Deploy your site
   - Add environment variables in Site settings

## 🎮 Quick Play Test

```bash
# Terminal 1: Start server
npm run dev

# Browser 1: http://localhost:8888
# - Configure App ID
# - Enter name: "Player 1"
# - Create game
# - Note the Game ID

# Browser 2: http://localhost:8888 (incognito)
# - Configure App ID
# - Enter name: "Player 2"
# - Join game with Game ID

# Play!
```

## 📞 Need Help?

- **Documentation:** Check README.md, LOCAL_DEVELOPMENT.md
- **Logs:** Watch terminal output from `npm run dev`
- **Browser Console:** Press F12, check Console tab
- **Netlify Logs:** Check function logs in terminal

## 🚀 Deploy Checklist

Before deploying:
- [ ] Test locally with 2 players
- [ ] No console errors
- [ ] Voice chat works
- [ ] AI commentary works
- [ ] All environment variables documented
- [ ] .env not committed to git

Deploy:
```bash
# Deploy to Netlify
netlify deploy --prod

# Set environment variables in Netlify dashboard
# Site settings > Environment variables > Add variable
```

---

**Quick Tip:** Bookmark this file for easy access to common commands! 🔖

