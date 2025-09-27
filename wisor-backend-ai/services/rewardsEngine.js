const moment = require('moment');

class RewardsEngine {
  constructor() {
    // Credit card database will be populated from credit cards service
    this.creditCards = new Map();
    this.rewardRules = this.initializeRewardRules();
  }

  // Initialize reward calculation rules
  initializeRewardRules() {
    return {
      // Standard reward rates by category
      defaultRates: {
        'fuel': 1.0,
        'grocery': 1.0, 
        'food': 1.0,
        'shopping': 1.0,
        'travel': 1.0,
        'entertainment': 1.0,
        'utilities': 0.5,
        'others': 0.5
      },

      // Bonus multipliers for specific categories
      categoryBonuses: {
        'premium_travel': 3.0,
        'premium_dining': 2.5,
        'premium_fuel': 2.0,
        'weekend_dining': 2.0,
        'online_shopping': 1.5
      },

      // Monthly spending milestones for bonus rewards
      milestoneRewards: {
        10000: 0.1, // Extra 0.1% after 10k spending
        25000: 0.2, // Extra 0.2% after 25k spending 
        50000: 0.3, // Extra 0.3% after 50k spending
        100000: 0.5 // Extra 0.5% after 1L spending
      },

      // Annual fee waiver thresholds
      feeWaiverThresholds: {
        'basic': 50000,
        'premium': 200000,
        'super_premium': 500000
      }
    };
  }

  // Calculate rewards for a single transaction
  calculateTransactionReward(transaction, creditCard, context = {}) {
    try {
      if (!creditCard || !transaction) {
        return { reward: 0, rate: 0, details: 'Invalid input' };
      }

      const amount = transaction.amount;
      const category = transaction.category || 'others';
      const date = moment(transaction.date);
      
      // Get base reward rate for this category
      let rewardRate = this.getBaseRewardRate(creditCard, category);
      
      // Apply category-specific bonuses
      rewardRate += this.getCategoryBonus(creditCard, category, date, context);
      
      // Apply milestone bonuses
      rewardRate += this.getMilestoneBonus(creditCard, amount, context.monthlySpending || 0);
      
      // Apply special offer bonuses
      rewardRate += this.getOfferBonus(creditCard, transaction, date);
      
      // Calculate final reward amount
      const rewardAmount = (amount * rewardRate) / 100;
      
      // Apply reward caps if any
      const cappedReward = this.applyCaps(rewardAmount, creditCard, category);
      
      return {
        reward: Math.round(cappedReward * 100) / 100,
        rate: Math.round(rewardRate * 100) / 100,
        details: {
          baseRate: this.getBaseRewardRate(creditCard, category),
          bonuses: {
            category: this.getCategoryBonus(creditCard, category, date, context),
            milestone: this.getMilestoneBonus(creditCard, amount, context.monthlySpending || 0),
            offer: this.getOfferBonus(creditCard, transaction, date)
          },
          cappedAmount: cappedReward !== rewardAmount
        }
      };

    } catch (error) {
      console.error('Reward calculation error:', error);
      return { reward: 0, rate: 0, details: 'Calculation error' };
    }
  }

  // Get base reward rate for category
  getBaseRewardRate(creditCard, category) {
    // Check card-specific rates first
    if (creditCard.rewardRates && creditCard.rewardRates[category]) {
      return creditCard.rewardRates[category];
    }
    
    // Check card's primary category
    if (creditCard.primaryCategory === category) {
      return creditCard.primaryRate || 1.0;
    }
    
    // Use default rate
    return this.rewardRules.defaultRates[category] || 0.5;
  }

  // Get category-specific bonus
  getCategoryBonus(creditCard, category, date, context) {
    let bonus = 0;
    
    // Weekend dining bonus
    if (category === 'food' && (date.day() === 0 || date.day() === 6)) {
      bonus += creditCard.weekendDiningBonus || 0.5;
    }
    
    // Online shopping bonus
    if (category === 'shopping' && context.isOnline) {
      bonus += creditCard.onlineShoppingBonus || 0.5;
    }
    
    // Premium category bonuses
    if (creditCard.premiumCategories && creditCard.premiumCategories.includes(category)) {
      bonus += creditCard.premiumBonus || 1.0;
    }
    
    return bonus;
  }

