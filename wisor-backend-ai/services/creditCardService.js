const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const axios = require('axios');

class CreditCardService {
  constructor() {
    this.creditCardsDatabase = new Map();
    this.lastUpdated = null;
    this.scrapingSources = this.initializeScrapingSources();
    this.browser = null;
  }

  // Initialize data sources for web scraping
  initializeScrapingSources() {
    return {
      bankWebsites: [
        {
          name: 'HDFC Bank',
          url: 'https://www.hdfcbank.com/personal/pay/cards/credit-cards',
          selector: '.card-item',
          fields: {
            name: '.card-name',
            annualFee: '.annual-fee',
            rewardRate: '.reward-rate'
          }
        },
        {
          name: 'ICICI Bank',
          url: 'https://www.icicibank.com/personal-banking/cards/credit-card',
          selector: '.product-card',
          fields: {
            name: '.product-name',
            annualFee: '.fee-details',
            rewardRate: '.rewards-info'
          }
        },
        {
          name: 'SBI Cards',
          url: 'https://www.sbicard.com/en/personal/credit-cards.page',
          selector: '.card-product',
          fields: {
            name: '.card-title',
            annualFee: '.annual-fee-text',
            rewardRate: '.reward-points'
          }
        }
      ],
      
      aggregatorSites: [
        {
          name: 'BankBazaar',
          url: 'https://www.bankbazaar.com/credit-card.html',
          selector: '.cc-item',
          fields: {
            name: '.cc-name',
            bank: '.bank-name',
            annualFee: '.annual-fee',
            rewardRate: '.reward-rate',
            features: '.features-list'
          }
        },
        {
          name: 'CardExpert',
          url: 'https://www.cardexpert.in/credit-cards/',
          selector: '.card-listing',
          fields: {
            name: '.card-name',
            bank: '.issuer-name',
            annualFee: '.fee-amount',
            rewardRate: '.reward-percentage'
          }
        }
      ]
    };
  }

