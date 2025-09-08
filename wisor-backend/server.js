const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const Anthropic = require('@anthropic-ai/sdk');
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// CORS configuration for Chrome extension
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    // Allow Chrome extensions
    if (origin.startsWith('chrome-extension://') || 
        origin.startsWith('moz-extension://') ||
        origin === 'https://wisor-credit-optimizer.netlify.app' ||
        origin === 'https://wisor.app' ||
        origin.includes('railway.app') ||
        origin.includes('render.com') ||
        origin === 'http://localhost:3000') {
      return callback(null, true);
    }
    
    // Allow all Chrome extensions for now
    return callback(null, true);
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Claude-powered credit card recommendation endpoint
app.post('/api/recommend', async (req, res) => {
  try {
    const { 
      merchant, 
      category, 
      amount, 
      userCards, 
      context = {}
    } = req.body;

    // Validate required fields
    if (!merchant || !amount || !userCards || userCards.length === 0) {
      return res.status(400).json({ 
        error: 'Missing required fields: merchant, amount, userCards' 
      });
    }

    // Check if we should include offers (detect from context or merchant)
    const includeOffers = context.includeOffers || 
      ['amazon', 'flipkart', 'zomato', 'swiggy'].some(m => merchant.toLowerCase().includes(m));

    // Prepare enhanced context for Claude
    const prompt = `You are Wisor, an expert credit card optimization assistant for Indian consumers with real-time offer analysis.

CONTEXT:
- Merchant: ${merchant}
- Category: ${category || 'general'}
- Purchase Amount: ₹${amount}
- User's Credit Cards: ${userCards.join(', ')}
- Additional Context: ${JSON.stringify(context)}
- Current Date: ${new Date().toISOString().split('T')[0]}

ENHANCED CARDS DATABASE:
${getEnhancedCardDatabase(includeOffers)}

ANALYSIS PRIORITY:
1. Check for ACTIVE OFFERS first (these override base rewards)
2. Calculate combined value (base reward + offer bonus)
3. Consider offer expiry dates (urgent if <7 days)
4. Factor in caps and minimum spend requirements

TASK:
Recommend the OPTIMAL credit card considering both base rewards and active offers:

1. **Best Card**: Card with highest total value (base + offers)
2. **Total Reward Value**: Combined reward amount in ₹
3. **Reasoning**: Explain calculation including any active offers
4. **Urgency**: Flag if using time-sensitive offers

${includeOffers ? 'IMPORTANT: Include offer details and expiry information in your reasoning.' : ''}

Response format:
{
  "recommendedCard": "card-id",
  "rewardValue": 150,
  "reasoning": "HDFC Millennia gives 5% base + 20% Zomato offer = total ₹150 savings. Offer expires in 6 days!",
  "offerUsed": "20% off Zomato offer",
  "urgency": "high|medium|low",
  "alternative": {
    "card": "alternative-card-id", 
    "rewardValue": 100,
    "reason": "Brief alternative reason"
  }
}`;

    // Call Claude API
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    // Parse Claude's response
    let claudeResponse;
    try {
      const responseText = message.content[0].text;
      // Extract JSON from Claude's response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        claudeResponse = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback: create structured response from text
        claudeResponse = {
          recommendedCard: userCards[0],
          rewardValue: Math.round(amount * 0.01),
          reasoning: responseText.split('\n')[0] || "Smart recommendation based on your spending pattern.",
          alternative: null
        };
      }
    } catch (parseError) {
      console.error('Error parsing Claude response:', parseError);
      claudeResponse = {
        recommendedCard: userCards[0],
        rewardValue: Math.round(amount * 0.01),
        reasoning: "Optimized recommendation based on your available cards.",
        alternative: null
      };
    }

    res.json({
      success: true,
      recommendation: claudeResponse,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in /api/recommend:', error);
    console.error('Request body:', req.body);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Chat endpoint for conversational AI
app.post('/api/chat', async (req, res) => {
  try {
    const { message, context = {} } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const prompt = `You are Wisor, a helpful Indian credit card optimization assistant. 

USER'S CONTEXT:
${JSON.stringify(context)}

USER'S QUESTION: ${message}

Provide helpful, specific advice about credit cards, rewards optimization, and smart spending in India. Keep responses concise and actionable. Use ₹ for currency.`;

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    res.json({
      success: true,
      response: response.content[0].text,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in /api/chat:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
});

// Enhanced context with dynamic offers
function getEnhancedCardDatabase(includeOffers = false) {
  let database = `
CORE CARDS & REWARDS:
HDFC MILLENNIA: 5% cashback on online shopping (₹1000 cap), 5% on dining (₹1000 cap), 1% on others
HDFC REGALIA: 6 points/₹150 on dining/travel/fuel, 2 points/₹150 on others (1 point = ₹0.5)
SBI SIMPLYCLICK: 5X points on online shopping (₹1000 cap), 1 point/₹100 on others
ICICI AMAZON PAY: 5% on Amazon (Prime), 3% on Amazon (non-Prime), 1% on others  
AXIS FLIPKART: 5% unlimited on Flipkart, 4% on Myntra/Cleartrip, 1% on others
AXIS ACE: 5% on Google Pay bills, 4% on Swiggy/Zomato, 1% on others
SBI PRIME: 5 points/₹100 on dining/movies/grocery, 1 point/₹100 on others
KOTAK LEAGUE: 4 points/₹150 on fuel/utilities, 1 point/₹150 on others
AMEX GOLD: 4X points on travel/dining, 2X on fuel, 1X on others
ICICI PLATINUM: 2 points/₹100, 1% fuel surcharge waiver
`;

  if (includeOffers) {
    database += `

ACTIVE OFFERS (Priority - Use These First):
🔥 HDFC MILLENNIA: 20% off on Zomato (up to ₹100) - Expires Soon!
🔥 SBI SIMPLYCLICK: 10% instant discount on Flipkart (up to ₹1500) - Valid till Oct 31
🔥 ICICI AMAZON PAY: Extra 2% cashback during Prime events - Limited time
⚡ HDFC Cards: Additional 5% cashback on Amazon purchases - Scraped offer

OFFER ANALYSIS INSTRUCTIONS:
- ALWAYS prioritize active offers over base rewards
- Check expiry dates - flag offers expiring within 7 days
- Combine base rewards + offer benefits for total value
- Mention offer source (scraped/manual) for credibility
`;
  }

  return database;
}

// Legacy function for backward compatibility
function getCardDatabase() {
  return getEnhancedCardDatabase(false);
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something broke!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Wisor backend server running on port ${PORT}`);
  console.log(`🤖 Claude AI integration ready`);
  console.log(`🔒 CORS enabled for extensions and localhost`);
});

module.exports = app;