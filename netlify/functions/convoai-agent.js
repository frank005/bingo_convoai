// Use AccessToken2 for 007 token generation (from convo_ai demo)
const { RtcTokenBuilder, Role: RtcRole } = require('./RtcTokenBuilder2.js');

// Helper function to generate unified 007 token for the agent
async function generateAgentToken(channelName, agentUid) {
  const appId = process.env.AGORA_APP_ID;
  const appCertificate = process.env.AGORA_APP_CERTIFICATE;
  
  if (!appId || !appCertificate) {
    throw new Error('Missing AGORA_APP_ID or AGORA_APP_CERTIFICATE');
  }
  
  // Agent token should have a longer validity (24 hours vs 1 hour for users)
  const agentTokenValiditySeconds = parseInt(process.env.AGENT_TOKEN_VALIDITY_SECONDS || '86400', 10); // Default: 24 hours
  const tokenExpire = Math.floor(Date.now() / 1000) + agentTokenValiditySeconds;
  const privilegeExpire = 0; // 0 means same as tokenExpire
  
  // Generate unified 007 token with RTC+RTM using AccessToken2
  const token = await RtcTokenBuilder.buildTokenWithRtm(
    appId,
    appCertificate,
    channelName,
    agentUid.toString(),
    RtcRole.PUBLISHER,
    tokenExpire,
    privilegeExpire
  );
  
  console.log(`Generated unified 007 token for agent UID ${agentUid} in channel ${channelName}, valid for ${agentTokenValiditySeconds}s`);
  
  return token;
}

// Helper functions to build ConvoAI config from environment variables
function buildLLMConfig() {
  const vendor = process.env.LLM_VENDOR || 'openai';
  const greetingMode = process.env.CONVOAI_GREETING_MODE || 'single_first';
  
  const config = {
    url: process.env.LLM_URL || 'https://api.openai.com/v1/chat/completions',
    api_key: process.env.LLM_API_KEY,
    system_messages: [{
      role: 'system',
      content: process.env.CONVOAI_SYSTEM_INSTRUCTION || 'You are an energetic Bingo caller.'
    }],
    greeting_message: process.env.CONVOAI_GREETING_MESSAGE || '',
    failure_message: process.env.CONVOAI_FAILURE_MESSAGE || 'I didn\'t catch that.',
    max_history: parseInt(process.env.LLM_MAX_HISTORY || '1', 10),
    input_modalities: ['text'],
    output_modalities: ['text'],
    params: {
      model: process.env.LLM_MODEL || 'gpt-4o-mini'
    }
  };

  // Add greeting_configs if greeting message is provided and mode is not single_every
  if (config.greeting_message && greetingMode !== 'single_every') {
    config.greeting_configs = {
      mode: greetingMode
    };
  }

  // Add optional vendor-specific fields
  if (process.env.LLM_BASE_URL) config.base_url = process.env.LLM_BASE_URL;
  if (process.env.LLM_ACCESS_KEY) config.access_key = process.env.LLM_ACCESS_KEY;
  if (process.env.LLM_SECRET) config.secret = process.env.LLM_SECRET;
  if (process.env.LLM_HEADERS) config.headers = process.env.LLM_HEADERS;
  if (vendor && vendor !== 'openai') config.vendor = vendor;

  return config;
}

