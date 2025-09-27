const express = require('express');
const { body, validationResult } = require('express-validator');
const claudeService = require('../services/claudeService');
const auth = require('../middleware/auth');

const router = express.Router();

// Chat with AI endpoint
router.post('/chat',
  auth,
  [
    body('message')
      .trim()
      .notEmpty()
      .withMessage('Message is required')
      .isLength({ min: 1, max: 1000 })
      .withMessage('Message must be between 1-1000 characters'),
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

      const { message, context = {} } = req.body;
      const userId = req.user.id;

      // Get AI response
      const aiResponse = await claudeService.getFinancialAdvice(
        userId, 
        message, 
        {
          ...context,
          userId,
          timestamp: new Date().toISOString()
        }
      );

      res.json({
        success: true,
        response: aiResponse.response,
        confidence: aiResponse.confidence,
        hasWebData: !!aiResponse.searchData,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Chat error:', error);
      res.status(500).json({
        error: 'Failed to process chat message',
        message: error.message
      });
    }
  }
);

// Analyze statement endpoint
router.post('/analyze-statement',
  auth,
  [
    body('transactions')
      .isArray({ min: 1 })
      .withMessage('Transactions array is required'),
    body('transactions.*.amount')
      .isNumeric()
      .withMessage('Transaction amount must be numeric'),
    body('transactions.*.description')
      .notEmpty()
      .withMessage('Transaction description is required'),
    body('transactions.*.date')
      .isISO8601()
      .withMessage('Transaction date must be valid ISO date'),
    body('userCards')
      .optional()
      .isArray()
      .withMessage('User cards must be an array')
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

      const { transactions, userCards = [] } = req.body;
      const userId = req.user.id;

      // Analyze statement with AI
      const analysis = await claudeService.analyzeStatement(
        userId,
        transactions,
        userCards
      );

      res.json({
        success: true,
        analysis,
        transactionCount: transactions.length,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Statement analysis error:', error);
      res.status(500).json({
        error: 'Failed to analyze statement',
        message: error.message
      });
    }
  }
);

// Get conversation summary
router.get('/conversation-summary', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const summary = claudeService.getConversationSummary(userId);
    
    res.json({
      success: true,
      summary,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Conversation summary error:', error);
    res.status(500).json({
      error: 'Failed to get conversation summary',
      message: error.message
    });
  }
});

// Clear conversation history
router.delete('/conversation', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    claudeService.clearConversation(userId);
    
    res.json({
      success: true,
      message: 'Conversation history cleared',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Clear conversation error:', error);
    res.status(500).json({
      error: 'Failed to clear conversation',
      message: error.message
    });
  }
});

// Web search endpoint
router.post('/search',
  auth,
  [
    body('query')
      .trim()
      .notEmpty()
      .withMessage('Search query is required')
      .isLength({ min: 3, max: 200 })
      .withMessage('Query must be between 3-200 characters'),
    body('maxResults')
      .optional()
      .isInt({ min: 1, max: 10 })
      .withMessage('Max results must be between 1-10')
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

      const { query, maxResults = 5 } = req.body;
      
      // Perform web search
      const searchResults = await claudeService.webSearch(query, maxResults);
      
      res.json({
        success: true,
        query,
        results: searchResults,
        resultCount: searchResults.length,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Web search error:', error);
      res.status(500).json({
        error: 'Failed to perform web search',
        message: error.message
      });
    }
  }
);

// Credit card recommendation endpoint
router.post('/recommend',
  [
    body('merchant')
      .trim()
      .notEmpty()
      .withMessage('Merchant is required'),
    body('cartValue')
      .optional()
      .isNumeric()
      .withMessage('Cart value must be numeric'),
    body('userCards')
      .optional()
      .isArray()
      .withMessage('User cards must be an array')
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

      const { merchant, cartValue = 0, userCards = [] } = req.body;
      
      // Build recommendation prompt
      const recommendationPrompt = `As a credit card expert, recommend the best credit card for a purchase at ${merchant} with cart value ₹${cartValue}.

Available cards:
${userCards.map(card => `- ${card.card_name} (${card.network})`).join('\n') || 'No user cards provided'}

Consider:
1. Merchant-specific offers and cashback rates
2. Cart value and potential rewards
3. Current promotions and benefits
4. Overall value proposition

Provide a concise recommendation with:
- Recommended card name
- Expected reward/cashback amount
- Brief reasoning (max 50 words)

Response format:
{
  "recommendedCard": "card_name",
  "rewardValue": number,
  "reasoning": "brief explanation"
}`;

      // Get AI recommendation
      const aiResponse = await claudeService.getFinancialAdvice(
        'extension_user', 
        recommendationPrompt,
        {
          merchant,
          cartValue,
          userCards,
          type: 'recommendation'
        }
      );

      // Parse AI response
      let recommendation = {
        recommendedCard: userCards[0]?.card_name || null,
        rewardValue: Math.round(cartValue * 0.01),
        reasoning: "Default recommendation"
      };

      try {
        // Try to parse JSON from AI response
        const jsonMatch = aiResponse.response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          recommendation = {
            recommendedCard: parsed.recommendedCard,
            rewardValue: parsed.rewardValue || recommendation.rewardValue,
            reasoning: parsed.reasoning || recommendation.reasoning
          };
        }
      } catch (parseError) {
        console.log('Could not parse AI response as JSON, using fallback');
      }

      res.json({
        success: true,
        recommendation,
        merchant,
        cartValue,
        aiPowered: true,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Recommendation error:', error);
      
      // Fallback recommendation
      const { merchant, cartValue = 0, userCards = [] } = req.body;
      const fallbackRecommendation = {
        recommendedCard: userCards[0]?.card_name || null,
        rewardValue: Math.round(cartValue * 0.01),
        reasoning: "Fallback recommendation due to AI service unavailability"
      };

      res.json({
        success: true,
        recommendation: fallbackRecommendation,
        merchant,
        cartValue,
        aiPowered: false,
        fallback: true,
        timestamp: new Date().toISOString()
      });
    }
  }
);

// Health check for AI service
router.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'AI Service',
    status: 'healthy',
    features: [
      'Claude AI Integration',
      'Web Search Capabilities',
      'Conversation Management',
      'Statement Analysis'
    ],
    timestamp: new Date().toISOString()
  });
});

module.exports = router;