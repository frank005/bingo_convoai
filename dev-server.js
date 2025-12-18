#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Load .env file
const envPath = path.join(__dirname, '.env');

if (fs.existsSync(envPath)) {
  console.log('Loading environment variables from .env...');
  const envContent = fs.readFileSync(envPath, 'utf-8');
  
  envContent.split('\n').forEach(line => {
    // Skip comments and empty lines
    if (line.trim() === '' || line.trim().startsWith('#')) {
      return;
    }
    
    // Parse KEY=VALUE
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      
      // Remove surrounding quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      
      process.env[key] = value;
    }
  });
  
  console.log('✓ Environment variables loaded');
  console.log('Checking key variables:');
  if (process.env.AGORA_APP_ID) {
    console.log(`  AGORA_APP_ID: ${process.env.AGORA_APP_ID.substring(0, 8)}...`);
  }
  if (process.env.LLM_API_KEY) {
    console.log(`  LLM_API_KEY: SET (${process.env.LLM_API_KEY.substring(0, 8)}...)`);
  } else {
    console.log('  LLM_API_KEY: ❌ NOT SET');
  }
  if (process.env.MICROSOFT_TTS_KEY) {
    console.log(`  MICROSOFT_TTS_KEY: SET (${process.env.MICROSOFT_TTS_KEY.substring(0, 8)}...)`);
  } else {
    console.log('  MICROSOFT_TTS_KEY: ❌ NOT SET');
  }
  if (process.env.MICROSOFT_ASR_KEY) {
    console.log(`  MICROSOFT_ASR_KEY: SET (${process.env.MICROSOFT_ASR_KEY.substring(0, 8)}...)`);
  } else {
    console.log('  MICROSOFT_ASR_KEY: ❌ NOT SET');
  }
} else {
  console.error('⚠️  Error: .env file not found!');
  console.error('Please create a .env file based on env.example');
  process.exit(1);
}

// Start Netlify Dev
console.log('\nStarting Netlify Dev...\n');
const args = process.argv.slice(2); // Pass through any additional arguments
const netlifyDev = spawn('netlify', ['dev', ...args], {
  stdio: 'inherit',
  env: process.env
});

netlifyDev.on('error', (error) => {
  console.error('Failed to start Netlify Dev:', error);
  process.exit(1);
});

netlifyDev.on('close', (code) => {
  process.exit(code || 0);
});

