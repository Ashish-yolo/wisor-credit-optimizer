const express = require('express');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const rewardsEngine = require('../services/rewardsEngine');

const router = express.Router();

// Calculate rewards for transactions
router.post('/calculate',
  auth,
  [
    body('transactions')
      .isArray({ min: 1 })
      .withMessage('Transactions array is required'),
    body('transactions.*.amount')
      .isNumeric()
      .withMessage('Transaction amount must be numeric'),
    body('transactions.*.date')
      .isISO8601()
      .withMessage('Transaction date must be valid'),
    body('transactions.*.category')
      .optional()
      .isString()
      .withMessage('Transaction category must be string'),
    body('creditCard')
      .isObject()
      .withMessage('Credit card object is required'),
    body('creditCard.name')
      .notEmpty()
      .withMessage('Credit card name is required'),
    body('options')
      .optional()
      .isObject()
      .withMessage('Options must be an object')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation error',
          details: errors.array()
        });
      }

      const { transactions, creditCard, options = {} } = req.body;

      // Calculate rewards
      const rewardResults = rewardsEngine.calculateTotalRewards(
        transactions,
        creditCard,
        {
          includeProjections: true,
          annualProjection: true,
          milestoneProjections: true,
          ...options
        }
      );

      res.json({
        success: true,
        results: rewardResults,
        cardName: creditCard.name,
        calculationDate: new Date().toISOString()
      });

    } catch (error) {
      console.error('Reward calculation error:', error);
      res.status(500).json({
        error: 'Failed to calculate rewards',
        message: error.message
      });
    }
  }
);

// Compare multiple credit cards
router.post('/compare',
  auth,
  [
    body('transactions')
      .isArray({ min: 1 })
      .withMessage('Transactions array is required'),
    body('creditCards')
      .isArray({ min: 2, max: 5 })
      .withMessage('2-5 credit cards required for comparison'),
    body('creditCards.*.name')
      .notEmpty()
      .withMessage('Each credit card must have a name')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation error',
          details: errors.array()
        });
      }

      const { transactions, creditCards } = req.body;

      // Find optimal card
      const comparison = rewardsEngine.findOptimalCard(transactions, creditCards);

      res.json({
        success: true,
        comparison,
        bestCard: comparison[0],
        transactionCount: transactions.length,
        comparisonDate: new Date().toISOString()
      });

    } catch (error) {
      console.error('Card comparison error:', error);
      res.status(500).json({
        error: 'Failed to compare cards',
        message: error.message
      });
    }
  }
);

// Get optimization recommendations
router.post('/optimize',
  auth,
  [
    body('transactions')
      .isArray({ min: 1 })
      .withMessage('Transactions array is required'),
    body('currentCard')
      .isObject()
      .withMessage('Current card object is required'),
    body('alternativeCards')
      .optional()
      .isArray()
      .withMessage('Alternative cards must be an array')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation error',
          details: errors.array()
        });
      }

      const { transactions, currentCard, alternativeCards = [] } = req.body;

      // Generate recommendations
      const recommendations = rewardsEngine.generateOptimizationRecommendations(
        transactions,
        currentCard,
        alternativeCards
      );

      // Also calculate current performance for context
      const currentPerformance = rewardsEngine.calculateTotalRewards(
        transactions,
        currentCard,
        { includeProjections: true }
      );

      res.json({
        success: true,
        recommendations,
        currentPerformance,
        optimizationDate: new Date().toISOString()
      });

    } catch (error) {
      console.error('Optimization error:', error);
      res.status(500).json({
        error: 'Failed to generate optimization recommendations',
        message: error.message
      });
    }
  }
);

// Calculate single transaction reward
router.post('/calculate-transaction',
  auth,
  [
    body('transaction')
      .isObject()
      .withMessage('Transaction object is required'),
    body('transaction.amount')
      .isNumeric()
      .withMessage('Transaction amount must be numeric'),
    body('transaction.date')
      .isISO8601()
      .withMessage('Transaction date must be valid'),
    body('creditCard')
      .isObject()
      .withMessage('Credit card object is required'),
    body('context')
      .optional()
      .isObject()
      .withMessage('Context must be an object')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation error',
          details: errors.array()
        });
      }

      const { transaction, creditCard, context = {} } = req.body;

      // Calculate reward for single transaction
      const rewardResult = rewardsEngine.calculateTransactionReward(
        transaction,
        creditCard,
        context
      );

      res.json({
        success: true,
        transaction,
        rewardResult,
        cardName: creditCard.name,
        calculationDate: new Date().toISOString()
      });

    } catch (error) {
      console.error('Transaction reward calculation error:', error);
      res.status(500).json({
        error: 'Failed to calculate transaction reward',
        message: error.message
      });
    }
  }
);

