const express = require('express');
const { body, query, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const creditCardService = require('../services/creditCardService');

const router = express.Router();

// Get all credit cards with filtering
router.get('/',
  [
    query('bank').optional().isString().withMessage('Bank must be string'),
    query('category').optional().isString().withMessage('Category must be string'),
    query('tier').optional().isString().withMessage('Tier must be string'),
    query('maxAnnualFee').optional().isInt({ min: 0 }).withMessage('Max annual fee must be positive integer'),
    query('minRewardRate').optional().isFloat({ min: 0 }).withMessage('Min reward rate must be positive number'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1-100')
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

      const filters = {
        bank: req.query.bank,
        category: req.query.category,
        tier: req.query.tier,
        maxAnnualFee: req.query.maxAnnualFee ? parseInt(req.query.maxAnnualFee) : undefined,
        minRewardRate: req.query.minRewardRate ? parseFloat(req.query.minRewardRate) : undefined
      };

      // Remove undefined filters
      Object.keys(filters).forEach(key => {
        if (filters[key] === undefined) delete filters[key];
      });

      const cards = creditCardService.getAllCreditCards(filters);
      const limit = req.query.limit ? parseInt(req.query.limit) : 50;
      const limitedCards = cards.slice(0, limit);

      res.json({
        success: true,
        cards: limitedCards,
        totalCount: cards.length,
        filteredCount: limitedCards.length,
        filters: filters
      });

    } catch (error) {
      console.error('Get cards error:', error);
      res.status(500).json({
        error: 'Failed to fetch credit cards',
        message: error.message
      });
    }
  }
);

// Search credit cards
router.get('/search',
  [
    query('q').notEmpty().withMessage('Search query is required'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1-50')
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

      const query = req.query.q;
      const limit = req.query.limit ? parseInt(req.query.limit) : 20;

      const searchResults = creditCardService.searchCreditCards(query, limit);

      res.json({
        success: true,
        query,
        results: searchResults,
        resultCount: searchResults.length
      });

    } catch (error) {
      console.error('Search cards error:', error);
      res.status(500).json({
        error: 'Failed to search credit cards',
        message: error.message
      });
    }
  }
);

// Get specific credit card by ID
router.get('/:cardId',
  async (req, res) => {
    try {
      const { cardId } = req.params;
      const card = creditCardService.getCreditCard(cardId);

      if (!card) {
        return res.status(404).json({
          error: 'Card not found',
          message: `Credit card with ID ${cardId} not found`
        });
      }

      res.json({
        success: true,
        card
      });

    } catch (error) {
      console.error('Get card error:', error);
      res.status(500).json({
        error: 'Failed to fetch credit card',
        message: error.message
      });
    }
  }
);

// Scrape credit cards from web sources
router.post('/scrape',
  auth, // Require authentication for scraping
  [
    body('sources').optional().isIn(['all', 'banks', 'aggregators']).withMessage('Invalid source type'),
    body('maxCards').optional().isInt({ min: 1, max: 500 }).withMessage('Max cards must be between 1-500')
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

      const { sources = 'all', maxCards = 100 } = req.body;

      // Start scraping process
      const scrapeResults = await creditCardService.scrapeAllCreditCards({
        sources,
        maxCards
      });

      res.json({
        success: scrapeResults.success,
        message: scrapeResults.success ? 'Scraping completed' : 'Scraping failed',
        results: scrapeResults.summary,
        errors: scrapeResults.errors,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Scrape error:', error);
      res.status(500).json({
        error: 'Scraping failed',
        message: error.message
      });
    }
  }
);

// Add new credit card manually
router.post('/',
  auth,
  [
    body('name').notEmpty().withMessage('Card name is required'),
    body('bank').notEmpty().withMessage('Bank name is required'),
    body('annualFee').optional().isInt({ min: 0 }).withMessage('Annual fee must be non-negative integer'),
    body('rewardRate').optional().isObject().withMessage('Reward rate must be an object'),
    body('category').optional().isString().withMessage('Category must be string'),
    body('tier').optional().isString().withMessage('Tier must be string'),
    body('features').optional().isArray().withMessage('Features must be an array')
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

      const cardData = req.body;
      const newCard = creditCardService.addCreditCard(cardData);

      res.status(201).json({
        success: true,
        message: 'Credit card added successfully',
        card: newCard
      });

    } catch (error) {
      console.error('Add card error:', error);
      res.status(500).json({
        error: 'Failed to add credit card',
        message: error.message
      });
    }
  }
);

// Update existing credit card
router.put('/:cardId',
  auth,
  [
    body('name').optional().notEmpty().withMessage('Card name cannot be empty'),
    body('bank').optional().notEmpty().withMessage('Bank name cannot be empty'),
    body('annualFee').optional().isInt({ min: 0 }).withMessage('Annual fee must be non-negative integer'),
    body('rewardRate').optional().isObject().withMessage('Reward rate must be an object'),
    body('isActive').optional().isBoolean().withMessage('isActive must be boolean')
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

      const { cardId } = req.params;
      const updates = req.body;

      const updatedCard = creditCardService.updateCreditCard(cardId, updates);

      if (!updatedCard) {
        return res.status(404).json({
          error: 'Card not found',
          message: `Credit card with ID ${cardId} not found`
        });
      }

      res.json({
        success: true,
        message: 'Credit card updated successfully',
        card: updatedCard
      });

    } catch (error) {
      console.error('Update card error:', error);
      res.status(500).json({
        error: 'Failed to update credit card',
        message: error.message
      });
    }
  }
);

