const claudeService = require('./claudeService');

class CategorizationService {
  constructor() {
    this.categories = this.initializeCategories();
    this.merchantDatabase = new Map();
    this.userPatterns = new Map(); // Store user-specific categorization patterns
    this.confidence_threshold = 0.7;
  }

  // Initialize standard categories with keywords and patterns
  initializeCategories() {
    return {
      'food': {
        keywords: [
          // Restaurants & Dining
          'restaurant', 'hotel', 'cafe', 'coffee', 'dining', 'bar', 'pub', 'dhaba',
          'food court', 'canteen', 'mess', 'tiffin', 'bakery', 'sweet', 'mithai',
          // Food Delivery
          'zomato', 'swiggy', 'uber eats', 'food panda', 'dominos', 'pizza hut',
          'kfc', 'mcdonald', 'burger king', 'subway', 'starbucks',
          // Food Keywords
          'biryani', 'pizza', 'burger', 'chinese', 'north indian', 'south indian'
        ],
        patterns: [
          /restaurant|hotel.*dining|cafe|coffee/i,
          /zomato|swiggy|uber.*eats|food.*panda/i,
          /dominos|pizza.*hut|kfc|mcdonald|burger.*king/i
        ],
        priority: 1
      },
      
      'fuel': {
        keywords: [
          // Fuel Stations
          'petrol', 'diesel', 'fuel', 'gas', 'station', 'pump',
          // Indian Oil Companies
          'iocl', 'indian oil', 'bharat petroleum', 'bpcl', 'hindustan petroleum', 
          'hpcl', 'reliance petroleum', 'shell', 'total', 'essar oil'
        ],
        patterns: [
          /petrol|diesel|fuel|gas.*station/i,
          /indian.*oil|bharat.*petroleum|hindustan.*petroleum/i,
          /iocl|bpcl|hpcl|shell|essar/i
        ],
        priority: 1
      },
      
      'grocery': {
        keywords: [
          // Supermarkets & Grocery Stores
          'grocery', 'supermarket', 'hypermarket', 'store', 'mart', 'bazaar',
          'big bazaar', 'dmart', 'reliance fresh', 'more', 'spencer', 'foodworld',
          'star bazaar', 'easyday', 'nilgiris', 'nature\'s basket', 'godrej nature\'s basket',
          // Online Grocery
          'bigbasket', 'grofers', 'amazon fresh', 'dunzo'
        ],
        patterns: [
          /grocery|supermarket|hypermarket/i,
          /big.*bazaar|dmart|reliance.*fresh|spencer/i,
          /bigbasket|grofers|amazon.*fresh/i
        ],
        priority: 1
      },
      
      'shopping': {
        keywords: [
          // E-commerce
          'amazon', 'flipkart', 'myntra', 'ajio', 'nykaa', 'jabong', 'koovs',
          'tata cliq', 'snapdeal', 'paytm mall', 'shopclues',
          // Shopping Malls & Stores
          'mall', 'shopping', 'store', 'showroom', 'outlet', 'brand factory',
          'lifestyle', 'westside', 'pantaloons', 'central', 'shoppers stop',
          // Fashion & Apparel
          'fashion', 'clothing', 'apparel', 'shoes', 'accessories'
        ],
        patterns: [
          /amazon|flipkart|myntra|ajio|nykaa/i,
          /mall|shopping.*center|brand.*factory/i,
          /lifestyle|westside|pantaloons|shoppers.*stop/i
        ],
        priority: 1
      },
      
      'travel': {
        keywords: [
          // Transportation
          'uber', 'ola', 'taxi', 'cab', 'auto', 'rickshaw', 'metro', 'bus',
          'train', 'railway', 'irctc', 'flight', 'airline', 'airport',
          // Travel Booking
          'makemytrip', 'goibibo', 'cleartrip', 'yatra', 'booking.com', 'agoda',
          'oyo', 'treebo', 'fabhotels', 'zostel',
          // Airlines
          'indigo', 'spicejet', 'air india', 'vistara', 'go air', 'air asia'
        ],
        patterns: [
          /uber|ola|taxi|cab|metro|bus|train/i,
          /makemytrip|goibibo|cleartrip|yatra|booking\.com/i,
          /indigo|spicejet|air.*india|vistara|go.*air/i
        ],
        priority: 1
      },
      
      'entertainment': {
        keywords: [
          // Streaming & Digital
          'netflix', 'amazon prime', 'disney hotstar', 'zee5', 'sonyliv', 'voot',
          'spotify', 'gaana', 'jio saavn', 'youtube premium',
          // Cinema & Events
          'movie', 'cinema', 'multiplex', 'pvr', 'inox', 'big cinema', 'carnival',
          'bookmyshow', 'paytm movies', 'concert', 'show', 'event'
        ],
        patterns: [
          /netflix|amazon.*prime|disney.*hotstar|zee5/i,
          /movie|cinema|pvr|inox|bookmyshow/i,
          /spotify|gaana|jio.*saavn/i
        ],
        priority: 1
      },
      
      'utilities': {
        keywords: [
          // Electricity & Water
          'electricity', 'power', 'electric', 'mseb', 'bescom', 'kseb', 'tneb',
          'water', 'bwssb', 'dwssb',
          // Telecom
          'mobile', 'phone', 'recharge', 'prepaid', 'postpaid', 'internet', 'broadband',
          'jio', 'airtel', 'vi', 'vodafone', 'idea', 'bsnl', 'mtnl',
          'act fibernet', 'hathway', 'tikona', 'spectranet'
        ],
        patterns: [
          /electricity|power|electric|mseb|bescom|kseb/i,
          /mobile|phone|recharge|internet|broadband/i,
          /jio|airtel|vodafone|idea|bsnl|act.*fibernet/i
        ],
        priority: 2
      },
      
      'medical': {
        keywords: [
          // Healthcare
          'hospital', 'clinic', 'medical', 'doctor', 'pharmacy', 'medicine',
          'apollo', 'fortis', 'max healthcare', 'manipal', 'narayana',
          'medplus', 'apollo pharmacy', '1mg', 'netmeds', 'practo'
        ],
        patterns: [
          /hospital|clinic|medical|doctor|pharmacy/i,
          /apollo|fortis|max.*healthcare|manipal/i,
          /medplus|1mg|netmeds|practo/i
        ],
        priority: 1
      },
      
      'atm': {
        keywords: ['atm', 'cash withdrawal', 'cash deposit', 'cdm'],
        patterns: [/atm|cash.*withdrawal|cash.*deposit/i],
        priority: 3
      },
      
      'transfer': {
        keywords: [
          'transfer', 'imps', 'neft', 'rtgs', 'upi', 'paytm', 'phonepe', 'googlepay',
          'bhim', 'amazon pay', 'mobikwik', 'freecharge', 'fund transfer'
        ],
        patterns: [
          /transfer|imps|neft|rtgs|upi/i,
          /paytm|phonepe|googlepay|bhim|amazon.*pay/i
        ],
        priority: 2
      },
      
      'insurance': {
        keywords: [
          'insurance', 'premium', 'policy', 'lic', 'icici prudential', 'hdfc life',
          'sbi life', 'bajaj allianz', 'star health', 'reliance general'
        ],
        patterns: [
          /insurance|premium|policy/i,
          /lic|icici.*prudential|hdfc.*life|sbi.*life/i
        ],
        priority: 1
      },
      
      'investment': {
        keywords: [
          'mutual fund', 'sip', 'investment', 'trading', 'zerodha', 'upstox',
          'groww', 'paytm money', 'kuvera', 'coin', 'angel broking'
        ],
        patterns: [
          /mutual.*fund|sip|investment|trading/i,
          /zerodha|upstox|groww|paytm.*money/i
        ],
        priority: 1
      },
      
      'others': {
        keywords: [],
        patterns: [],
        priority: 10 // Lowest priority - default fallback
      }
    };
  }

