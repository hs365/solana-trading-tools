// Advanced Solana Alpha Scanner
// Searches for potential gems on Solana chain

const axios = require('axios');

async function scanAlphaGems() {
  console.log('Starting advanced alpha scan for Solana gems...');
  
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
    
    // Get data from DexScreener API
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
    
    // Get the first 60 pairs
    const pairs = data.pairs.slice(0, 60);
    console.log(`Analyzing ${pairs.length} pairs for potential gems...`);
    
    // Smart filtering: Apply all conditions
    const filteredGems = pairs.filter(pair => {
      // Check if chain is Solana
      if (pair.chainId !== 'solana') return false;
      
      // Check liquidity (must be > $10,000)
      if (!pair.liquidity || pair.liquidity.usd <= 10000) return false;
      
      // Check FDV (must be < $5,000,000)
      if (!pair.fdv || pair.fdv >= 5000000) return false;
      
      // Check 1 hour change (must be > 10%)
      if (!pair.priceChange || !pair.priceChange.h1 || pair.priceChange.h1 <= 10) return false;
      
      // Check 24 hour volume (must be > $100,000)
      if (!pair.volume || !pair.volume.h24 || pair.volume.h24 <= 100000) return false;
      
      return true;
    });
    
    console.log(`Found ${filteredGems.length} potential gems after filtering...`);
    
    // Sort by 1 hour change in descending order
    const sortedGems = filteredGems.sort((a, b) => (b.priceChange?.h1 || 0) - (a.priceChange?.h1 || 0));
    
    // Take only top 3
    const topGems = sortedGems.slice(0, 3);
    
    if (topGems.length === 0) {
      console.log('Plaintext');
      console.log('🔍 Alpha Hunter / 暂无符合策略的目标');
      return;
    }
    
    // Print results in "shout order" style
    console.log('\nPlaintext');
    console.log('🚀 Alpha Hunter / 发现潜在金狗');
    console.log('---------------------------------');
    
    for (let i = 0; i < topGems.length; i++) {
      const gem = topGems[i];
      
      const tokenName = gem.baseToken?.name || gem.baseToken?.symbol || 'Unknown';
      const tokenSymbol = gem.baseToken?.symbol || 'TOKEN';
      const priceChange1h = gem.priceChange?.h1 ? 
                           `${parseFloat(gem.priceChange.h1).toFixed(2)}%` : 
                           'N/A';
      const fdv = gem.fdv ? 
                 `$${(gem.fdv / 1000000).toFixed(2)} M` : 
                 'N/A';
      const liquidity = gem.liquidity?.usd ? 
                       `$${(gem.liquidity.usd / 1000).toFixed(1)} K` : 
                       'N/A';
      
      // Determine comment based on 1 hour change
      let comment = '';
      if (gem.priceChange?.h1 && gem.priceChange.h1 > 50) {
        comment = '正在暴力拉升！';
      } else {
        comment = '温和上涨中';
      }
      
      console.log(`${i + 1}. ${tokenName} ($${tokenSymbol}) 🔥`);
      console.log(`   1H 爆发: +${priceChange1h}`);
      console.log(`   💰 市值: ${fdv} (低市值!)`);
      console.log(`   🌊 池子: ${liquidity}`);
      console.log(`   👀 评语: ${comment}`);
      
      if (i < topGems.length - 1) {
        console.log('---------------------------------');
      }
    }
    
    console.log('\nAlpha scan completed.');
    
  } catch (error) {
    console.error('Error during alpha scan:', error.message);
    
    // Check if it's a specific error type
    if (error.response) {
      console.log(`Response status: ${error.response.status}`);
      console.log(`Response data: ${JSON.stringify(error.response.data)}`);
    } else if (error.request) {
      console.log('No response received from server');
    }
  }
}

// Run the alpha scanner
scanAlphaGems();