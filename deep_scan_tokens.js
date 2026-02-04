// Deep Scan for Solana Fresh Tokens
// Searches for tokens with recent activity

const axios = require('axios');

async function deepScanTokens() {
  console.log('Starting deep scan for Solana tokens...');
  
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
    
    // Search terms for recent activity
    const searchTerms = ['TRUMP', 'AI', 'CAT'];
    
    // Collect all results
    let allPairs = [];
    
    console.log('Deep scanning with recent activity terms...');
    
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
    
    // Basic cleaning: keep only Solana tokens
    const solanaPairs = allPairs.filter(pair => pair.chainId === 'solana');
    
    console.log(`Filtered to ${solanaPairs.length} Solana pairs...`);
    
    // Remove duplicates based on pair address
    const uniquePairsMap = new Map();
    for (const pair of solanaPairs) {
      if (!uniquePairsMap.has(pair.pairAddress)) {
        uniquePairsMap.set(pair.pairAddress, pair);
      }
    }
    const uniquePairs = Array.from(uniquePairsMap.values());
    
    console.log(`Removed duplicates, now ${uniquePairs.length} unique pairs...`);
    
    // Calculate time thresholds
    const now = Date.now();
    const twentyFourHoursAgo = now - (24 * 60 * 60 * 1000);
    
    // Apply filters based on recent activity
    const filteredPairs = uniquePairs.filter(pair => {
      // Check if created in last 24 hours
      const createdAt = pair.pairCreatedAt;
      if (!createdAt || createdAt < twentyFourHoursAgo) {
        return false;
      }
      
      // Check liquidity is greater than $500
      if (!pair.liquidity || !pair.liquidity.usd || pair.liquidity.usd <= 500) {
        return false;
      }
      
      // Check 24 hour volume is greater than $1,000
      if (!pair.volume || !pair.volume.h24 || pair.volume.h24 <= 1000) {
        return false;
      }
      
      return true;
    });
    
    console.log(`Filtered to ${filteredPairs.length} pairs after applying filters...`);
    
    // Sort by creation time (newest first)
    const sortedPairs = filteredPairs.sort((a, b) => b.pairCreatedAt - a.pairCreatedAt);
    
    // Take top results (without padding with placeholders)
    const topPairs = sortedPairs.slice(0, 10);
    
    if (topPairs.length === 0) {
      console.log('没有符合条件的币');
      return;
    }
    
    // Generate markdown table
    console.log('\n| 币名/代码 | ⏱️创建时间 | 💰价格 | 💧流动性 | 📊24h交易量 | 🏠合约尾号 |');
    console.log('|-----------|-----------|--------|----------|------------|------------|');
    
    for (const pair of topPairs) {
      // Calculate age in hours
      const createdAt = pair.pairCreatedAt;
      const ageInHours = Math.floor((now - createdAt) / (1000 * 60 * 60));
      
      const tokenName = pair.baseToken?.symbol || pair.baseToken?.name || 'Unknown';
      const price = pair.priceUsd ? parseFloat(pair.priceUsd).toFixed(6) : 'N/A';
      const liquidity = pair.liquidity?.usd ? `$${(pair.liquidity.usd / 1000).toFixed(1)}K` : 'N/A';
      const volume = pair.volume?.h24 ? `$${(pair.volume.h24 / 1000).toFixed(1)}K` : 'N/A';
      const contractAddr = pair.baseToken?.address ? pair.baseToken.address.slice(-6) : 'N/A';
      
      console.log(`| ${tokenName} | ${ageInHours}小时前 | $${price} | ${liquidity} | ${volume} | ${contractAddr} |`);
    }
    
    console.log('\nDeep scan completed.');
    
  } catch (error) {
    console.error('Error during deep scan:', error.message);
    
    // Check if it's a specific error type
    if (error.response) {
      console.log(`Response status: ${error.response.status}`);
      console.log(`Response data: ${JSON.stringify(error.response.data)}`);
    } else if (error.request) {
      console.log('No response received from server');
    }
  }
}

// Run the deep scanner
deepScanTokens();