  // Categorize a single transaction
  async categorizeTransaction(transaction, userId = null) {
    const description = transaction.description.toLowerCase().trim();
    const amount = transaction.amount || 0;
    
    // Try rule-based categorization first
    const ruleBasedCategory = this.applyRuleBasedCategorization(description);
    
    if (ruleBasedCategory.confidence > this.confidence_threshold) {
      return {
        category: ruleBasedCategory.category,
        confidence: ruleBasedCategory.confidence,
        method: 'rule_based',
        details: ruleBasedCategory.details
      };
    }
    
    // Try merchant database lookup
    const merchantCategory = this.lookupMerchantDatabase(description);
    if (merchantCategory) {
      return {
        category: merchantCategory.category,
        confidence: merchantCategory.confidence,
        method: 'merchant_database',
        details: merchantCategory.details
      };
    }
    
    // Try user-specific patterns
    if (userId) {
      const userPatternCategory = this.applyUserPatterns(description, userId);
      if (userPatternCategory && userPatternCategory.confidence > this.confidence_threshold) {
        return {
          category: userPatternCategory.category,
          confidence: userPatternCategory.confidence,
          method: 'user_patterns',
          details: userPatternCategory.details
        };
      }
    }
    
    // Fallback to AI categorization for unclear cases
    try {
      const aiCategory = await this.getAICategorization(description, amount);
      if (aiCategory) {
        return {
          category: aiCategory.category,
          confidence: aiCategory.confidence,
          method: 'ai_powered',
          details: aiCategory.details
        };
      }
    } catch (error) {
      console.warn('AI categorization failed:', error.message);
    }
    
    // Final fallback
    return {
      category: 'others',
      confidence: 0.5,
      method: 'fallback',
      details: 'Could not determine category'
    };
  }

