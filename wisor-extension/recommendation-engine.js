// Credit Card Recommendation Engine with Claude AI Integration
class RecommendationEngine {
  constructor() {
    this.userCards = USER_CARDS;
    // Production backend URL - will fallback to local if needed
    this.backendUrl = 'https://wisor-credit-optimizer.onrender.com';
    this.fallbackToLocal = true;
  }

  async getRecommendationForMerchant(merchant, cartValue = 0) {
    if (!merchant) return null;

    try {
      // Try Claude-powered recommendation first
      const claudeRecommendation = await this.getClaudeRecommendation(merchant, cartValue);
      if (claudeRecommendation) {
        return claudeRecommendation;
      }
    } catch (error) {
      console.log('Wisor: Claude API unavailable, using local recommendations');
    }

    // Fallback to local logic
    return this.getLocalRecommendation(merchant, cartValue);
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
      // Set timeout for API call (10 seconds max)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(`${this.backendUrl}/api/recommend`, {
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
      console.error('Wisor: Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        url: `${this.backendUrl}/api/recommend`
      });
      if (error.name === 'AbortError') {
        console.log('Wisor: API request timed out, using fallback');
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
    
    // Sort by value (highest benefit first)
    recommendations.sort((a, b) => b.value - a.value);
    
    // Also include top 3 cards that would be good for this merchant (even if user doesn't have them)
    const suggestedCards = this.getSuggestedCards(merchant, cartValue);
    
    return {
      userCardRecommendations: recommendations,
      suggestedCards: suggestedCards.slice(0, 3),
      merchant: merchant,
      cartValue: cartValue
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
}