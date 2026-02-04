// Broad Net Scanner for Solana
// Wide net casting to catch as many tokens as possible

const axios = require('axios');

async function broadNetScan() {
  console.log('Starting broad net scan for Solana...');
  
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
    
    // Search terms for wide net
    const searchTerms = ['SOL', 'PUMP', 'MOON', 'MEME', 'CAT'];
    
    // Collect all results
    let allPairs = [];
    
    console.log('Casting wide net with multiple keywords...');
    
    // Concurrently search for all terms
    const searchPromises = searchTerms.map(term => {
      return axios.get(`https://api.dexscreener.com/latest/dex/search?q=${term}`, {
        headers: headers,
        timeout: 10000
      }).catch(err => {
        console.log(`Error searching for ${term}: ${err.message}`);
        return { data: { pairs: [] } };
      });
    });
    
    const responses = await Promise.all(searchPromises);
    
    // Merge all results
    for (const response of responses) {
      if (response.data && response.data.pairs) {
        allPairs = allPairs.concat(response.data.pairs);
      }
    }
    
    console.log(`Collected ${allPairs.length} total pairs before cleaning...`);
    
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
    const fortyEightHoursAgo = now - (48 * 60 * 60 * 1000);
    
    // Loose filtering
    const filteredPairs = uniquePairs.filter(pair => {
      // Check if created in last 48 hours (relaxed time constraint)
      const createdAt = pair.pairCreatedAt;
      if (!createdAt || createdAt < fortyEightHoursAgo) {
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
    
    console.log(`Filtered to ${filteredPairs.length} pairs after loose filtering...`);
    
    // Sort by creation time (newest first)
    const sortedPairs = filteredPairs.sort((a, b) => b.pairCreatedAt - a.pairCreatedAt);
    
    // Take top 10 (or all if less than 10)
    const topPairs = sortedPairs.slice(0, 10);
    
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
    
    // If we have fewer than 10, add placeholders to fill the table
    if (topPairs.length < 10) {
      for (let i = topPairs.length; i < 10; i++) {
        console.log(`| Placeholder ${i+1} | - | - | - | - | - |`);
      }
    }
    
    console.log('\nBroad net scan completed.');
    
  } catch (error) {
    console.error('Error during broad net scan:', error.message);
    
    // Check if it's a specific error type
    if (error.response) {
      console.log(`Response status: ${error.response.status}`);
      console.log(`Response data: ${JSON.stringify(error.response.data)}`);
    } else if (error.request) {
      console.log('No response received from server');
    }
  }
}

// Run the broad net scanner
broadNetScan();