  // Rule-based categorization using keywords and patterns
  applyRuleBasedCategorization(description) {
    let bestMatch = { category: 'others', confidence: 0, details: null };
    
    for (const [category, config] of Object.entries(this.categories)) {
      let score = 0;
      let matchDetails = [];
      
      // Check keyword matches
      for (const keyword of config.keywords) {
        if (description.includes(keyword)) {
          score += 1.0;
          matchDetails.push(`Keyword: ${keyword}`);
        }
      }
      
      // Check pattern matches
      for (const pattern of config.patterns) {
        if (pattern.test(description)) {
          score += 1.5; // Patterns have higher weight
          matchDetails.push(`Pattern match`);
        }
      }
      
      // Adjust score based on priority (lower priority number = higher weight)
      const priorityWeight = 1 / (config.priority || 1);
      const finalScore = score * priorityWeight;
      
      if (finalScore > bestMatch.confidence) {
        bestMatch = {
          category,
          confidence: Math.min(finalScore * 0.3, 1.0), // Scale to 0-1
          details: matchDetails.join(', ')
        };
      }
    }
    
    return bestMatch;
  }

  // Lookup merchant in database
  lookupMerchantDatabase(description) {
    // Extract potential merchant name
    const merchant = this.extractMerchantName(description);
    
    if (this.merchantDatabase.has(merchant)) {
      const merchantData = this.merchantDatabase.get(merchant);
      return {
        category: merchantData.category,
        confidence: merchantData.confidence,
        details: `Merchant: ${merchant}`
      };
    }
    
    return null;
  }

  // Apply user-specific patterns
  applyUserPatterns(description, userId) {
    const userPatterns = this.userPatterns.get(userId) || [];
    
    for (const pattern of userPatterns) {
      if (pattern.regex.test(description)) {
        return {
          category: pattern.category,
          confidence: pattern.confidence,
          details: `User pattern: ${pattern.description}`
        };
      }
    }
    
    return null;
  }

  // AI-powered categorization using Claude
  async getAICategorization(description, amount) {
    try {
      const prompt = `Categorize this credit card transaction:

Description: "${description}"
Amount: ₹${amount}

Choose the most appropriate category from:
- food (restaurants, food delivery, dining)
- fuel (petrol stations, gas)
- grocery (supermarkets, grocery stores)
- shopping (online shopping, retail, fashion)
- travel (transport, hotels, flights)
- entertainment (movies, streaming, games)
- utilities (electricity, phone, internet)
- medical (hospitals, pharmacy, healthcare)
- atm (cash withdrawals)
- transfer (money transfers, UPI)
- insurance (insurance premiums)
- investment (mutual funds, trading)
- others (if none fit)

Respond in JSON format:
{
  "category": "chosen_category",
  "confidence": 0.8,
  "reasoning": "brief explanation"
}`;

      const response = await claudeService.client.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 200,
        temperature: 0.1,
        messages: [{ role: 'user', content: prompt }]
      });

