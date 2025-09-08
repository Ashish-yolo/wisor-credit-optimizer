// Enhanced Card and Offer Management Service
class EnhancedCardService {
  constructor() {
    this.offerCache = new Map();
    this.scrapingQueue = [];
    this.isScrapingActive = false;
    this.lastScrapingTime = new Map();
  }

  // User Card Management
  async addUserCard(cardData) {
    try {
      // Validate card data
      if (!cardData.name || !cardData.bank) {
        throw new Error('Card name and bank are required');
      }

      // Generate unique ID if not provided
      const cardId = cardData.id || `user-${Date.now()}`;
      
      // Create enhanced card
      const enhancedCard = new EnhancedCreditCard({
        ...cardData,
        id: cardId,
        source: 'user-added',
        lastUpdated: new Date().toISOString()
      });

      // Store in user cards
      USER_ADDED_CARDS.set(cardId, enhancedCard);
      
      // Add to active portfolio
      if (!USER_CARDS.includes(cardId)) {
        USER_CARDS.push(cardId);
      }

      // Try to fetch dynamic rewards for this card
      await this.fetchCardRewards(cardId, enhancedCard.bank);

      // Save to storage
      await this.saveUserData();

      console.log(`Wisor: Added user card ${enhancedCard.name}`);
      return enhancedCard;

    } catch (error) {
      console.error('Error adding user card:', error);
      throw error;
    }
  }

  async removeUserCard(cardId) {
    USER_ADDED_CARDS.delete(cardId);
    const index = USER_CARDS.indexOf(cardId);
    if (index > -1) {
      USER_CARDS.splice(index, 1);
    }
    
    // Remove associated offers
    DYNAMIC_OFFERS.delete(cardId);
    
    await this.saveUserData();
    console.log(`Wisor: Removed user card ${cardId}`);
  }

  // Get card (static or user-added)
  getCard(cardId) {
    return INDIAN_CREDIT_CARDS[cardId] || USER_ADDED_CARDS.get(cardId);
  }

  // Get all user's cards with enhanced data
  getAllUserCards() {
    return USER_CARDS.map(cardId => {
      const staticCard = INDIAN_CREDIT_CARDS[cardId];
      if (staticCard) {
        return new EnhancedCreditCard({
          ...staticCard,
          source: 'static'
        });
      }
      return USER_ADDED_CARDS.get(cardId);
    }).filter(Boolean);
  }

  // Dynamic Reward Fetching
  async fetchCardRewards(cardId, bankName) {
    const bankKey = bankName.toLowerCase().replace(/\s+/g, '');
    const config = BANK_SCRAPING_CONFIG[bankKey];
    
    if (!config) {
      console.log(`Wisor: No scraping config for bank: ${bankName}`);
      return [];
    }

    // Check rate limiting
    const lastScrape = this.lastScrapingTime.get(bankKey);
    if (lastScrape && Date.now() - lastScrape < config.rateLimit) {
      console.log(`Wisor: Rate limited for ${bankName}`);
      return REWARD_RATE_CACHE.get(cardId) || [];
    }

    try {
      console.log(`Wisor: Fetching rewards for ${bankName}...`);
      const rewards = await this.scrapebankRewards(config, cardId);
      
      // Cache the results
      REWARD_RATE_CACHE.set(cardId, rewards);
      this.lastScrapingTime.set(bankKey, Date.now());
      
      return rewards;

    } catch (error) {
      console.error(`Error scraping ${bankName} rewards:`, error);
      return [];
    }
  }

  async scrapebankRewards(config, cardId) {
    // Simulated scraping (in real implementation, would use background script)
    return new Promise((resolve) => {
      setTimeout(() => {
        // Mock scraped rewards
        const mockRewards = [
          {
            category: 'dining',
            rate: 5,
            type: 'cashback',
            description: 'Scraped: 5% cashback on dining',
            source: 'scraped',
            lastUpdated: new Date().toISOString()
          },
          {
            category: 'online-shopping',
            rate: 3,
            type: 'cashback', 
            description: 'Scraped: 3% cashback on online shopping',
            source: 'scraped',
            lastUpdated: new Date().toISOString()
          }
        ];
        
        console.log(`Wisor: Scraped ${mockRewards.length} rewards for ${cardId}`);
        resolve(mockRewards);
      }, 1000);
    });
  }

