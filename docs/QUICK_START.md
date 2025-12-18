# Quick Start Guide

Get up and running with Bingo ConvoAI in 5 minutes!

## 🚀 5-Minute Setup

### Step 1: Get Agora Credentials (2 minutes)

1. **Go to [Agora Console](https://console.agora.io)**
   - Sign up or log in

2. **Create or Select a Project**
   - Click "Create Project" if you don't have one
   - Enable "App Certificate"

3. **Get Your Credentials**
   - Copy **App ID**
   - Copy **App Certificate**
   - Go to "Conversational AI" tab
   - Copy **Customer ID** and **Customer Secret**

### Step 2: Deploy to Netlify (2 minutes)

**Option A: GitHub (Recommended)**
```bash
# Clone or create repository
git init
git add .
git commit -m "Initial commit"
git remote add origin YOUR_GITHUB_URL
git push -u origin main

# Then in Netlify:
# 1. Click "New site from Git"
# 2. Connect to GitHub
# 3. Select your repo
# 4. Click "Deploy site"
```

**Option B: Netlify CLI**
```bash
npm install -g netlify-cli
netlify login
netlify init
netlify deploy --prod
```

**Option C: Drag & Drop**
- Zip your project folder
- Go to [Netlify Drop](https://app.netlify.com/drop)
- Drag and drop the zip file

### Step 3: Configure Environment Variables (1 minute)

In Netlify dashboard (Site settings > Environment variables):

```bash
AGORA_APP_ID=YOUR_APP_ID_HERE
AGORA_APP_CERTIFICATE=YOUR_APP_CERTIFICATE_HERE
AGORA_CUSTOMER_ID=YOUR_CUSTOMER_ID_HERE
AGORA_CUSTOMER_SECRET=YOUR_CUSTOMER_SECRET_HERE
```

Click "Save" and trigger a new deploy.

### Step 4: Play! (30 seconds)

1. Visit your deployed site
2. Click "Configure Agora App ID"
3. Enter your App ID from Step 1
4. Enter your name
5. Click "Create New Game"
6. Share the Game ID with a friend!

## 🎮 How to Play

### Creating a Game

1. **Enter Your Name**
   ```
   [Your Name: _________]
   [Start Playing]
   ```

2. **Create Game**
   ```
   Click "Create New Game"
   ```

3. **Share with Friend**
   ```
   Game ID: ABC123
   Invite Link: https://your-site.netlify.app?join=ABC123
   ```

### Joining a Game

**Method 1: Click Invite Link**
- Friend sends you: `https://your-site.netlify.app?join=ABC123`
- Click it, enter your name, done!

**Method 2: Browse Games**
- Click "Available Games"
- Click any game with status "waiting"

**Method 3: Manual Join**
- Enter Game ID
- Click "Join"

### Playing

1. **Wait for Your Turn**
   - Green border = your turn
   - Status message shows whose turn it is

2. **Mark a Number**
   - Click any unmarked number on your board
   - Blue = your mark
   - Gray = opponent's mark

3. **Listen to Commentary**
   - AI host speaks after each turn
   - Provides exciting game updates!

4. **Win!**
   - Complete a row, column, or diagonal
   - Get 5 bonus points
   - Winner banner appears!

## 🎤 Voice Chat

- Microphone auto-enables on game start
- Click "🎤 Mute" to toggle microphone
- Hear your opponent in real-time
- Hear AI commentary automatically

## 📱 Mobile Playing

Works great on mobile!

1. Open browser (Chrome/Safari)
2. Allow microphone access
3. Tap cells to mark them
4. Enjoy!

## 🐛 Troubleshooting

### "Failed to generate tokens"
- Check environment variables in Netlify
- Verify App ID and Certificate are correct
- Redeploy after setting variables

### "ConvoAI agent failed to start"
- Check Customer ID and Secret
- Verify ConversationalAI is enabled in Agora Console
- Check you have ConvoAI credits

### "Can't hear opponent"
- Grant microphone permissions
- Check browser console for errors
- Try refreshing the page
- Ensure both players clicked "unmute"

### "Game won't connect"
- Check internet connection
- Try different browser
- Verify Agora credentials
- Check Netlify function logs

## 💡 Tips & Tricks

### For Best Experience

1. **Use Chrome or Firefox** - Best WebRTC support
2. **Grant Microphone Permission** - Required for voice
3. **Use Headphones** - Prevents echo
4. **Stable Internet** - WiFi recommended over cellular
5. **Desktop Recommended** - Better board visibility

### Game Strategy

1. **Free Space** - Center square is automatic
2. **Diagonals** - Often easiest to complete
3. **Speed** - Mark numbers quickly on your turn
4. **Listen** - AI commentary gives game insights

### Hosting Tips

1. **Share Link** - Easiest for friends to join
2. **QR Codes** - Great for in-person gaming
3. **Game ID** - Short and easy to share verbally
4. **Refresh List** - New games appear automatically

## 📞 Get Help

### Resources
- **Documentation:** See README.md
- **Architecture:** See ARCHITECTURE.md
- **Deployment:** See DEPLOYMENT.md
- **Features:** See FEATURES.md

### Support
- Check browser console for errors
- Check Netlify function logs
- Review Agora Console for usage
- Check environment variables

### Common Questions

**Q: How many players can play?**
A: Exactly 2 players per game.

**Q: Can I play solo?**
A: Not yet - need 2 players!

**Q: Is there a time limit?**
A: No time limit, but tokens expire after 1 hour (auto-renewed).

**Q: Can I create multiple games?**
A: Yes! Create as many as you want.

**Q: Is my data saved?**
A: Only locally - no server-side storage.

**Q: Can I customize the board size?**
A: Yes, via `BINGO_BOARD_SIZE` environment variable (requires redeploy).

## 🎉 Next Steps

Now that you're set up:

1. **Play a few games** - Get familiar with the flow
2. **Try voice chat** - Test the audio quality
3. **Listen to AI** - Enjoy the commentary
4. **Invite friends** - Share the fun!
5. **Customize** - Tweak settings to your liking

## 🚢 Going to Production

Before sharing widely:

1. ✅ Test with multiple users
2. ✅ Monitor Agora usage in console
3. ✅ Set up custom domain (optional)
4. ✅ Enable Netlify Analytics
5. ✅ Monitor function usage
6. ✅ Set usage alerts in Agora Console

---

**Enjoy playing Bingo with AI commentary! 🎮🤖**

Have fun, and may the best player win! 🎉