  // Get milestone-based bonus
  getMilestoneBonus(creditCard, transactionAmount, monthlySpending) {
    const newMonthlySpending = monthlySpending + transactionAmount;
    let bonus = 0;
    
    // Check if this transaction crosses any milestone
    for (const [threshold, bonusRate] of Object.entries(this.rewardRules.milestoneRewards)) {
      const thresholdAmount = parseInt(threshold);
      if (monthlySpending < thresholdAmount && newMonthlySpending >= thresholdAmount) {
        bonus += bonusRate;
        break; // Only apply the first milestone crossed
      }
    }
    
    return bonus;
  }

  // Get special offer bonus
  getOfferBonus(creditCard, transaction, date) {
    let bonus = 0;
    
    if (creditCard.activeOffers) {
      creditCard.activeOffers.forEach(offer => {
        if (this.isOfferApplicable(offer, transaction, date)) {
          bonus += offer.bonusRate || 0;
        }
      });
    }
    
    return bonus;
  }

  // Check if offer is applicable to transaction
  isOfferApplicable(offer, transaction, date) {
    // Check date range
    const offerStart = moment(offer.startDate);
    const offerEnd = moment(offer.endDate);
    if (!date.isBetween(offerStart, offerEnd, null, '[]')) {
      return false;
    }
    
    // Check merchant
    if (offer.merchants && offer.merchants.length > 0) {
      const merchantMatch = offer.merchants.some(merchant => 
        transaction.description.toLowerCase().includes(merchant.toLowerCase())
      );
      if (!merchantMatch) return false;
    }
    
    // Check category
    if (offer.categories && !offer.categories.includes(transaction.category)) {
      return false;
    }
    
    // Check minimum amount
    if (offer.minAmount && transaction.amount < offer.minAmount) {
      return false;
    }
    
    return true;
  }

  // Apply reward caps
  applyCaps(rewardAmount, creditCard, category) {
    // Monthly category caps
    if (creditCard.monthlyCaps && creditCard.monthlyCaps[category]) {
      return Math.min(rewardAmount, creditCard.monthlyCaps[category]);
    }
    
    // Annual caps
    if (creditCard.annualCap) {
      return Math.min(rewardAmount, creditCard.annualCap);
    }
    
    return rewardAmount;
  }

  // Calculate total rewards for multiple transactions
  calculateTotalRewards(transactions, creditCard, options = {}) {
    const results = {
      totalReward: 0,
      totalAmount: 0,
      avgRewardRate: 0,
      categoryBreakdown: {},
      monthlyBreakdown: {},
      projections: {}
    };

    // Group transactions by month for milestone calculations
    const monthlySpending = this.groupTransactionsByMonth(transactions);
    
    // Calculate reward for each transaction
    transactions.forEach(transaction => {
      const transactionMonth = moment(transaction.date).format('YYYY-MM');
      const monthSpending = monthlySpending[transactionMonth] || 0;
      
      const rewardResult = this.calculateTransactionReward(
        transaction, 
        creditCard, 
        { 
          monthlySpending: monthSpending,
          isOnline: this.detectOnlineTransaction(transaction)
        }
      );
      
      results.totalReward += rewardResult.reward;
      results.totalAmount += transaction.amount;
      
      // Category breakdown
      if (!results.categoryBreakdown[transaction.category]) {
        results.categoryBreakdown[transaction.category] = {
          amount: 0,
          reward: 0,
          avgRate: 0,
          transactions: 0
        };
      }
      
      const categoryData = results.categoryBreakdown[transaction.category];
      categoryData.amount += transaction.amount;
      categoryData.reward += rewardResult.reward;
      categoryData.transactions++;
      categoryData.avgRate = (categoryData.reward / categoryData.amount) * 100;
      
      // Monthly breakdown
      if (!results.monthlyBreakdown[transactionMonth]) {
        results.monthlyBreakdown[transactionMonth] = {
          amount: 0,
          reward: 0,
          avgRate: 0
        };
      }
      
      const monthData = results.monthlyBreakdown[transactionMonth];
      monthData.amount += transaction.amount;
      monthData.reward += rewardResult.reward;
      monthData.avgRate = (monthData.reward / monthData.amount) * 100;
    });

    results.avgRewardRate = results.totalAmount > 0 
      ? (results.totalReward / results.totalAmount) * 100 
      : 0;
    
    // Add projections if requested
    if (options.includeProjections) {
      results.projections = this.calculateProjections(results, options);
    }
    
    return results;
  }

