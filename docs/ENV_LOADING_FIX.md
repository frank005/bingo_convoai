# Environment Variable Loading Fix

## The Problem

Netlify Dev **does not automatically load `.env` files** or inherit environment variables from the parent shell. This caused the ConvoAI functions to fail with "Missing LLM_API_KEY" errors, even though the keys were in the `.env` file.

## The Solution

Created a **Node.js wrapper script** (`dev-server.js`) that:
1. Reads and parses the `.env` file
2. Loads all variables into `process.env`
3. Spawns `netlify dev` with the loaded environment
4. Shows which keys are loaded for verification

## How to Use

### Start the Dev Server (NEW WAY)

**Stop your current dev server** (Ctrl+C) and restart with:

```bash
npm run dev
```

This now uses `dev-server.js` which properly loads your `.env` file.

### What You'll See

When starting, you'll see output like this:

```
Loading environment variables from .env...
✓ Environment variables loaded
Checking key variables:
  AGORA_APP_ID: b82bc283...
  LLM_API_KEY: SET (sk-proj-...)
  MICROSOFT_TTS_KEY: SET (abc12345...)
  MICROSOFT_ASR_KEY: SET (xyz78901...)

Starting Netlify Dev...
```

**All keys should show "SET"** - if any show "NOT SET", check your `.env` file.

### Alternative Methods

**Option 1: Use the bash script (may not work on all systems)**
```bash
./start-dev.sh
```

**Option 2: Run directly (won't load .env)**
```bash
netlify dev
```

## Verification

After starting the server, when you create a game and the ConvoAI agent tries to join, check the terminal for:

```
Environment variables validated: {
  hasLLMKey: true,
  hasTTSKey: true,
  hasASRKey: true,
  ...
}
```

If you see `false` for any key, the `.env` file wasn't loaded properly.

## How It Works

### Old Approach (Broken)
```bash
# start-dev.sh
export $(cat .env | xargs)
netlify dev  # ❌ Doesn't inherit env vars!
```

**Problem:** Netlify Dev spawns child processes that don't inherit shell environment variables.

### New Approach (Working)
```javascript
// dev-server.js
const envVars = readAndParseEnvFile('.env');
Object.assign(process.env, envVars);
spawn('netlify', ['dev'], { env: process.env });  // ✅ Explicitly passes env!
```

**Solution:** Explicitly pass environment variables to the child process.

## Troubleshooting

### Keys Still Not Loading

1. **Make sure `.env` file exists:**
   ```bash
   ls -la .env
   ```

2. **Check if keys are in the file:**
   ```bash
   grep -E "^(LLM_API_KEY|MICROSOFT_TTS_KEY|MICROSOFT_ASR_KEY)=" .env
   ```

3. **Restart the dev server:**
   ```bash
   # Stop current server (Ctrl+C)
   npm run dev
   ```

### "Missing LLM_API_KEY" Error Still Appears

If you still see this error in the terminal when the agent tries to start:

1. **Check the startup logs** - Do you see "LLM_API_KEY: SET"?
   - **YES** → The problem is elsewhere (maybe the key is invalid)
   - **NO** → The .env file isn't loading

2. **Verify the .env file format:**
   ```bash
   # Should look like this:
   LLM_API_KEY=sk-proj-abc123...
   MICROSOFT_TTS_KEY=abc123...
   MICROSOFT_ASR_KEY=xyz789...
   
   # NOT like this (no quotes):
   LLM_API_KEY="sk-proj-abc123..."  # ❌ Remove quotes
   ```

3. **Check for typos in variable names:**
   ```bash
   # Correct:
   LLM_API_KEY=...
   MICROSOFT_TTS_KEY=...
   
   # Wrong:
   LLM_API_KEY =...        # ❌ Space before =
   LLMAPI_KEY=...          # ❌ Missing underscore
   MICROSOFT_TSS_KEY=...   # ❌ Typo (TSS vs TTS)
   ```

### Dev Server Won't Start

1. **Make sure Node.js is installed:**
   ```bash
   node --version  # Should show v16 or higher
   ```

2. **Make sure Netlify CLI is installed:**
   ```bash
   netlify --version
   ```

3. **Reinstall dependencies if needed:**
   ```bash
   npm install
   ```

## File Changes

### Modified Files
- **`package.json`** - Updated `dev` script to use `node dev-server.js`
- **`start-dev.sh`** - Updated to use `source .env` (kept as backup method)

### New Files
- **`dev-server.js`** - Node.js script that loads .env and starts Netlify Dev

## Why This Approach?

### Tried and Failed:
1. ❌ **Shell export + netlify dev** - Child processes don't inherit
2. ❌ **dotenv-cli** - Had installation issues, adds dependency
3. ❌ **netlify.toml env config** - Only works for deployed sites, not local dev

### Working Solution:
✅ **Node.js wrapper** - Reliable, no extra dependencies, shows verification

## Next Steps

1. **Stop your current dev server** (Ctrl+C)
2. **Start with the new method:** `npm run dev`
3. **Verify keys are loaded** in the startup output
4. **Test ConvoAI** by creating a game with 2 players

If you see all keys showing "SET" and still get errors, the issue is with the **keys themselves** (invalid, expired, wrong region), not with the loading mechanism.

