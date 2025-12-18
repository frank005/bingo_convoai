# Environment Variables Setup

This file explains how to set up your environment variables for the Bingo ConvoAI application.

## Required Environment Variables

You need to configure the following environment variables in Netlify (or create a `.env` file for local development):

### 1. Agora Configuration

```bash
# Get these from https://console.agora.io
AGORA_APP_ID=your_app_id_here
AGORA_APP_CERTIFICATE=your_app_certificate_here
```

### 2. Agora REST API Credentials (for ConvoAI)

```bash
# Get these from Agora Console > Projects > ConversationalAI
AGORA_CUSTOMER_ID=your_customer_id_here
AGORA_CUSTOMER_SECRET=your_customer_secret_here
```

### 3. LLM Configuration (Required for ConvoAI)

```bash
# OpenAI API key for the AI caller
LLM_API_KEY=your_openai_api_key_here
```

### 4. Microsoft TTS Configuration (Required for ConvoAI Voice)

```bash
# Microsoft Azure TTS credentials
MICROSOFT_TTS_KEY=your_microsoft_tts_key_here
MICROSOFT_TTS_REGION=eastus
```

### 5. ConvoAI Configuration (Optional - has defaults)

```bash
# ConvoAI API endpoint (default shown)
CONVOAI_API_URL=https://api.agora.io/api/conversational-ai-agent/v2
```

### 6. Game Configuration (Optional - has defaults)

```bash
# Bingo board size (default: 5 for 5x5 board)
BINGO_BOARD_SIZE=5

# Token validity in seconds (default: 3600 = 1 hour)
BINGO_TOKEN_VALIDITY_SECONDS=3600

# Token renewal threshold in seconds (default: 300 = 5 minutes before expiry)
BINGO_TOKEN_RENEWAL_THRESHOLD_SECONDS=300
```

## Setting Up in Netlify

1. Go to your Netlify site dashboard
2. Navigate to **Site settings** > **Environment variables**
3. Click **Add a variable** for each required variable
4. Enter the variable name and value
5. Save changes
6. Redeploy your site

## Local Development

1. Create a `.env` file in the project root:
   ```bash
   cp env.example .env
   ```
   
   Or create `.env` manually with the content from `env.example`

2. Edit `.env` and add your credentials:
   ```bash
   nano .env
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

## Getting Agora Credentials

1. **App ID and Certificate:**
   - Go to [Agora Console](https://console.agora.io)
   - Create or select a project
   - Copy the **App ID**
   - Enable the App Certificate and copy it

2. **Customer ID and Secret (for ConvoAI):**
   - In your project, go to **Conversational AI** section
   - Find or generate your REST API credentials
   - Copy the **Customer ID** and **Customer Secret**

## Security Notes

- ⚠️ **Never commit `.env` files to version control**
- ⚠️ **Keep your App Certificate and Customer Secret private**
- ⚠️ **Use Netlify environment variables for production**
- ✅ **Tokens are generated server-side for security**
- ✅ **All sensitive operations happen in backend functions**

## Troubleshooting

### Token Generation Fails
- Verify your `AGORA_APP_ID` and `AGORA_APP_CERTIFICATE` are correct
- Check that the App Certificate is enabled in Agora Console

### ConvoAI Agent Fails to Start
- Verify your `AGORA_CUSTOMER_ID` and `AGORA_CUSTOMER_SECRET` are correct
- Ensure ConversationalAI is enabled for your project in Agora Console
- **Check that all API keys are set:**
  - `LLM_API_KEY` (required for all LLM vendors)
  - `MICROSOFT_TTS_KEY` (required if using Microsoft TTS)
  - `MICROSOFT_ASR_KEY` (required if using Microsoft ASR)
- Check the Netlify function logs for detailed error messages
- Look for "🔑 API Keys Check" in the logs - all should show ✅
- See `API_KEY_FIX.md` for detailed troubleshooting

### Games Not Connecting
- Verify all Agora credentials are set correctly
- Check browser console for RTC/RTM connection errors
- Ensure microphone permissions are granted