  // Group transactions by month
  groupTransactionsByMonth(transactions) {
    const monthly = {};
    
    transactions.forEach(transaction => {
      const month = moment(transaction.date).format('YYYY-MM');
      if (!monthly[month]) {
        monthly[month] = 0;
      }
      monthly[month] += transaction.amount;
    });
    
    return monthly;
  }

  // Detect online transaction
  detectOnlineTransaction(transaction) {
    const onlineKeywords = [
      'amazon', 'flipkart', 'myntra', 'paytm', 'phonepe', 
      'googlepay', 'upi', 'online', 'internet', 'web'
    ];
    
    const description = transaction.description.toLowerCase();
    return onlineKeywords.some(keyword => description.includes(keyword));
  }

  // Calculate projections and recommendations
  calculateProjections(currentResults, options) {
    const projections = {};
    
    // Annual projection based on current spending
    if (options.annualProjection) {
      const monthsOfData = Object.keys(currentResults.monthlyBreakdown).length;
      if (monthsOfData > 0) {
        const avgMonthlyReward = currentResults.totalReward / monthsOfData;
        const avgMonthlySpending = currentResults.totalAmount / monthsOfData;
        
        projections.annual = {
          expectedReward: Math.round(avgMonthlyReward * 12 * 100) / 100,
          expectedSpending: Math.round(avgMonthlySpending * 12 * 100) / 100,
          avgRate: currentResults.avgRewardRate
        };
      }
    }
    
    // Milestone projections
    if (options.milestoneProjections) {
      projections.milestones = this.calculateMilestoneProjections(currentResults);
    }
    
    return projections;
  }

  // Calculate milestone projections
  calculateMilestoneProjections(currentResults) {
    const projections = [];
    
    Object.entries(this.rewardRules.milestoneRewards).forEach(([threshold, bonusRate]) => {
      const thresholdAmount = parseInt(threshold);
      
      Object.entries(currentResults.monthlyBreakdown).forEach(([month, data]) => {
        if (data.amount < thresholdAmount) {
          const shortfall = thresholdAmount - data.amount;
          const potentialBonus = (data.amount * bonusRate) / 100;
          
          projections.push({
            month,
            milestone: thresholdAmount,
            currentSpending: data.amount,
            shortfall,
            potentialBonus: Math.round(potentialBonus * 100) / 100,
            recommendation: `Spend ₹${shortfall} more in ${month} to unlock ${bonusRate}% milestone bonus`
          });
        }
      });
    });
    
    return projections.slice(0, 5); // Top 5 opportunities
  }

  // Find optimal credit card for spending pattern
  findOptimalCard(transactions, availableCards) {
    const comparisons = [];
    
    availableCards.forEach(card => {
      const rewardResult = this.calculateTotalRewards(transactions, card, {
        includeProjections: true,
        annualProjection: true
      });
      
      comparisons.push({
        cardName: card.name,
        bankName: card.bank,
        totalReward: rewardResult.totalReward,
        avgRewardRate: rewardResult.avgRewardRate,
        annualFee: card.annualFee || 0,
        netBenefit: rewardResult.totalReward - (card.annualFee || 0),
        categoryBreakdown: rewardResult.categoryBreakdown,
        score: this.calculateCardScore(rewardResult, card)
      });
    });
    
    // Sort by score (highest first)
    return comparisons.sort((a, b) => b.score - a.score);
  }

