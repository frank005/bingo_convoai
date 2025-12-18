// Use AccessToken2 for 007 token generation (from convo_ai demo)
const { RtcTokenBuilder, Role: RtcRole } = require('./RtcTokenBuilder2.js');

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
    const { channelName, uid, role = 'publisher' } = JSON.parse(event.body);

    if (!channelName || !uid) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'channelName and uid are required' }),
      };
    }

    const appId = process.env.AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;

    if (!appId || !appCertificate) {
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Server configuration error' }),
      };
    }

    const validitySeconds = parseInt(process.env.BINGO_TOKEN_VALIDITY_SECONDS) || 3600;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const tokenExpire = currentTimestamp + validitySeconds;
    const privilegeExpire = 0; // 0 means same as tokenExpire

    // Generate unified 007 token with RTC+RTM using AccessToken2
    const rtcRole = role === 'publisher' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;
    const token = await RtcTokenBuilder.buildTokenWithRtm(
      appId,
      appCertificate,
      channelName,
      uid.toString(),
      rtcRole,
      tokenExpire,
      privilegeExpire
    );

    console.log(`Generated unified 007 token for user ${uid} in channel ${channelName}`);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        rtcToken: token,
        rtmToken: token, // Same token for both
        token: token,    // Unified token
        uid,
        channelName,
        expiresAt: tokenExpire,
        validitySeconds
      }),
    };
  } catch (error) {
    console.error('Token generation error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: error.message }),
    };
  }
};

