// List active Agora channels (for game discovery)
exports.handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'GET') {
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
    const appId = process.env.AGORA_APP_ID;
    const customerId = process.env.AGORA_CUSTOMER_ID;
    const customerSecret = process.env.AGORA_CUSTOMER_SECRET;

    if (!appId || !customerId || !customerSecret) {
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Server configuration error' }),
      };
    }

    // Get query parameters for pagination
    const pageNo = parseInt(event.queryStringParameters?.page_no) || 0;
    const pageSize = parseInt(event.queryStringParameters?.page_size) || 100;

    // Construct Authorization header
    const authHeader = 'Basic ' + Buffer.from(`${customerId}:${customerSecret}`).toString('base64');

    // Query Agora Channel Management API
    const url = `https://api.sd-rtn.com/dev/v1/channel/${appId}?page_no=${pageNo}&page_size=${pageSize}`;
    
    console.log('Querying channels:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': authHeader,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Agora API error:', response.status, errorText);
      throw new Error(`Failed to query channels: ${response.status}`);
    }

    const data = await response.json();

    // Filter for bingo channels only
    let bingoChannels = [];
    if (data.success && data.data && data.data.channels) {
      bingoChannels = data.data.channels
        .filter(channel => channel.channel_name && channel.channel_name.startsWith('bingo_'))
        .filter(channel => channel.user_count > 0 && channel.user_count < 10) // Only show games with less than 10 players
        .map(channel => ({
          gameId: channel.channel_name.replace('bingo_', ''),
          channelName: channel.channel_name,
          userCount: channel.user_count,
          status: channel.user_count < 10 ? 'waiting' : 'full'
        }));
    }

    console.log(`Found ${bingoChannels.length} available bingo games`);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate', // Don't cache game list
      },
      body: JSON.stringify({
        success: true,
        games: bingoChannels,
        total: bingoChannels.length
      }),
    };
  } catch (error) {
    console.error('Channel list error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        error: error.message,
        success: false 
      }),
    };
  }
};