function buildTTSConfig() {
  const vendor = process.env.TTS_VENDOR || 'microsoft';
  const config = { vendor };

  switch (vendor) {
    case 'microsoft':
      config.params = {
        key: process.env.MICROSOFT_TTS_KEY,
        region: process.env.MICROSOFT_TTS_REGION || 'eastus',
        voice_name: process.env.MICROSOFT_TTS_VOICE || 'en-US-JennyNeural',
        speed: 1.3,
        sample_rate: parseInt(process.env.MICROSOFT_TTS_SAMPLE_RATE || '24000', 10)
      };
      if (process.env.MICROSOFT_TTS_RATE) config.params.rate = parseFloat(process.env.MICROSOFT_TTS_RATE);
      if (process.env.MICROSOFT_TTS_VOLUME) config.params.volume = parseInt(process.env.MICROSOFT_TTS_VOLUME, 10);
      break;

    case 'elevenlabs':
      config.params = {
        key: process.env.ELEVENLABS_TTS_KEY,
        model_id: process.env.ELEVENLABS_MODEL_ID || 'eleven_turbo_v2_5',
        voice_id: process.env.ELEVENLABS_VOICE_ID
      };
      if (process.env.ELEVENLABS_BASE_URL) config.params.base_url = process.env.ELEVENLABS_BASE_URL;
      if (process.env.ELEVENLABS_STABILITY) config.params.stability = parseFloat(process.env.ELEVENLABS_STABILITY);
      if (process.env.ELEVENLABS_SIMILARITY_BOOST) config.params.similarity_boost = parseFloat(process.env.ELEVENLABS_SIMILARITY_BOOST);
      if (process.env.ELEVENLABS_STYLE) config.params.style = parseFloat(process.env.ELEVENLABS_STYLE);
      if (process.env.ELEVENLABS_USE_SPEAKER_BOOST === 'true') config.params.use_speaker_boost = true;
      break;

    case 'openai':
      config.params = {
        api_key: process.env.OPENAI_TTS_KEY,
        model: process.env.OPENAI_TTS_MODEL || 'tts-1',
        voice: process.env.OPENAI_TTS_VOICE || 'alloy'
      };
      if (process.env.OPENAI_TTS_BASE_URL) config.params.base_url = process.env.OPENAI_TTS_BASE_URL;
      if (process.env.OPENAI_TTS_SPEED) config.params.speed = parseFloat(process.env.OPENAI_TTS_SPEED);
      break;

    case 'cartesia':
      config.params = {
        api_key: process.env.CARTESIA_TTS_KEY,
        model_id: process.env.CARTESIA_MODEL_ID || 'sonic-english',
        voice: {
          mode: 'id',
          id: process.env.CARTESIA_VOICE_ID
        }
      };
      break;

    case 'google':
      config.params = {
        credentials: process.env.GOOGLE_TTS_CREDENTIALS,
        VoiceSelectionParams: {
          name: process.env.GOOGLE_TTS_VOICE_NAME
        }
      };
      const audioConfig = {};
      if (process.env.GOOGLE_TTS_SPEAKING_RATE) audioConfig.speaking_rate = parseFloat(process.env.GOOGLE_TTS_SPEAKING_RATE);
      if (process.env.GOOGLE_TTS_SAMPLE_RATE) audioConfig.sample_rate_hertz = parseInt(process.env.GOOGLE_TTS_SAMPLE_RATE, 10);
      if (Object.keys(audioConfig).length > 0) config.params.AudioConfig = audioConfig;
      break;

    case 'playht':
      config.params = {
        api_key: process.env.PLAYHT_TTS_KEY,
        user_id: process.env.PLAYHT_USER_ID,
        voice_engine: process.env.PLAYHT_VOICE_ENGINE || 'PlayHT2.0-turbo',
        voice: process.env.PLAYHT_VOICE
      };
      if (process.env.PLAYHT_SPEED) config.params.speed = parseFloat(process.env.PLAYHT_SPEED);
      break;

    case 'humeai':
      config.params = {
        key: process.env.HUMEAI_TTS_KEY,
        voice_id: process.env.HUMEAI_VOICE_ID,
        provider: process.env.HUMEAI_PROVIDER || 'HUME_AI'
      };
      if (process.env.HUMEAI_SPEED) config.params.speed = parseFloat(process.env.HUMEAI_SPEED);
      if (process.env.HUMEAI_TRAILING_SILENCE) config.params.trailing_silence = parseFloat(process.env.HUMEAI_TRAILING_SILENCE);
      break;

    case 'rime':
      config.params = {
        api_key: process.env.RIME_TTS_KEY,
        speaker: process.env.RIME_SPEAKER,
        modelId: process.env.RIME_MODEL_ID || 'mist'
      };
      break;

    case 'fishaudio':
      config.params = {
        api_key: process.env.FISHAUDIO_TTS_KEY,
        reference_id: process.env.FISHAUDIO_REFERENCE_ID,
        backend: process.env.FISHAUDIO_BACKEND || 'v1.1'
      };
      break;

    case 'groq':
      config.params = {
        api_key: process.env.GROQ_TTS_KEY,
        model: process.env.GROQ_TTS_MODEL,
        voice: process.env.GROQ_TTS_VOICE
      };
      break;

    case 'sarvam':
      config.params = {
        api_key: process.env.SARVAM_TTS_KEY,
        speaker: process.env.SARVAM_SPEAKER,
        language_code: process.env.SARVAM_LANGUAGE_CODE,
        model: process.env.SARVAM_MODEL || 'bulbul:v1'
      };
      break;

    default:
      throw new Error(`Unsupported TTS vendor: ${vendor}`);
  }

  return config;
}

