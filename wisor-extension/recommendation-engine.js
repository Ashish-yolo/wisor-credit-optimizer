// Credit Card Recommendation Engine
class RecommendationEngine {
  constructor() {
    this.userCards = USER_CARDS;
  }

  getRecommendationForMerchant(merchant, cartValue = 0) {
    if (!merchant) return null;
    
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