  // Offer Scraping Service
  async scrapeOffers(merchant) {
    const hostname = merchant.hostname || merchant;
    const config = MERCHANT_SCRAPING_CONFIG[hostname.replace('.com', '').replace('.in', '')];
    
    if (!config) {
      console.log(`Wisor: No scraping config for merchant: ${hostname}`);
      return [];
    }

    try {
      console.log(`Wisor: Scraping offers for ${hostname}...`);
      const offers = await this.scrapeMerchantOffers(hostname, config);
      
      // Process and store offers
      const processedOffers = offers.map(offer => new DynamicOffer({
        ...offer,
        source: 'scraped',
        sourceUrl: window.location.href,
        scraped: {
          date: new Date().toISOString(),
          confidence: 0.8
        }
      }));

      // Group offers by card
      this.storeOffersByCard(processedOffers);
      
      console.log(`Wisor: Found ${processedOffers.length} offers on ${hostname}`);
      return processedOffers;

    } catch (error) {
      console.error(`Error scraping ${hostname} offers:`, error);
      return [];
    }
  }

  async scrapeMerchantOffers(hostname, config) {
    // Simulated offer scraping (real implementation would parse DOM)
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockOffers = [];
        
        // Amazon-specific offers
        if (hostname.includes('amazon')) {
          mockOffers.push({
            cardId: 'icici-amazon-pay',
            title: '10% instant discount',
            description: '10% instant discount with ICICI Amazon Pay Credit Card',
            rate: 10,
            type: 'discount',
            category: 'online-shopping',
            merchants: ['amazon.in'],
            minSpend: 3000,
            maxBenefit: 1500,
            expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
          });
          
          mockOffers.push({
            cardId: 'sbi-simplyclick',
            title: '5X rewards on Amazon',
            description: '5X reward points on Amazon purchases',
            rate: 5,
            type: 'points',
            category: 'online-shopping',
            merchants: ['amazon.in'],
            minSpend: 500,
            expires: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString() // 15 days
          });
        }

        // Zomato-specific offers  
        if (hostname.includes('zomato')) {
          mockOffers.push({
            cardId: 'hdfc-millennia',
            title: '20% off on food delivery',
            description: '20% off up to ₹100 with HDFC Credit Cards',
            rate: 20,
            type: 'discount',
            category: 'dining',
            merchants: ['zomato.com'],
            maxBenefit: 100,
            expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
          });
        }

        resolve(mockOffers);
      }, 800);
    });
  }

  storeOffersByCard(offers) {
    offers.forEach(offer => {
      if (!DYNAMIC_OFFERS.has(offer.cardId)) {
        DYNAMIC_OFFERS.set(offer.cardId, []);
      }
      
      const cardOffers = DYNAMIC_OFFERS.get(offer.cardId);
      
      // Remove existing offers with same title to prevent duplicates
      const filteredOffers = cardOffers.filter(existing => existing.title !== offer.title);
      filteredOffers.push(offer);
      
      DYNAMIC_OFFERS.set(offer.cardId, filteredOffers);
    });
  }

  // Get active offers for a card
  getActiveOffers(cardId, merchant = null) {
    const cardOffers = DYNAMIC_OFFERS.get(cardId) || [];
    const now = new Date();
    
    return cardOffers.filter(offer => {
      const isActive = new Date(offer.expires) > now;
      const matchesMerchant = !merchant || 
        offer.merchants.includes(merchant.hostname) || 
        offer.category === merchant.category;
      
      return isActive && matchesMerchant;
    });
  }

  // Enhanced benefit calculation with offers
  calculateEnhancedBenefit(card, merchant, cartValue) {
    const baseCard = this.getCard(card.id || card);
    if (!baseCard) return null;

    const enhancedCard = baseCard instanceof EnhancedCreditCard ? 
      baseCard : new EnhancedCreditCard(baseCard);
    
    const effectiveBenefits = enhancedCard.getEffectiveBenefits(merchant);
    const activeOffers = this.getActiveOffers(enhancedCard.id, merchant);
    
    let bestBenefit = null;
    let bestValue = 0;
    
    // Check static/custom benefits
    Object.entries(effectiveBenefits).forEach(([category, benefit]) => {
      if (this.categoryMatches(category, merchant)) {
        const value = this.calculateBenefitValue(benefit, cartValue);
        if (value > bestValue) {
          bestValue = value;
          bestBenefit = {
            ...benefit,
            value,
            category,
            source: benefit.source || 'static'
          };
        }
      }
    });

    // Check dynamic offers
    activeOffers.forEach(offer => {
      const value = this.calculateOfferValue(offer, cartValue);
      if (value > bestValue) {
        bestValue = value;
        bestBenefit = {
          rate: offer.rate,
          type: offer.type,
          description: offer.description,
          value,
          category: offer.category,
          source: 'offer',
          expires: offer.expires,
          title: offer.title
        };
      }
    });

    return bestBenefit ? {
      card: enhancedCard,
      ...bestBenefit,
      cartValue
    } : null;
  }

  categoryMatches(category, merchant) {
    return category === merchant.category || 
           category === merchant.subcategory || 
           category === 'general';
  }

  calculateBenefitValue(benefit, cartValue) {
    switch (benefit.type) {
      case 'cashback':
      case 'discount':
        const value = (cartValue * benefit.rate) / 100;
        return benefit.cap ? Math.min(value, benefit.cap) : value;
      
      case 'points':
        const points = Math.floor(cartValue / 100) * benefit.rate;
        return points * 0.25; // Assume ₹0.25 per point
      
      default:
        return 0;
    }
  }

  calculateOfferValue(offer, cartValue) {
    if (cartValue < offer.minSpend) return 0;
    
    const baseValue = this.calculateBenefitValue(offer, cartValue);
    return offer.maxBenefit ? Math.min(baseValue, offer.maxBenefit) : baseValue;
  }

  // Storage management
  async saveUserData() {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      const userData = {
        userCards: USER_CARDS,
        userAddedCards: Array.from(USER_ADDED_CARDS.entries()),
        dynamicOffers: Array.from(DYNAMIC_OFFERS.entries()),
        lastUpdated: new Date().toISOString()
      };
      
      await chrome.storage.sync.set({ wisorUserData: userData });
    }
  }

  async loadUserData() {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      const result = await chrome.storage.sync.get(['wisorUserData']);
      const userData = result.wisorUserData;
      
      if (userData) {
        USER_CARDS.length = 0;
        userData.userCards.forEach(cardId => USER_CARDS.push(cardId));
        
        USER_ADDED_CARDS.clear();
        userData.userAddedCards?.forEach(([id, card]) => {
          USER_ADDED_CARDS.set(id, new EnhancedCreditCard(card));
        });
        
        DYNAMIC_OFFERS.clear();
        userData.dynamicOffers?.forEach(([cardId, offers]) => {
          DYNAMIC_OFFERS.set(cardId, offers.map(offer => new DynamicOffer(offer)));
        });
        
        console.log('Wisor: Loaded user data:', {
          cards: USER_CARDS.length,
          userCards: USER_ADDED_CARDS.size,
          offers: DYNAMIC_OFFERS.size
        });
      }
    }
  }

  // Cleanup expired offers
  cleanupExpiredOffers() {
    const now = new Date();
    
    DYNAMIC_OFFERS.forEach((offers, cardId) => {
      const validOffers = offers.filter(offer => new Date(offer.expires) > now);
      if (validOffers.length !== offers.length) {
        DYNAMIC_OFFERS.set(cardId, validOffers);
        console.log(`Wisor: Cleaned up ${offers.length - validOffers.length} expired offers for ${cardId}`);
      }
    });
  }

  // Get stats
  getStats() {
    const totalOffers = Array.from(DYNAMIC_OFFERS.values())
      .reduce((sum, offers) => sum + offers.length, 0);
    
    const activeOffers = Array.from(DYNAMIC_OFFERS.values())
      .reduce((sum, offers) => sum + offers.filter(o => new Date(o.expires) > new Date()).length, 0);

    return {
      totalCards: USER_CARDS.length,
      userAddedCards: USER_ADDED_CARDS.size,
      totalOffers,
      activeOffers,
      cachedRewards: REWARD_RATE_CACHE.size
    };
  }
}

// Create global instance
const enhancedCardService = new EnhancedCardService();

// Auto-load user data on initialization
if (typeof window !== 'undefined') {
  enhancedCardService.loadUserData();
  
  // Cleanup expired offers every hour
  setInterval(() => enhancedCardService.cleanupExpiredOffers(), 60 * 60 * 1000);
}