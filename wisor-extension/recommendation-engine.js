// Credit Card Recommendation Engine with Claude AI Integration
class RecommendationEngine {
  constructor() {
    this.userCards = USER_CARDS;
    // Production backend URL - will fallback to local if needed
    this.backendUrl = 'https://wisor-ai-backend.onrender.com';
    this.fallbackToLocal = true;
    
    // Reactive calculation setup
    this.calculationCache = new Map();
    this.calculationCallbacks = new Map();
    this.debounceTimers = new Map();
    this.isCalculating = false;
  }

  async getRecommendationForMerchant(merchant, cartValue = 0) {
    if (!merchant) return null;

    console.log('Wisor: Starting recommendation process...');

    // Start both Claude and local recommendations in parallel
    const claudePromise = this.getClaudeRecommendation(merchant, cartValue)
      .catch(error => {
        console.log('Wisor: Claude API failed:', error.message);
        return null;
      });
    
    const localPromise = new Promise(resolve => {
      setTimeout(() => {
        console.log('Wisor: 20 second timeout - showing local recommendations');
        resolve(this.getLocalRecommendation(merchant, cartValue));
      }, 20000); // Show local after 20 seconds
    });

    // Return whichever comes first
    const result = await Promise.race([claudePromise, localPromise]);
    
    // If Claude responded, mark as AI-powered
    if (result && !result.aiPowered) {
      const claudeResult = await Promise.race([
        claudePromise,
        new Promise(resolve => setTimeout(() => resolve(null), 1000))
      ]);
      if (claudeResult) {
        return claudeResult;
      }
    }
    
    return result;
  }

