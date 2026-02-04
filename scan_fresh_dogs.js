// Fresh Dogs Scanner for Solana
// Searches for newly launched tokens on Solana chain

const axios = require('axios');

async function scanFreshDogs() {
  console.log('Starting fresh dogs scan for Solana...');
  
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
    
    // Search terms for fresh dogs
    const searchTerms = ['PUMP', 'MOON', 'PEPE', 'DOGE', 'CAT', 'SOL', 'MEME', 'AI'];
    
    // Collect all results
    let allPairs = [];
    
    console.log('Searching for fresh dogs with multiple keywords...');
    
    // Search for each term
    for (const term of searchTerms) {
      console.log(`Searching for: ${term}`);
      try {
        const response = await axios.get(`https://api.dexscreener.com/latest/dex/search?q=${term}`, {
          headers: headers,
          timeout: 10000
        });
        
        if (response.data && response.data.pairs) {
          allPairs = allPairs.concat(response.data.pairs);
        }
      } catch (err) {
        console.log(`Error searching for ${term}: ${err.message}`);
      }
      
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log(`Collected ${allPairs.length} total pairs, applying filters...`);
    
    // Calculate 24 hours ago in milliseconds
    const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
    
    // Filter for fresh dogs based on criteria
    const freshDogs = allPairs.filter(pair => {
      // Check if pair was created in the last 24 hours
      const createdAt = pair.pairCreatedAt;
      if (!createdAt || createdAt < twentyFourHoursAgo) {
        return false;
      }
      
      // Check FDV is less than $500,000
      if (!pair.fdv || pair.fdv >= 500000) {
        return false;
      }
      
      // Check liquidity is greater than $2,000
      if (!pair.liquidity || !pair.liquidity.usd || pair.liquidity.usd <= 2000) {
        return false;
      }
      
      // Check 24 hour volume is greater than $10,000
      if (!pair.volume || !pair.volume.h24 || pair.volume.h24 <= 10000) {
        return false;
      }
      
      // Ensure it's on Solana
      if (pair.chainId !== 'solana') {
        return false;
      }
      
      return true;
    });
    
    console.log(`Filtered to ${freshDogs.length} potential fresh dogs...`);
    
    // Sort by 24 hour volume in descending order
    const sortedDogs = freshDogs.sort((a, b) => (b.volume?.h24 || 0) - (a.volume?.h24 || 0));
    
    // Take only top 10
    const topDogs = sortedDogs.slice(0, 10);
    
    if (topDogs.length === 0) {
      console.log('暂无新狗');
      return;
    }
    
    // Generate markdown table
    console.log('\n| 币名 | 价格 | ⚠️出生时长(Age) | 💰市值(FDV) | 💧池子(Liq) | 📈交易量 |');
    console.log('|------|------|----------------|------------|-----------|----------|');
    
    for (const dog of topDogs) {
      // Calculate age in hours
      const createdAt = dog.pairCreatedAt;
      const ageInHours = Math.floor((Date.now() - createdAt) / (1000 * 60 * 60));
      
      const tokenName = dog.baseToken?.symbol || dog.baseToken?.name || 'Unknown';
      const price = dog.priceUsd ? parseFloat(dog.priceUsd).toFixed(6) : 'N/A';
      const fdv = dog.fdv ? `$${(dog.fdv / 1000).toFixed(1)}K` : 'N/A';
      const liquidity = dog.liquidity?.usd ? `$${(dog.liquidity.usd / 1000).toFixed(1)}K` : 'N/A';
      const volume = dog.volume?.h24 ? `$${(dog.volume.h24 / 1000).toFixed(1)}K` : 'N/A';
      
      console.log(`| ${tokenName} | $${price} | ${ageInHours}小时前 | ${fdv} | ${liquidity} | ${volume} |`);
    }
    
    console.log('\nFresh dogs scan completed.');
    
  } catch (error) {
    console.error('Error during fresh dogs scan:', error.message);
    
    // Check if it's a specific error type
    if (error.response) {
      console.log(`Response status: ${error.response.status}`);
      console.log(`Response data: ${JSON.stringify(error.response.data)}`);
    } else if (error.request) {
      console.log('No response received from server');
    }
  }
}

// Run the fresh dogs scanner
scanFreshDogs();