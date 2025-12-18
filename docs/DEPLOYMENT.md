# Deployment Guide

This guide will help you deploy the Bingo ConvoAI application to Netlify.

## Prerequisites

- [Node.js](https://nodejs.org/) (v14 or higher)
- [Netlify Account](https://www.netlify.com/) (free tier works great)
- [Agora Account](https://console.agora.io) with ConversationalAI enabled
- Agora App ID, App Certificate, Customer ID, and Customer Secret

## Quick Deploy to Netlify

### Option 1: Deploy from GitHub (Recommended)

1. **Push your code to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Bingo ConvoAI game"
   git remote add origin https://github.com/your-username/bingo-convoai.git
   git push -u origin main
   ```

2. **Connect to Netlify:**
   - Go to [Netlify](https://app.netlify.com/)
   - Click "Add new site" > "Import an existing project"
   - Choose "GitHub" and authorize
   - Select your `bingo-convoai` repository
   - Build settings:
     - Build command: `npm install` (or leave empty)
     - Publish directory: `public`
     - Functions directory: `netlify/functions`
   - Click "Deploy site"

3. **Configure Environment Variables:**
   - Go to Site settings > Environment variables
   - Add the following variables (see ENV_SETUP.md for details):
     - `AGORA_APP_ID`
     - `AGORA_APP_CERTIFICATE`
     - `AGORA_CUSTOMER_ID`
     - `AGORA_CUSTOMER_SECRET`
     - (Optional) `CONVOAI_API_URL`
     - (Optional) `BINGO_BOARD_SIZE`
     - (Optional) `BINGO_TOKEN_VALIDITY_SECONDS`
     - (Optional) `BINGO_TOKEN_RENEWAL_THRESHOLD_SECONDS`

4. **Trigger a new deploy:**
   - Go to Deploys tab
   - Click "Trigger deploy" > "Clear cache and deploy site"

### Option 2: Deploy via Netlify CLI

1. **Install Netlify CLI:**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify:**
   ```bash
   netlify login
   ```

3. **Initialize the site:**
   ```bash
   netlify init
   ```
   - Choose "Create & configure a new site"
   - Select your team
   - Choose a site name (or let Netlify generate one)
   - Build command: `npm install` (or leave empty)
   - Directory to deploy: `public`
   - Functions directory: `netlify/functions`

4. **Set environment variables:**
   ```bash
   netlify env:set AGORA_APP_ID "your_app_id"
   netlify env:set AGORA_APP_CERTIFICATE "your_certificate"
   netlify env:set AGORA_CUSTOMER_ID "your_customer_id"
   netlify env:set AGORA_CUSTOMER_SECRET "your_customer_secret"
   ```

5. **Deploy:**
   ```bash
   netlify deploy --prod
   ```

### Option 3: Drag & Drop Deploy

1. **Build the site locally:**
   ```bash
   npm install
   ```

2. **Create a zip file:**
   - Zip the entire project folder

3. **Deploy to Netlify:**
   - Go to [Netlify Drop](https://app.netlify.com/drop)
   - Drag and drop your zip file
   - Once deployed, go to Site settings and add environment variables

## Post-Deployment Setup

### 1. Configure Custom Domain (Optional)

1. Go to Site settings > Domain management
2. Click "Add custom domain"
3. Follow the instructions to configure DNS

### 2. Enable HTTPS

- Netlify automatically provisions SSL certificates
- Go to Site settings > Domain management > HTTPS
- Click "Verify DNS configuration" and "Provision certificate"

### 3. Test Your Deployment

1. Visit your deployed site URL
2. Click "Configure Agora App ID" and enter your App ID
3. Try creating a game
4. Open the site in another browser/incognito window to join the game
5. Test the voice chat and AI commentary features

## Troubleshooting

### Functions Not Working

**Issue:** Token generation or ConvoAI functions return 500 errors

**Solutions:**
- Verify all environment variables are set correctly in Netlify
- Check the Functions tab in Netlify for error logs
- Ensure `agora-access-token` package is in `dependencies` (not `devDependencies`)

### ConvoAI Agent Not Starting

**Issue:** Agent fails to start or provide commentary

**Solutions:**
- Verify `AGORA_CUSTOMER_ID` and `AGORA_CUSTOMER_SECRET` are correct
- Ensure ConversationalAI is enabled in your Agora project
- Check Netlify function logs for detailed error messages
- Verify your Agora project has ConvoAI credits available

### Token Expiration Issues

**Issue:** Users get disconnected after some time

**Solutions:**
- Tokens automatically renew before expiration
- Check console logs for token renewal messages
- Adjust `BINGO_TOKEN_VALIDITY_SECONDS` if needed (default: 3600 = 1 hour)

### RTC/RTM Connection Fails

**Issue:** Players can't connect to voice chat

**Solutions:**
- Verify browser has microphone permissions
- Check browser console for RTC/RTM errors
- Ensure `AGORA_APP_ID` and `AGORA_APP_CERTIFICATE` are correct
- Try on a different network (some corporate networks block RTC)

## Monitoring and Analytics

### Netlify Analytics

- Enable Netlify Analytics in Site settings
- Monitor traffic, performance, and function usage

### Agora Console

- Check [Agora Console](https://console.agora.io) for:
  - API usage and credits
  - ConvoAI session statistics
  - RTC/RTM channel activity

## Scaling Considerations

### Free Tier Limits

**Netlify:**
- 125k function requests per month
- 100GB bandwidth per month
- Should handle ~1000+ games per month

**Agora:**
- Check your plan for RTC minutes and ConvoAI usage
- Monitor usage in Agora Console

### Optimization Tips

1. **Token Caching:** Tokens are valid for 1 hour by default
2. **Connection Pooling:** Reuse Agora connections when possible
3. **Efficient Commentary:** AI commentary only triggers on turn changes
4. **Auto-cleanup:** Old games (>1 hour) are filtered from the lobby

## Security Best Practices

1. ✅ **Never commit `.env` files**
2. ✅ **All tokens generated server-side**
3. ✅ **Environment variables in Netlify only**
4. ✅ **HTTPS enforced automatically**
5. ✅ **App Certificate kept private**

## Updating Your Deployment

### Via Git (if connected to GitHub)

```bash
git add .
git commit -m "Update: description of changes"
git push
```
Netlify will automatically rebuild and deploy.

### Via Netlify CLI

```bash
netlify deploy --prod
```

## Support

If you encounter issues:
1. Check Netlify function logs
2. Check browser console logs
3. Review Agora Console for API errors
4. Consult the [Agora Documentation](https://docs.agora.io)
5. Check [Netlify Documentation](https://docs.netlify.com)

---

🎉 **Congratulations!** Your Bingo ConvoAI game is now deployed and ready for players!