      const responseText = response.content[0].text.trim();
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        return {
          category: result.category,
          confidence: result.confidence,
          details: result.reasoning
        };
      }
    } catch (error) {
      console.warn('AI categorization parsing error:', error.message);
    }
    
    return null;
  }

  // Categorize multiple transactions in batch
  async categorizeTransactions(transactions, userId = null, options = {}) {
    const results = [];
    const batchSize = options.batchSize || 50;
    
    for (let i = 0; i < transactions.length; i += batchSize) {
      const batch = transactions.slice(i, i + batchSize);
      const batchPromises = batch.map(transaction => 
        this.categorizeTransaction(transaction, userId)
      );
      
      try {
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
        
        // Add delay between batches to avoid rate limiting
        if (i + batchSize < transactions.length) {
          await this.delay(100);
        }
      } catch (error) {
        console.error('Batch categorization error:', error);
        // Add fallback categorization for failed batch
        batch.forEach(() => {
          results.push({
            category: 'others',
            confidence: 0.3,
            method: 'error_fallback',
            details: 'Categorization failed'
          });
        });
      }
    }
    
    // Learn from categorization results
    if (userId && options.learnFromResults !== false) {
      this.learnFromCategorization(transactions, results, userId);
    }
    
    return results;
  }

  // Extract merchant name from description
  extractMerchantName(description) {
    // Remove common prefixes and suffixes
    let merchant = description
      .replace(/^(pos|atm|upi|imps|neft|rtgs|card|txn)\s*/i, '')
      .replace(/\s*(india|pvt ltd|limited|ltd|inc|corp)$/i, '')
      .replace(/\s*-.*$/, '') // Remove everything after dash
      .replace(/\d+/g, '') // Remove numbers
      .trim();

    // Take first 2-3 meaningful words
    const words = merchant.split(/\s+/).filter(word => word.length > 2);
    return words.slice(0, 3).join(' ');
  }

  // Learn from user categorization patterns
  learnFromCategorization(transactions, results, userId) {
    const patterns = this.userPatterns.get(userId) || [];
    
    transactions.forEach((transaction, index) => {
      const result = results[index];
      
      if (result.confidence > 0.8) {
        // Extract pattern for high-confidence categorizations
        const pattern = {
          regex: new RegExp(this.createPatternFromDescription(transaction.description), 'i'),
          category: result.category,
          confidence: result.confidence,
          description: transaction.description,
          count: 1,
          lastSeen: new Date().toISOString()
        };
        
        // Check if similar pattern exists
        const existingIndex = patterns.findIndex(p => 
          p.category === pattern.category && 
          p.regex.source === pattern.regex.source
        );
        
        if (existingIndex !== -1) {
          patterns[existingIndex].count++;
          patterns[existingIndex].lastSeen = pattern.lastSeen;
          patterns[existingIndex].confidence = Math.min(
            patterns[existingIndex].confidence + 0.1, 
            1.0
          );
        } else {
          patterns.push(pattern);
        }
      }
    });
    
    // Keep only top 50 patterns per user to avoid memory bloat
    patterns.sort((a, b) => b.confidence * b.count - a.confidence * a.count);
    this.userPatterns.set(userId, patterns.slice(0, 50));
  }

  // Create regex pattern from transaction description
  createPatternFromDescription(description) {
    // Extract the core merchant/service name
    const merchant = this.extractMerchantName(description);
    
    // Escape special regex characters and create pattern
    const escapedMerchant = merchant.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return escapedMerchant.split(/\s+/).join('\\s*'); // Allow flexible whitespace
  }

  // Add merchant to database
  addMerchant(merchantName, category, confidence = 0.9) {
    this.merchantDatabase.set(merchantName.toLowerCase(), {
      category,
      confidence,
      addedAt: new Date().toISOString()
    });
  }

  // Update merchant category
  updateMerchant(merchantName, category, confidence = 0.9) {
    this.addMerchant(merchantName, category, confidence);
  }

  // Get categorization statistics
  getCategorization Statistics(transactions, results) {
    const stats = {
      totalTransactions: transactions.length,
      categorizedCount: results.filter(r => r.category !== 'others').length,
      categoryDistribution: {},
      methodDistribution: {},
      avgConfidence: 0,
      lowConfidenceCount: 0
    };
    
    let totalConfidence = 0;
    
    results.forEach(result => {
      // Category distribution
      if (!stats.categoryDistribution[result.category]) {
        stats.categoryDistribution[result.category] = 0;
      }
      stats.categoryDistribution[result.category]++;
      
      // Method distribution
      if (!stats.methodDistribution[result.method]) {
        stats.methodDistribution[result.method] = 0;
      }
      stats.methodDistribution[result.method]++;
      
      // Confidence stats
      totalConfidence += result.confidence;
      if (result.confidence < 0.7) {
        stats.lowConfidenceCount++;
      }
    });
    
    stats.avgConfidence = totalConfidence / results.length;
    stats.categorizationRate = (stats.categorizedCount / stats.totalTransactions) * 100;
    
    return stats;
  }

  // Delay utility for batch processing
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Clear user patterns (useful for testing or user reset)
  clearUserPatterns(userId) {
    this.userPatterns.delete(userId);
  }

  // Export merchant database for backup
  exportMerchantDatabase() {
    return Object.fromEntries(this.merchantDatabase);
  }

  // Import merchant database from backup
  importMerchantDatabase(merchantData) {
    Object.entries(merchantData).forEach(([merchant, data]) => {
      this.merchantDatabase.set(merchant, data);
    });
  }
}

module.exports = new CategorizationService();