  // Calculate card score for ranking
  calculateCardScore(rewardResult, card) {
    let score = 0;
    
    // Base score from reward rate
    score += rewardResult.avgRewardRate * 20;
    
    // Deduct annual fee impact
    score -= (card.annualFee || 0) / 1000;
    
    // Bonus for consistency across categories
    const categoryRates = Object.values(rewardResult.categoryBreakdown)
      .map(cat => cat.avgRate);
    const rateVariance = this.calculateVariance(categoryRates);
    score += (10 - rateVariance); // Lower variance is better
    
    // Bonus for premium features
    if (card.loungeAccess) score += 5;
    if (card.conciergeService) score += 3;
    if (card.insuranceCover) score += 2;
    
    return Math.round(score * 100) / 100;
  }

  // Calculate variance
  calculateVariance(numbers) {
    if (numbers.length === 0) return 0;
    
    const mean = numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
    const variance = numbers.reduce((sum, num) => sum + Math.pow(num - mean, 2), 0) / numbers.length;
    return Math.sqrt(variance);
  }

  // Generate reward optimization recommendations
  generateOptimizationRecommendations(transactions, currentCard, alternativeCards = []) {
    const recommendations = [];
    
    // Current performance analysis
    const currentPerformance = this.calculateTotalRewards(transactions, currentCard);
    
    // Alternative card analysis
    if (alternativeCards.length > 0) {
      const alternatives = this.findOptimalCard(transactions, alternativeCards);
      const bestAlternative = alternatives[0];
      
      if (bestAlternative.totalReward > currentPerformance.totalReward) {
        recommendations.push({
          type: 'card_switch',
          priority: 'high',
          title: 'Consider switching to a better rewards card',
          description: `${bestAlternative.cardName} could earn you ₹${Math.round((bestAlternative.totalReward - currentPerformance.totalReward) * 100) / 100} more in rewards`,
          currentCard: currentCard.name,
          recommendedCard: bestAlternative.cardName,
          additionalReward: bestAlternative.totalReward - currentPerformance.totalReward
        });
      }
    }
    
    // Category optimization
    const categoryOptimizations = this.findCategoryOptimizations(currentPerformance.categoryBreakdown, currentCard);
    recommendations.push(...categoryOptimizations);
    
    // Milestone opportunities
    const milestoneOps = this.calculateMilestoneProjections(currentPerformance);
    milestoneOps.forEach(milestone => {
      if (milestone.potentialBonus > 100) { // Only suggest if significant bonus
        recommendations.push({
          type: 'milestone',
          priority: 'medium',
          title: 'Milestone opportunity',
          description: milestone.recommendation,
          potentialBonus: milestone.potentialBonus
        });
      }
    });
    
    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  // Find category-specific optimizations
  findCategoryOptimizations(categoryBreakdown, currentCard) {
    const optimizations = [];
    
    Object.entries(categoryBreakdown).forEach(([category, data]) => {
      if (data.avgRate < 1.0 && data.amount > 5000) { // Low rate on significant spending
        optimizations.push({
          type: 'category_optimization',
          priority: 'medium',
          title: `Low rewards on ${category}`,
          description: `You're earning only ${data.avgRate.toFixed(1)}% on ₹${Math.round(data.amount)} ${category} spending. Consider using a category-specific card.`,
          category,
          currentRate: data.avgRate,
          spending: data.amount,
          suggestion: `Look for cards with higher ${category} rewards`
        });
      }
    });
    
    return optimizations.slice(0, 3); // Top 3 opportunities
  }

  // Update credit card database
  updateCreditCard(cardId, cardData) {
    this.creditCards.set(cardId, {
      ...cardData,
      lastUpdated: new Date().toISOString()
    });
  }

  // Get credit card by ID
  getCreditCard(cardId) {
    return this.creditCards.get(cardId) || null;
  }

  // List all credit cards
  listCreditCards() {
    return Array.from(this.creditCards.values());
  }
}

module.exports = new RewardsEngine();