  async getClaudeRecommendation(merchant, cartValue) {
    if (this.userCards.length === 0) {
      return null;
    }

    const requestBody = {
      merchant: merchant.name || merchant.hostname,
      category: merchant.category || 'general',
      amount: cartValue || 1000,
      userCards: this.userCards,
      context: {
        url: merchant.url || window.location.href,
        timestamp: new Date().toISOString(),
        userPreferences: this.getUserPreferences()
      }
    };

    try {
      // Set timeout for API call (45 seconds max - Claude can be slow)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000);
      
      const response = await fetch(`${this.backendUrl}/api/ai/recommend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Origin': chrome.runtime.getURL('')
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
        mode: 'cors',
        credentials: 'omit'
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success && data.recommendation) {
        return this.formatClaudeRecommendation(data.recommendation, merchant, cartValue);
      }
    } catch (error) {
      console.error('Wisor: Claude API error:', error);
      if (error.name === 'AbortError') {
        console.log('Wisor: Claude API request timed out after 45s, using local fallback');
      } else {
        console.error('Wisor: Error details:', {
          name: error.name,
          message: error.message,
          url: `${this.backendUrl}/api/recommend`
        });
      }
      throw error;
    }

    return null;
  }

  formatClaudeRecommendation(claudeRec, merchant, cartValue) {
    const recommendedCard = INDIAN_CREDIT_CARDS[claudeRec.recommendedCard];
    const alternativeCard = claudeRec.alternative ? INDIAN_CREDIT_CARDS[claudeRec.alternative.card] : null;

    const userCardRecommendations = [];

    if (recommendedCard) {
      userCardRecommendations.push({
        card: recommendedCard,
        value: claudeRec.rewardValue || 0,
        description: claudeRec.reasoning || 'AI-optimized recommendation',
        rate: 0,
        type: 'ai-recommendation',
        cartValue: cartValue,
        source: 'claude'
      });
    }

    // Add alternative if available
    if (alternativeCard && claudeRec.alternative) {
      userCardRecommendations.push({
        card: alternativeCard,
        value: claudeRec.alternative.rewardValue || 0,
        description: claudeRec.alternative.reason || 'Alternative option',
        rate: 0,
        type: 'ai-alternative',
        cartValue: cartValue,
        source: 'claude'
      });
    }

    return {
      userCardRecommendations: userCardRecommendations,
      suggestedCards: this.getSuggestedCards(merchant, cartValue).slice(0, 3),
      merchant: merchant,
      cartValue: cartValue,
      aiPowered: true,
      reasoning: claudeRec.reasoning
    };
  }

  getUserPreferences() {
    // This could be enhanced to store user preferences
    return {
      prefersCashback: true,
      spendingPattern: 'frequent online shopping',
      riskTolerance: 'conservative'
    };
  }

  // Fallback to original local logic  
  getLocalRecommendation(merchant, cartValue = 0) {
    console.log('Wisor: Generating local recommendations...');
    
    const recommendations = [];
    
    // Get user's cards that have benefits for this merchant
    for (const cardId of this.userCards) {
      const card = INDIAN_CREDIT_CARDS[cardId];
      if (!card) continue;
      
      const recommendation = this.calculateCardBenefit(card, merchant, cartValue);
      if (recommendation.value > 0) {
        recommendations.push(recommendation);
      }
    }
    
    // If no specific benefits found, add generic recommendations
    if (recommendations.length === 0 && this.userCards.length > 0) {
      for (const cardId of this.userCards.slice(0, 2)) {
        const card = INDIAN_CREDIT_CARDS[cardId];
        if (card) {
          recommendations.push({
            card: card,
            value: Math.round(cartValue * 0.01), // 1% default
            rate: 1,
            type: 'cashback',
            description: 'General cashback reward',
            cartValue: cartValue
          });
        }
      }
    }
    
    // Sort by value (highest benefit first)
    recommendations.sort((a, b) => b.value - a.value);
    
    // Also include top 3 cards that would be good for this merchant (even if user doesn't have them)
    const suggestedCards = this.getSuggestedCards(merchant, cartValue);
    
    console.log('Wisor: Local recommendations generated:', recommendations.length);
    
    return {
      userCardRecommendations: recommendations,
      suggestedCards: suggestedCards.slice(0, 3),
      merchant: merchant,
      cartValue: cartValue,
      aiPowered: false
    };
  }

  calculateCardBenefit(card, merchant, cartValue) {
    let benefitValue = 0;
    let benefitRate = 0;
    let benefitType = '';
    let description = '';
    
    // Check if card has specific benefit for this merchant's category
    const merchantCategory = merchant.category;
    const merchantSubcategory = merchant.subcategory;
    
    // Priority order: specific merchant > subcategory > category > general
    let applicableBenefit = null;
    
    if (card.benefits[merchantSubcategory]) {
      applicableBenefit = card.benefits[merchantSubcategory];
    } else if (card.benefits[merchantCategory]) {
      applicableBenefit = card.benefits[merchantCategory];
    } else if (card.benefits.general) {
      applicableBenefit = card.benefits.general;
    }
    
    if (applicableBenefit) {
      benefitRate = applicableBenefit.rate;
      benefitType = applicableBenefit.type;
      description = applicableBenefit.description;
      
      // Calculate monetary value
      if (cartValue > 0) {
        switch (benefitType) {
          case 'cashback':
            benefitValue = (cartValue * benefitRate) / 100;
            if (applicableBenefit.cap) {
              benefitValue = Math.min(benefitValue, applicableBenefit.cap);
            }
            break;
          case 'points':
            // Assume 1 point = ₹0.25 value (standard conversion)
            const pointsEarned = Math.floor(cartValue / 100) * benefitRate;
            benefitValue = pointsEarned * 0.25;
            break;
          case 'surcharge-waiver':
            // Assume 1% surcharge waiver
            benefitValue = cartValue * 0.01;
            break;
        }
      }
    }
    
    return {
      card: card,
      value: benefitValue,
      rate: benefitRate,
      type: benefitType,
      description: description,
      cartValue: cartValue
    };
  }

  getSuggestedCards(merchant, cartValue) {
    const allCards = Object.values(INDIAN_CREDIT_CARDS);
    const suggestions = [];
    
    for (const card of allCards) {
      if (this.userCards.includes(card.id)) continue; // Skip cards user already has
      
      const recommendation = this.calculateCardBenefit(card, merchant, cartValue);
      if (recommendation.value > 0) {
        suggestions.push(recommendation);
      }
    }
    
    return suggestions.sort((a, b) => b.value - a.value);
  }

  getBestAlternative(currentCardId, merchant, cartValue) {
    const currentCard = INDIAN_CREDIT_CARDS[currentCardId];
    const currentBenefit = this.calculateCardBenefit(currentCard, merchant, cartValue);
    
    const alternatives = this.userCards
      .filter(cardId => cardId !== currentCardId)
      .map(cardId => {
        const card = INDIAN_CREDIT_CARDS[cardId];
        return this.calculateCardBenefit(card, merchant, cartValue);
      })
      .filter(rec => rec.value > currentBenefit.value)
      .sort((a, b) => b.value - a.value);
    
    return alternatives[0] || null;
  }

  // Reactive calculation methods
  subscribeToRewardUpdates(merchant, callback) {
    const key = this.getMerchantKey(merchant);
    if (!this.calculationCallbacks.has(key)) {
      this.calculationCallbacks.set(key, new Set());
    }
    this.calculationCallbacks.get(key).add(callback);
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.calculationCallbacks.get(key);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.calculationCallbacks.delete(key);
        }
      }
    };
  }

  async getReactiveRecommendation(merchant, cartValue = 0, debounceMs = 300) {
    const key = this.getMerchantKey(merchant) + '_' + cartValue;
    
    // Check cache first
    if (this.calculationCache.has(key)) {
      const cached = this.calculationCache.get(key);
      if (Date.now() - cached.timestamp < 30000) { // 30 second cache
        return cached.data;
      }
    }

    // Clear existing debounce timer
    if (this.debounceTimers.has(key)) {
      clearTimeout(this.debounceTimers.get(key));
    }

    // Set loading state
    this.isCalculating = true;
    this.notifyCallbacks(merchant, { loading: true, cartValue });

    return new Promise((resolve) => {
      const timer = setTimeout(async () => {
        try {
          const result = await this.getRecommendationForMerchant(merchant, cartValue);
          
          // Cache the result
          this.calculationCache.set(key, {
            data: result,
            timestamp: Date.now()
          });
          
          // Clean up old cache entries (keep last 50)
          if (this.calculationCache.size > 50) {
            const entries = Array.from(this.calculationCache.entries());
            entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
            this.calculationCache.delete(entries[0][0]);
          }

          this.isCalculating = false;
          this.notifyCallbacks(merchant, { loading: false, recommendation: result, cartValue });
          
          resolve(result);
        } catch (error) {
          this.isCalculating = false;
          this.notifyCallbacks(merchant, { loading: false, error, cartValue });
          resolve(null);
        }
        
        this.debounceTimers.delete(key);
      }, debounceMs);

      this.debounceTimers.set(key, timer);
    });
  }

  notifyCallbacks(merchant, data) {
    const key = this.getMerchantKey(merchant);
    const callbacks = this.calculationCallbacks.get(key);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Wisor: Callback error:', error);
        }
      });
    }
  }

  getMerchantKey(merchant) {
    return typeof merchant === 'string' ? merchant : (merchant.name || merchant.hostname || 'unknown');
  }

  clearCache() {
    this.calculationCache.clear();
  }

  getCacheStats() {
    return {
      size: this.calculationCache.size,
      activeCallbacks: Array.from(this.calculationCallbacks.keys()).length,
      isCalculating: this.isCalculating
    };
  }
}