function buildASRConfig() {
  const vendor = process.env.ASR_VENDOR || 'microsoft';
  const language = process.env.ASR_LANGUAGE || 'en-US';

  switch (vendor) {
    case 'ares':
      return {
        vendor: 'ares',
        language: language
      };

    case 'microsoft':
      const params = {
        key: process.env.MICROSOFT_ASR_KEY,
        region: process.env.MICROSOFT_ASR_REGION || 'eastus',
        language: language
      };
      if (process.env.MICROSOFT_ASR_PHRASE_LIST) {
        params.phrase_list = process.env.MICROSOFT_ASR_PHRASE_LIST.split(',').map(p => p.trim()).filter(p => p.length > 0);
      }
      return {
        vendor: 'microsoft',
        params: params
      };

    case 'deepgram':
      const deepgramParams = {
        url: process.env.DEEPGRAM_ASR_URL || 'https://api.deepgram.com/v1/listen',
        key: process.env.DEEPGRAM_ASR_KEY,
        language: language
      };
      if (process.env.DEEPGRAM_ASR_MODEL) deepgramParams.model = process.env.DEEPGRAM_ASR_MODEL;
      return {
        vendor: 'deepgram',
        params: deepgramParams
      };

    case 'openai':
      return {
        vendor: 'openai',
        params: {
          api_key: process.env.OPENAI_ASR_KEY
        },
        language: language
      };

    case 'speechmatics':
      return {
        vendor: 'speechmatics',
        params: {
          api_key: process.env.SPEECHMATICS_ASR_KEY,
          language: process.env.SPEECHMATICS_ASR_LANGUAGE || 'en'
        }
      };

    case 'assemblyai':
      return {
        vendor: 'assemblyai',
        params: {
          api_key: process.env.ASSEMBLYAI_ASR_KEY,
          language: process.env.ASSEMBLYAI_ASR_LANGUAGE || 'en_us'
        }
      };

    default:
      throw new Error(`Unsupported ASR vendor: ${vendor}`);
  }
}

