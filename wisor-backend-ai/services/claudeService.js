const Anthropic = require('@anthropic-ai/sdk');
const axios = require('axios');

class ClaudeService {
  constructor() {
    if (!process.env.ANTHROPIC_API_KEY) {
      console.warn('⚠️  ANTHROPIC_API_KEY not set - AI features will be limited');
      this.client = null;
    } else {
      this.client = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
    }
    this.conversationHistory = new Map(); // Store conversation contexts
  }

  // Initialize conversation for a user
  initializeConversation(userId) {
    if (!this.conversationHistory.has(userId)) {
      this.conversationHistory.set(userId, []);
    }
  }

  // Add message to conversation history
  addToConversation(userId, role, content) {
    this.initializeConversation(userId);
    const history = this.conversationHistory.get(userId);
    history.push({ role, content });
    
    // Keep only last 20 messages to manage context length
    if (history.length > 20) {
      history.splice(0, history.length - 20);
    }
  }

  // Web search function for real-time data
  async webSearch(query, maxResults = 5) {
    try {
      // Using SerpAPI for web search
      if (process.env.SERP_API_KEY) {
        const response = await axios.get('https://serpapi.com/search', {
          params: {
            q: query,
            api_key: process.env.SERP_API_KEY,
            engine: 'google',
            num: maxResults,
            hl: 'en',
            gl: 'in'
          }
        });

        const results = response.data.organic_results || [];
        return results.map(result => ({
          title: result.title,
          link: result.link,
          snippet: result.snippet
        }));
      }

      // Fallback: Mock search results for development
      return [
        {
          title: `Credit card information for: ${query}`,
          link: 'https://example.com',
          snippet: 'Mock search result for development'
        }
      ];
    } catch (error) {
      console.error('Web search error:', error.message);
      return [];
    }
  }

  // Get financial advice with context
  async getFinancialAdvice(userId, userMessage, context = {}) {
    try {
      if (!this.client) {
        throw new Error('Claude AI client not initialized - check ANTHROPIC_API_KEY');
      }
      
      this.addToConversation(userId, 'user', userMessage);
      
      // Gather relevant web search data if needed
      let webData = '';
      if (this.needsWebSearch(userMessage)) {
        const searchQuery = this.extractSearchQuery(userMessage);
        const searchResults = await this.webSearch(searchQuery);
        
        webData = searchResults.length > 0 
          ? `\n\nRecent web search results:\n${searchResults.map(r => 
              `- ${r.title}: ${r.snippet}`
            ).join('\n')}`
          : '';
      }

      // Build system prompt
      const systemPrompt = this.buildSystemPrompt(context, webData);
      
      // Get conversation history
      const history = this.conversationHistory.get(userId) || [];
      
      // Build messages for Claude
      const messages = [
        ...history.slice(-10), // Last 10 messages for context
        { role: 'user', content: userMessage }
      ];

      const response = await this.client.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1500,
        temperature: 0.3,
        system: systemPrompt,
        messages: messages
      });

      const aiResponse = response.content[0].text;
      this.addToConversation(userId, 'assistant', aiResponse);

      return {
        response: aiResponse,
        searchData: webData ? 'Used real-time web data' : null,
        confidence: this.calculateConfidence(userMessage, context)
      };

    } catch (error) {
      console.error('Claude API error:', error);
      throw new Error('Failed to get AI response');
    }
  }

  // Analyze credit card statement
  async analyzeStatement(userId, transactions, userCards = []) {
    try {
      const analysisPrompt = `Analyze these credit card transactions and provide insights:

Transactions:
${transactions.map(t => `${t.date}: ${t.description} - ₹${t.amount} (${t.category})`).join('\n')}

User's Cards:
${userCards.map(c => `${c.name} - ${c.rewardRate}% rewards on ${c.category}`).join('\n')}

Please provide:
1. Spending breakdown by category
2. Potential reward optimizations
3. Unusual spending patterns
4. Money-saving recommendations
5. Credit health insights`;

      const response = await this.client.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 2000,
        temperature: 0.2,
        system: this.getAnalysisSystemPrompt(),
        messages: [{ role: 'user', content: analysisPrompt }]
      });

      return response.content[0].text;
    } catch (error) {
      console.error('Statement analysis error:', error);
      throw new Error('Failed to analyze statement');
    }
  }

  // Check if message needs web search
  needsWebSearch(message) {
    const searchKeywords = [
      'credit card', 'bank', 'current', 'latest', 'new', 'recent',
      'offers', 'interest rate', 'reward rate', 'cashback', 'points'
    ];
    
    return searchKeywords.some(keyword => 
      message.toLowerCase().includes(keyword)
    );
  }

  // Extract search query from user message
  extractSearchQuery(message) {
    // Simple extraction - can be enhanced with NLP
    if (message.includes('credit card')) {
      return `credit card offers India ${new Date().getFullYear()}`;
    }
    if (message.includes('bank')) {
      return `bank offers rewards India ${new Date().getFullYear()}`;
    }
    return `financial advice India ${new Date().getFullYear()}`;
  }

  // Build system prompt with context
  buildSystemPrompt(context, webData) {
    return `You are Wisor, an expert AI financial advisor specializing in Indian credit cards and personal finance.

Your expertise includes:
- Credit card rewards optimization
- Financial planning and budgeting
- Transaction analysis and categorization
- Indian banking system and regulations
- Cashback and points maximization strategies

Guidelines:
1. Always provide accurate, helpful financial advice
2. Explain complex concepts in simple terms
3. Focus on practical, actionable recommendations
4. Consider Indian financial context and regulations
5. Ask clarifying questions when needed
6. Be concise but comprehensive

${context.userCards ? `User's Credit Cards: ${JSON.stringify(context.userCards)}` : ''}
${context.recentTransactions ? `Recent Transactions: ${JSON.stringify(context.recentTransactions)}` : ''}
${webData}

Remember: Always prioritize user's financial well-being and provide responsible advice.`;
  }

  // Get analysis system prompt
  getAnalysisSystemPrompt() {
    return `You are Wisor, an expert financial analyst specializing in credit card statement analysis.

Analyze transactions and provide:
1. Clear spending patterns and insights
2. Reward optimization opportunities
3. Potential areas for savings
4. Financial health indicators
5. Actionable recommendations

Focus on Indian financial context and be practical with your suggestions.`;
  }

  // Calculate response confidence
  calculateConfidence(message, context) {
    let confidence = 0.7; // Base confidence
    
    if (context.userCards && context.userCards.length > 0) confidence += 0.1;
    if (context.recentTransactions && context.recentTransactions.length > 0) confidence += 0.1;
    if (this.needsWebSearch(message)) confidence += 0.1;
    
    return Math.min(confidence, 1.0);
  }

  // Clear conversation history
  clearConversation(userId) {
    this.conversationHistory.delete(userId);
  }

  // Get conversation summary
  getConversationSummary(userId) {
    const history = this.conversationHistory.get(userId) || [];
    return {
      messageCount: history.length,
      lastMessage: history[history.length - 1] || null
    };
  }
}

module.exports = new ClaudeService();