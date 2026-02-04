// Solana Token Scanner via DexScreener API
// Direct HTTP request to avoid browser-based blocking

const axios = require('axios');

async function apiScanSolana() {
  console.log('Starting Solana token scan via DexScreener API...');
  
  try {
    // Set headers to mimic a real browser
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Referer': 'https://dexscreener.com/'
    };
    
    // Make request to DexScreener API
    console.log('Requesting data from DexScreener API...');
    const response = await axios.get('https://api.dexscreener.com/latest/dex/search?q=solana', {
      headers: headers,
      timeout: 15000 // 15 second timeout
    });
    
    console.log('Data received from API');
    
    // Parse the response data
    const data = response.data;
    
    if (!data || !data.pairs) {
      console.log('No pairs data found in response');
      return;
    }
    
    // Get the first 5 pairs
    const pairs = data.pairs.slice(0, 5);
    
    // Format and print the data as requested
    console.log('\nPlaintext');
    console.log('=== Solana Top 5 Scan ===');
    
    for (let i = 0; i < pairs.length; i++) {
      const pair = pairs[i];
      
      // Extract token info
      const tokenName = pair.baseToken?.name || pair.baseToken?.symbol || 'Unknown';
      const tokenSymbol = pair.baseToken?.symbol || 'TOKEN';
      const price = pair.priceUsd ? parseFloat(pair.priceUsd).toFixed(8) : 'N/A';
      const change24h = pair.info?.priceChangePercentage?.h24 ? 
                       `${parseFloat(pair.info.priceChangePercentage.h24).toFixed(2)}%` : 
                       'N/A';
      const liquidity = pair.liquidity?.usd ? 
                       `$${Math.round(pair.liquidity.usd).toLocaleString()}` : 
                       'N/A';
      const volume24h = pair.volume?.h24 ? 
                       `$${Math.round(pair.volume.h24).toLocaleString()}` : 
                       'N/A';
      
      console.log(`${i + 1}. ${tokenName} (${tokenSymbol}) - 价格: $${price} - 24h涨幅: ${change24h} - 流动性: ${liquidity} - 交易量(24h): ${volume24h}`);
      console.log('-------------------------');
    }
    
    // Find the token with highest 24h gain for simple AI comment
    if (pairs.length > 0) {
      let highestGain = -Infinity;
      let highestGainPair = null;
      
      for (const pair of pairs) {
        const change24h = pair.info?.priceChangePercentage?.h24 ? 
                         parseFloat(pair.info.priceChangePercentage.h24) : 
                         0;
        
        if (change24h > highestGain) {
          highestGain = change24h;
          highestGainPair = pair;
        }
      }
      
      if (highestGainPair) {
        const tokenSymbol = highestGainPair.baseToken?.symbol || 'TOKEN';
        console.log(`\nAI简评: ${tokenSymbol} 表现最为突出，24小时涨幅达到 ${highestGain.toFixed(2)}%，值得关注其上涨动力。`);
      } else {
        console.log('\nAI简评: 当前列表中未发现明显涨幅领先的代币。');
      }
    }
    
    console.log('\nAPI scan completed.');
    
  } catch (error) {
    console.error('Error during API scan:', error.message);
    
    // Check if it's a specific error type
    if (error.response) {
      console.log(`Response status: ${error.response.status}`);
      console.log(`Response data: ${JSON.stringify(error.response.data)}`);
    } else if (error.request) {
      console.log('No response received from server');
    }
  }
}

// Run the API scanner
apiScanSolana();