// Main handler
exports.handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { action, channelName, agentId, agentConfig: clientConfig } = JSON.parse(event.body);

    const appId = process.env.AGORA_APP_ID;
    const customerId = process.env.AGORA_CUSTOMER_ID;
    const customerSecret = process.env.AGORA_CUSTOMER_SECRET;
    const apiUrl = process.env.CONVOAI_API_URL || 'https://api.agora.io/api/conversational-ai-agent/v2';

    // Validate Agora credentials
    if (!appId || !customerId || !customerSecret) {
      console.error('Missing Agora credentials:', { 
        hasAppId: !!appId, 
        hasCustomerId: !!customerId, 
        hasCustomerSecret: !!customerSecret 
      });
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Server configuration error: Missing Agora credentials' }),
      };
    }
    
    // Validate ConvoAI API keys
    const llmApiKey = process.env.LLM_API_KEY;
    const ttsKey = process.env.MICROSOFT_TTS_KEY;
    const asrKey = process.env.MICROSOFT_ASR_KEY;
    
    if (!llmApiKey) {
      console.error('Missing LLM_API_KEY environment variable');
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Server configuration error: Missing LLM_API_KEY' }),
      };
    }
    
    if (process.env.TTS_VENDOR === 'microsoft' || !process.env.TTS_VENDOR) {
      if (!ttsKey) {
        console.error('Missing MICROSOFT_TTS_KEY environment variable');
        return {
          statusCode: 500,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ error: 'Server configuration error: Missing MICROSOFT_TTS_KEY' }),
        };
      }
    }
    
    if (process.env.ASR_VENDOR === 'microsoft' || !process.env.ASR_VENDOR) {
      if (!asrKey) {
        console.error('Missing MICROSOFT_ASR_KEY environment variable');
        return {
          statusCode: 500,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ error: 'Server configuration error: Missing MICROSOFT_ASR_KEY' }),
        };
      }
    }
    
    console.log('Environment variables validated:', {
      hasLLMKey: !!llmApiKey,
      hasTTSKey: !!ttsKey,
      hasASRKey: !!asrKey,
      llmVendor: process.env.LLM_VENDOR || 'openai',
      ttsVendor: process.env.TTS_VENDOR || 'microsoft',
      asrVendor: process.env.ASR_VENDOR || 'microsoft'
    });

    const authHeader = 'Basic ' + Buffer.from(`${customerId}:${customerSecret}`).toString('base64');

    let url, method, body;

    switch (action) {
      case 'start':
        url = `${apiUrl}/projects/${appId}/join`;
        method = 'POST';
        
        try {
          // Parse remote_rtc_uids from env
          let remoteRtcUids = ['*'];
          if (process.env.AGENT_REMOTE_RTC_UIDS) {
            const uidsStr = process.env.AGENT_REMOTE_RTC_UIDS.trim();
            if (uidsStr === '*') {
              remoteRtcUids = ['*'];
            } else {
              remoteRtcUids = uidsStr.split(',').map(uid => uid.trim());
            }
          }
          
          // Determine agent UID and channel
          const agentChannel = clientConfig?.properties?.channel || channelName;
          const agentRtcUid = clientConfig?.properties?.agent_rtc_uid || Math.floor(Math.random() * 1000000);
          const agentRtmUid = clientConfig?.properties?.agent_rtm_uid || agentRtcUid;
          
          // Generate unified 007 token for the agent
          const agentToken = await generateAgentToken(agentChannel, agentRtcUid);
          
          console.log('Agent 007 token generated:', {
            channel: agentChannel,
            rtcUid: agentRtcUid,
            rtmUid: agentRtmUid,
            hasToken: !!agentToken,
            tokenPrefix: agentToken ? agentToken.substring(0, 3) : 'N/A'
          });
          
          // Build complete agent config from environment variables
          const agentConfig = {
            name: clientConfig?.name || `bingo_caller_${Date.now()}`,
            properties: {
              channel: agentChannel,
              token: agentToken,
              agent_rtc_uid: agentRtcUid,
              remote_rtc_uids: remoteRtcUids,
              enable_string_uid: clientConfig?.properties?.enable_string_uid || false,
              idle_timeout: parseInt(process.env.AGENT_IDLE_TIMEOUT || '60', 10),
              agent_rtm_uid: agentRtmUid,
              advanced_features: {
                enable_rtm: true
              },
              asr: buildASRConfig(),
              llm: buildLLMConfig(),
              tts: buildTTSConfig(),
              parameters: {
                audio_scenario: process.env.AUDIO_SCENARIO || 'chorus',
                data_channel: 'rtm',
                enable_metrics: process.env.ENABLE_METRICS === 'true',
                enable_error_message: process.env.ENABLE_ERROR_MESSAGE === 'true',
                ...(process.env.ENABLE_TRANSCRIPT === 'true' ? {
                  transcript: {
                    enable: true
                  }
                } : {})
              }
            }
          };

          // CRITICAL: Verify keys are present before sending
          const hasLLMKey = agentConfig.properties.llm.api_key && agentConfig.properties.llm.api_key.length > 0;
          const hasTTSKey = agentConfig.properties.tts.params.key && agentConfig.properties.tts.params.key.length > 0;
          const hasASRKey = agentConfig.properties.asr.params?.key && agentConfig.properties.asr.params.key.length > 0;
          
          console.log('🔑 API Keys Check:', {
            LLM: hasLLMKey ? `✅ (${agentConfig.properties.llm.api_key.substring(0, 8)}...)` : '❌ MISSING',
            TTS: hasTTSKey ? `✅ (${agentConfig.properties.tts.params.key.substring(0, 8)}...)` : '❌ MISSING',
            ASR: hasASRKey ? `✅ (${agentConfig.properties.asr.params.key.substring(0, 8)}...)` : '❌ MISSING (or ARES)'
          });
          
          if (!hasLLMKey) {
            throw new Error('LLM API key is missing from configuration!');
          }
          if (agentConfig.properties.tts.vendor === 'microsoft' && !hasTTSKey) {
            throw new Error('Microsoft TTS key is missing from configuration!');
          }
          if (agentConfig.properties.asr.vendor === 'microsoft' && !hasASRKey) {
            throw new Error('Microsoft ASR key is missing from configuration!');
          }
          
          body = JSON.stringify(agentConfig);
          
          // Log full request details for debugging
          console.log('==================== ConvoAI Start Request ====================');
          console.log('URL:', url);
          console.log('Method:', method);
          console.log('Headers:', JSON.stringify({
            'Content-Type': 'application/json',
            'Authorization': 'Basic [REDACTED]'
          }, null, 2));
          console.log('Body (Full Agent Config):');
          console.log(JSON.stringify(agentConfig, null, 2));
          console.log('===============================================================');
        } catch (configError) {
          console.error('Error building agent config:', configError);
          return {
            statusCode: 500,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              error: 'Configuration error: ' + configError.message,
              details: configError.stack
            }),
          };
        }
        break;

      case 'stop':
        if (!agentId) {
          throw new Error('agentId is required for stop action');
        }
        url = `${apiUrl}/projects/${appId}/agents/${agentId}/leave`;
        method = 'POST';
        body = JSON.stringify({});
        break;

      case 'query':
        if (!agentId) {
          throw new Error('agentId is required for query action');
        }
        url = `${apiUrl}/projects/${appId}/agents/${agentId}`;
        method = 'GET';
        break;

      default:
        throw new Error('Invalid action. Must be start, stop, or query');
    }

    const fetchOptions = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
    };

    if (body && method !== 'GET') {
      fetchOptions.body = body;
    }

    console.log('ConvoAI Request:', { action, url, method });

    const response = await fetch(url, fetchOptions);
    const responseText = await response.text();
    
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { message: responseText };
    }

    console.log('ConvoAI Response:', { status: response.status, data: responseData });

    return {
      statusCode: response.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(responseData),
    };
  } catch (error) {
    console.error('ConvoAI agent error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        error: error.message,
        stack: error.stack
      }),
    };
  }
};