  // Initialize browser for web scraping
  async initializeBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      });
    }
    return this.browser;
  }

  // Close browser
  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  // Scrape credit card data from multiple sources
  async scrapeAllCreditCards(options = {}) {
    const { sources = 'all', maxCards = 100 } = options;
    const results = {
      success: true,
      scraped: [],
      errors: [],
      summary: {
        totalScraped: 0,
        uniqueCards: 0,
        sources: 0
      }
    };

    try {
      await this.initializeBrowser();
      
      // Scrape from bank websites
      if (sources === 'all' || sources === 'banks') {
        for (const bankSource of this.scrapingSources.bankWebsites) {
          try {
            const bankCards = await this.scrapeBankWebsite(bankSource);
            results.scraped.push(...bankCards);
            results.summary.sources++;
          } catch (error) {
            console.error(`Error scraping ${bankSource.name}:`, error.message);
            results.errors.push({
              source: bankSource.name,
              error: error.message
            });
          }
        }
      }
      
      // Scrape from aggregator sites
      if (sources === 'all' || sources === 'aggregators') {
        for (const aggSource of this.scrapingSources.aggregatorSites) {
          try {
            const aggCards = await this.scrapeAggregatorSite(aggSource);
            results.scraped.push(...aggCards);
            results.summary.sources++;
          } catch (error) {
            console.error(`Error scraping ${aggSource.name}:`, error.message);
            results.errors.push({
              source: aggSource.name,
              error: error.message
            });
          }
        }
      }
      
      // Remove duplicates and process data
      const uniqueCards = this.removeDuplicates(results.scraped);
      const processedCards = uniqueCards.slice(0, maxCards).map(card => 
        this.processScrapedCard(card)
      );
      
      // Update database
      processedCards.forEach(card => {
        this.creditCardsDatabase.set(card.id, {
          ...card,
          lastUpdated: new Date().toISOString(),
          source: 'scraped'
        });
      });
      
      results.summary.totalScraped = results.scraped.length;
      results.summary.uniqueCards = processedCards.length;
      this.lastUpdated = new Date().toISOString();
      
      return results;

    } catch (error) {
      console.error('Scraping error:', error);
      return {
        success: false,
        error: error.message,
        scraped: [],
        errors: results.errors
      };
    } finally {
      await this.closeBrowser();
    }
  }

  // Scrape individual bank website
  async scrapeBankWebsite(bankSource) {
    const page = await this.browser.newPage();
    const cards = [];
    
    try {
      // Set user agent and other headers
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      
      await page.goto(bankSource.url, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });
      
      // Wait for content to load
      await page.waitForTimeout(3000);
      
      // Extract card data
      const cardElements = await page.$$(bankSource.selector);
      
      for (const element of cardElements) {
        try {
          const cardData = {
            bank: bankSource.name,
            source: bankSource.name
          };
          
          // Extract each field
          for (const [field, selector] of Object.entries(bankSource.fields)) {
            try {
              const fieldElement = await element.$(selector);
              if (fieldElement) {
                cardData[field] = await fieldElement.evaluate(el => el.textContent.trim());
              }
            } catch (fieldError) {
              console.warn(`Error extracting ${field} from ${bankSource.name}:`, fieldError.message);
            }
          }
          
          if (cardData.name) {
            cards.push(cardData);
          }
        } catch (cardError) {
          console.warn('Error processing card element:', cardError.message);
        }
      }
      
    } catch (error) {
      console.error(`Error scraping ${bankSource.name}:`, error.message);
    } finally {
      await page.close();
    }
    
    return cards;
  }

  // Scrape aggregator websites
  async scrapeAggregatorSite(aggSource) {
    const page = await this.browser.newPage();
    const cards = [];
    
    try {
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      
      await page.goto(aggSource.url, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });
      
      await page.waitForTimeout(2000);
      
      const cardElements = await page.$$(aggSource.selector);
      
      for (const element of cardElements) {
        try {
          const cardData = { source: aggSource.name };
          
          for (const [field, selector] of Object.entries(aggSource.fields)) {
            try {
              const fieldElement = await element.$(selector);
              if (fieldElement) {
                cardData[field] = await fieldElement.evaluate(el => el.textContent.trim());
              }
            } catch (fieldError) {
              // Field might not exist for this card
            }
          }
          
          if (cardData.name && cardData.bank) {
            cards.push(cardData);
          }
        } catch (cardError) {
          console.warn('Error processing card:', cardError.message);
        }
      }
      
    } catch (error) {
      console.error(`Error scraping ${aggSource.name}:`, error.message);
    } finally {
      await page.close();
    }
    
    return cards;
  }

  // Process and normalize scraped card data
  processScrapedCard(rawCard) {
    const card = {
      id: this.generateCardId(rawCard.name, rawCard.bank),
      name: this.cleanCardName(rawCard.name),
      bank: this.cleanBankName(rawCard.bank || ''),
      annualFee: this.parseAnnualFee(rawCard.annualFee),
      rewardRate: this.parseRewardRate(rawCard.rewardRate),
      category: this.inferCardCategory(rawCard.name, rawCard.features),
      features: this.parseFeatures(rawCard.features),
      isActive: true,
      popularity: 0,
      userRating: 0,
      scrapedAt: new Date().toISOString(),
      source: rawCard.source
    };

    // Add additional inferred data
    card.tier = this.inferCardTier(card.name, card.annualFee);
    card.targetAudience = this.inferTargetAudience(card.name, card.features);
    card.primaryCategory = this.inferPrimaryRewardCategory(card.name, card.features);
    
    return card;
  }

  // Generate unique card ID
  generateCardId(name, bank) {
    const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanBank = bank.toLowerCase().replace(/[^a-z0-9]/g, '');
    return `${cleanBank}_${cleanName}`;
  }

  // Clean and standardize card names
  cleanCardName(name) {
    return name
      .replace(/credit card/gi, '')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/^[^a-zA-Z]+/, '') // Remove leading non-alphabetic chars
      .substring(0, 50); // Limit length
  }

  // Clean and standardize bank names
  cleanBankName(bank) {
    const bankMapping = {
      'hdfc': 'HDFC Bank',
      'icici': 'ICICI Bank',
      'sbi': 'SBI Cards',
      'axis': 'Axis Bank',
      'kotak': 'Kotak Mahindra Bank',
      'yes': 'Yes Bank',
      'indusind': 'IndusInd Bank',
      'citi': 'Citibank',
      'hsbc': 'HSBC Bank',
      'standard chartered': 'Standard Chartered Bank',
      'american express': 'American Express',
      'rbl': 'RBL Bank'
    };
    
    const lowerBank = bank.toLowerCase();
    for (const [key, value] of Object.entries(bankMapping)) {
      if (lowerBank.includes(key)) {
        return value;
      }
    }
    
    return bank.replace(/\b(bank|ltd|limited)\b/gi, '').trim();
  }

  // Parse annual fee from text
  parseAnnualFee(feeText) {
    if (!feeText) return 0;
    
    const feeStr = feeText.toLowerCase();
    
    if (feeStr.includes('nil') || feeStr.includes('free') || feeStr.includes('waived')) {
      return 0;
    }
    
    // Extract number from text
    const matches = feeStr.match(/[\d,]+/g);
    if (matches) {
      const fee = parseInt(matches[0].replace(/,/g, ''));
      return isNaN(fee) ? 0 : fee;
    }
    
    return 0;
  }

  // Parse reward rate from text
  parseRewardRate(rewardText) {
    if (!rewardText) return { default: 0.5 };
    
    const rates = {};
    const text = rewardText.toLowerCase();
    
    // Look for percentage patterns
    const percentMatches = text.match(/(\d+(?:\.\d+)?)[%\s]*(?:on\s+)?([a-zA-Z\s]+)/g);
    if (percentMatches) {
      percentMatches.forEach(match => {
        const parts = match.match(/(\d+(?:\.\d+)?)[%\s]*(?:on\s+)?([a-zA-Z\s]+)/);
        if (parts) {
          const rate = parseFloat(parts[1]);
          const category = this.mapRewardCategory(parts[2].trim());
          if (category) {
            rates[category] = rate;
          }
        }
      });
    }
    
    // Look for points patterns (e.g., "2 points per ₹100")
    const pointsMatches = text.match(/(\d+)\s*points?\s*per\s*₹?(\d+)/gi);
    if (pointsMatches) {
      pointsMatches.forEach(match => {
        const parts = match.match(/(\d+)\s*points?\s*per\s*₹?(\d+)/i);
        if (parts) {
          const points = parseInt(parts[1]);
          const rupees = parseInt(parts[2]);
          const rate = (points / rupees) * 100; // Convert to percentage
          rates.default = rate;
        }
      });
    }
    
    // If no specific rates found, try to extract default rate
    if (Object.keys(rates).length === 0) {
      const defaultMatch = text.match(/(\d+(?:\.\d+)?)/);
      if (defaultMatch) {
        rates.default = parseFloat(defaultMatch[1]);
      } else {
        rates.default = 0.5; // Fallback
      }
    }
    
    return rates;
  }

  // Map reward text to standard categories
  mapRewardCategory(categoryText) {
    const categoryMappings = {
      'fuel': ['fuel', 'petrol', 'gas'],
      'grocery': ['grocery', 'supermarket'],
      'food': ['dining', 'restaurant', 'food'],
      'travel': ['travel', 'flight', 'hotel'],
      'shopping': ['shopping', 'online', 'retail'],
      'entertainment': ['entertainment', 'movie', 'streaming']
    };
    
    const lowerText = categoryText.toLowerCase();
    for (const [category, keywords] of Object.entries(categoryMappings)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        return category;
      }
    }
    
    return null;
  }

  // Parse features from text
  parseFeatures(featuresText) {
    if (!featuresText) return [];
    
    const features = [];
    const text = featuresText.toLowerCase();
    
    const featureKeywords = {
      'lounge_access': ['lounge', 'airport lounge'],
      'fuel_surcharge_waiver': ['fuel surcharge', 'fuel waiver'],
      'insurance': ['insurance', 'cover', 'protection'],
      'concierge': ['concierge', '24/7 support'],
      'reward_points': ['reward points', 'cashback'],
      'milestone_benefits': ['milestone', 'spend based'],
      'dining_discounts': ['dining', 'restaurant discount'],
      'movie_discounts': ['movie', 'cinema', 'bookmyshow'],
      'golf': ['golf', 'golf course'],
      'emergency_assistance': ['emergency', 'card replacement']
    };
    
    for (const [feature, keywords] of Object.entries(featureKeywords)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        features.push(feature);
      }
    }
    
    return features;
  }

  // Infer card category based on name and features
  inferCardCategory(name, features) {
    const nameAndFeatures = `${name} ${features}`.toLowerCase();
    
    if (nameAndFeatures.includes('travel') || nameAndFeatures.includes('miles')) {
      return 'travel';
    }
    if (nameAndFeatures.includes('fuel') || nameAndFeatures.includes('petrol')) {
      return 'fuel';
    }
    if (nameAndFeatures.includes('shopping') || nameAndFeatures.includes('online')) {
      return 'shopping';
    }
    if (nameAndFeatures.includes('dining') || nameAndFeatures.includes('food')) {
      return 'dining';
    }
    if (nameAndFeatures.includes('cashback')) {
      return 'cashback';
    }
    
    return 'general';
  }

  // Infer card tier
  inferCardTier(name, annualFee) {
    const lowerName = name.toLowerCase();
    
    if (lowerName.includes('platinum') || lowerName.includes('signature') || annualFee > 10000) {
      return 'premium';
    }
    if (lowerName.includes('gold') || (annualFee >= 1000 && annualFee <= 10000)) {
      return 'mid-tier';
    }
    if (lowerName.includes('silver') || annualFee === 0) {
      return 'basic';
    }
    
    return 'standard';
  }

  // Infer target audience
  inferTargetAudience(name, features) {
    const nameAndFeatures = `${name} ${features}`.toLowerCase();
    
    if (nameAndFeatures.includes('business') || nameAndFeatures.includes('corporate')) {
      return 'business';
    }
    if (nameAndFeatures.includes('student') || nameAndFeatures.includes('first')) {
      return 'students';
    }
    if (nameAndFeatures.includes('premium') || nameAndFeatures.includes('exclusive')) {
      return 'affluent';
    }
    
    return 'general';
  }

  // Infer primary reward category
  inferPrimaryRewardCategory(name, features) {
    const text = `${name} ${features}`.toLowerCase();
    
    const categories = ['travel', 'fuel', 'dining', 'shopping', 'cashback'];
    for (const category of categories) {
      if (text.includes(category)) {
        return category;
      }
    }
    
    return 'general';
  }

  // Remove duplicates based on name and bank
  removeDuplicates(cards) {
    const seen = new Set();
    return cards.filter(card => {
      const key = `${card.bank}_${card.name}`.toLowerCase();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  // Get all credit cards from database
  getAllCreditCards(filters = {}) {
    let cards = Array.from(this.creditCardsDatabase.values());
    
    // Apply filters
    if (filters.bank) {
      cards = cards.filter(card => 
        card.bank.toLowerCase().includes(filters.bank.toLowerCase())
      );
    }
    
    if (filters.category) {
      cards = cards.filter(card => card.category === filters.category);
    }
    
    if (filters.tier) {
      cards = cards.filter(card => card.tier === filters.tier);
    }
    
    if (filters.maxAnnualFee !== undefined) {
      cards = cards.filter(card => card.annualFee <= filters.maxAnnualFee);
    }
    
    if (filters.minRewardRate !== undefined) {
      cards = cards.filter(card => 
        Math.max(...Object.values(card.rewardRate)) >= filters.minRewardRate
      );
    }
    
    // Sort by popularity and user rating
    cards.sort((a, b) => {
      return (b.popularity + b.userRating) - (a.popularity + a.userRating);
    });
    
    return cards;
  }

  // Search credit cards
  searchCreditCards(query, limit = 20) {
    const lowerQuery = query.toLowerCase();
    const cards = Array.from(this.creditCardsDatabase.values());
    
    const matchingCards = cards.filter(card => {
      return (
        card.name.toLowerCase().includes(lowerQuery) ||
        card.bank.toLowerCase().includes(lowerQuery) ||
        card.category.toLowerCase().includes(lowerQuery) ||
        card.features.some(feature => feature.includes(lowerQuery))
      );
    });
    
    // Score matches by relevance
    const scoredCards = matchingCards.map(card => {
      let score = 0;
      if (card.name.toLowerCase().includes(lowerQuery)) score += 10;
      if (card.bank.toLowerCase().includes(lowerQuery)) score += 5;
      if (card.category.toLowerCase().includes(lowerQuery)) score += 3;
      card.features.forEach(feature => {
        if (feature.includes(lowerQuery)) score += 1;
      });
      
      return { ...card, searchScore: score };
    });
    
    return scoredCards
      .sort((a, b) => b.searchScore - a.searchScore)
      .slice(0, limit);
  }

  // Get credit card by ID
  getCreditCard(cardId) {
    return this.creditCardsDatabase.get(cardId) || null;
  }

  // Add manual credit card entry
  addCreditCard(cardData) {
    const card = {
      ...cardData,
      id: cardData.id || this.generateCardId(cardData.name, cardData.bank),
      lastUpdated: new Date().toISOString(),
      source: 'manual'
    };
    
    this.creditCardsDatabase.set(card.id, card);
    return card;
  }

  // Update credit card data
  updateCreditCard(cardId, updates) {
    const existingCard = this.creditCardsDatabase.get(cardId);
    if (!existingCard) {
      return null;
    }
    
    const updatedCard = {
      ...existingCard,
      ...updates,
      lastUpdated: new Date().toISOString()
    };
    
    this.creditCardsDatabase.set(cardId, updatedCard);
    return updatedCard;
  }

  // Get database statistics
  getDatabaseStats() {
    const cards = Array.from(this.creditCardsDatabase.values());
    
    const stats = {
      totalCards: cards.length,
      lastUpdated: this.lastUpdated,
      bankDistribution: {},
      categoryDistribution: {},
      tierDistribution: {},
      avgAnnualFee: 0,
      avgRewardRate: 0
    };
    
    let totalFees = 0;
    let totalRewards = 0;
    
    cards.forEach(card => {
      // Bank distribution
      stats.bankDistribution[card.bank] = (stats.bankDistribution[card.bank] || 0) + 1;
      
      // Category distribution
      stats.categoryDistribution[card.category] = (stats.categoryDistribution[card.category] || 0) + 1;
      
      // Tier distribution
      stats.tierDistribution[card.tier] = (stats.tierDistribution[card.tier] || 0) + 1;
      
      // Average calculations
      totalFees += card.annualFee;
      totalRewards += Math.max(...Object.values(card.rewardRate));
    });
    
    stats.avgAnnualFee = Math.round(totalFees / cards.length);
    stats.avgRewardRate = Math.round((totalRewards / cards.length) * 100) / 100;
    
    return stats;
  }

  // Initialize database with basic credit cards
  async initializeWithBasicCards() {
    const basicCards = [
      {
        name: 'Millennia Credit Card',
        bank: 'HDFC Bank',
        annualFee: 1000,
        rewardRate: { default: 1.0, online: 2.5, dining: 2.5 },
        category: 'cashback',
        tier: 'standard',
        features: ['cashback', 'fuel_surcharge_waiver', 'insurance'],
        isActive: true
      },
      {
        name: 'Amazon Pay ICICI Credit Card',
        bank: 'ICICI Bank',
        annualFee: 0,
        rewardRate: { default: 1.0, amazon: 5.0, online: 2.0 },
        category: 'shopping',
        tier: 'basic',
        features: ['cashback', 'amazon_benefits'],
        isActive: true
      },
      {
        name: 'SBI SimplyCLICK Credit Card',
        bank: 'SBI Cards',
        annualFee: 499,
        rewardRate: { default: 1.0, online: 10.0 },
        category: 'shopping',
        tier: 'standard',
        features: ['reward_points', 'fuel_surcharge_waiver'],
        isActive: true
      }
    ];
    
    basicCards.forEach(cardData => {
      this.addCreditCard(cardData);
    });
    
    return basicCards.length;
  }
}

module.exports = new CreditCardService();