// Get database statistics
router.get('/stats/overview',
  async (req, res) => {
    try {
      const stats = creditCardService.getDatabaseStats();

      res.json({
        success: true,
        statistics: stats,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Get stats error:', error);
      res.status(500).json({
        error: 'Failed to fetch statistics',
        message: error.message
      });
    }
  }
);

// Get available filter options
router.get('/filters/options',
  async (req, res) => {
    try {
      const allCards = creditCardService.getAllCreditCards();
      
      const filterOptions = {
        banks: [...new Set(allCards.map(card => card.bank))].sort(),
        categories: [...new Set(allCards.map(card => card.category))].sort(),
        tiers: [...new Set(allCards.map(card => card.tier))].sort(),
        annualFeeRanges: [
          { label: 'Free', min: 0, max: 0 },
          { label: 'Under ₹1,000', min: 1, max: 999 },
          { label: '₹1,000 - ₹5,000', min: 1000, max: 5000 },
          { label: '₹5,000 - ₹10,000', min: 5001, max: 10000 },
          { label: 'Above ₹10,000', min: 10001, max: null }
        ]
      };

      res.json({
        success: true,
        filterOptions,
        totalCards: allCards.length
      });

    } catch (error) {
      console.error('Get filter options error:', error);
      res.status(500).json({
        error: 'Failed to fetch filter options',
        message: error.message
      });
    }
  }
);

// Initialize database with basic cards
router.post('/initialize',
  auth,
  async (req, res) => {
    try {
      const cardCount = await creditCardService.initializeWithBasicCards();

      res.json({
        success: true,
        message: 'Database initialized with basic credit cards',
        cardsAdded: cardCount,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Initialize error:', error);
      res.status(500).json({
        error: 'Failed to initialize database',
        message: error.message
      });
    }
  }
);

// Get trending/popular cards
router.get('/featured/trending',
  async (req, res) => {
    try {
      const allCards = creditCardService.getAllCreditCards();
      
      // Sort by popularity and rating, then take top 10
      const trendingCards = allCards
        .sort((a, b) => (b.popularity + b.userRating) - (a.popularity + a.userRating))
        .slice(0, 10);

      res.json({
        success: true,
        trendingCards,
        count: trendingCards.length
      });

    } catch (error) {
      console.error('Get trending cards error:', error);
      res.status(500).json({
        error: 'Failed to fetch trending cards',
        message: error.message
      });
    }
  }
);

// Get cards by category
router.get('/category/:categoryName',
  async (req, res) => {
    try {
      const { categoryName } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit) : 20;
      
      const categoryCards = creditCardService.getAllCreditCards({ 
        category: categoryName 
      }).slice(0, limit);

      if (categoryCards.length === 0) {
        return res.status(404).json({
          error: 'No cards found',
          message: `No credit cards found for category: ${categoryName}`
        });
      }

      res.json({
        success: true,
        category: categoryName,
        cards: categoryCards,
        count: categoryCards.length
      });

    } catch (error) {
      console.error('Get category cards error:', error);
      res.status(500).json({
        error: 'Failed to fetch category cards',
        message: error.message
      });
    }
  }
);

// Health check
router.get('/health/status', (req, res) => {
  const stats = creditCardService.getDatabaseStats();
  
  res.json({
    success: true,
    service: 'Credit Cards Service',
    status: 'healthy',
    databaseStats: {
      totalCards: stats.totalCards,
      lastUpdated: stats.lastUpdated
    },
    features: [
      'Card Database Management',
      'Web Scraping',
      'Search & Filtering',
      'Statistics & Analytics'
    ],
    timestamp: new Date().toISOString()
  });
});

module.exports = router;