// Get reward projections
router.post('/projections',
  auth,
  [
    body('transactions')
      .isArray({ min: 1 })
      .withMessage('Transactions array is required'),
    body('creditCard')
      .isObject()
      .withMessage('Credit card object is required'),
    body('projectionType')
      .optional()
      .isIn(['monthly', 'quarterly', 'annual'])
      .withMessage('Projection type must be monthly, quarterly, or annual')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation error',
          details: errors.array()
        });
      }

      const { transactions, creditCard, projectionType = 'annual' } = req.body;

      // Calculate current rewards with projections
      const results = rewardsEngine.calculateTotalRewards(
        transactions,
        creditCard,
        {
          includeProjections: true,
          annualProjection: projectionType === 'annual',
          milestoneProjections: true
        }
      );

      res.json({
        success: true,
        projections: results.projections,
        currentPerformance: {
          totalReward: results.totalReward,
          avgRewardRate: results.avgRewardRate,
          categoryBreakdown: results.categoryBreakdown
        },
        projectionType,
        projectionDate: new Date().toISOString()
      });

    } catch (error) {
      console.error('Projections error:', error);
      res.status(500).json({
        error: 'Failed to generate projections',
        message: error.message
      });
    }
  }
);

// Get category analysis
router.post('/category-analysis',
  auth,
  [
    body('transactions')
      .isArray({ min: 1 })
      .withMessage('Transactions array is required'),
    body('creditCard')
      .isObject()
      .withMessage('Credit card object is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation error',
          details: errors.array()
        });
      }

      const { transactions, creditCard } = req.body;

      // Calculate rewards with detailed breakdown
      const results = rewardsEngine.calculateTotalRewards(transactions, creditCard);

      // Add additional category insights
      const categoryInsights = Object.entries(results.categoryBreakdown).map(([category, data]) => {
        const optimizationTip = this.getCategoryOptimizationTip(category, data.avgRate);
        
        return {
          category,
          ...data,
          optimizationTip,
          performanceRating: this.getCategoryPerformanceRating(data.avgRate)
        };
      });

      res.json({
        success: true,
        categoryAnalysis: categoryInsights,
        overallPerformance: {
          totalReward: results.totalReward,
          avgRewardRate: results.avgRewardRate
        },
        recommendations: this.generateCategoryRecommendations(categoryInsights),
        analysisDate: new Date().toISOString()
      });

    } catch (error) {
      console.error('Category analysis error:', error);
      res.status(500).json({
        error: 'Failed to analyze categories',
        message: error.message
      });
    }
  }
);

// Helper function for category optimization tips
function getCategoryOptimizationTip(category, rate) {
  if (rate < 1.0) {
    return `Consider using a card with better ${category} rewards`;
  } else if (rate > 2.0) {
    return `Excellent rewards rate for ${category}`;
  } else {
    return `Good rewards rate for ${category}`;
  }
}

// Helper function for performance rating
function getCategoryPerformanceRating(rate) {
  if (rate >= 2.5) return 'Excellent';
  if (rate >= 1.5) return 'Good';
  if (rate >= 1.0) return 'Average';
  return 'Poor';
}

// Helper function for category recommendations
function generateCategoryRecommendations(categoryInsights) {
  return categoryInsights
    .filter(insight => insight.performanceRating === 'Poor' && insight.amount > 5000)
    .map(insight => ({
      category: insight.category,
      currentRate: insight.avgRate,
      spending: insight.amount,
      suggestion: `Focus on improving ${insight.category} rewards - current rate of ${insight.avgRate.toFixed(1)}% is below average`
    }))
    .slice(0, 3); // Top 3 recommendations
}

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'Rewards Engine',
    status: 'healthy',
    features: [
      'Reward Calculation',
      'Card Comparison',
      'Optimization Recommendations',
      'Projections',
      'Category Analysis'
    ],
    timestamp: new Date().toISOString()
  });
});

module.exports = router;