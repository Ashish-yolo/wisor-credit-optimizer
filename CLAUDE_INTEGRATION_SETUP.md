# 🤖 Wisor Claude AI Integration - Setup Guide

## Overview

The Wisor Chrome extension now includes Claude AI integration for intelligent, context-aware credit card recommendations! This upgrade provides:

- **Smart AI Recommendations**: Claude analyzes your purchase context and provides personalized advice
- **Conversational Chat**: Ask questions about credit cards directly in the extension
- **Fallback Support**: Works offline with local recommendations when backend is unavailable
- **Real-time Intelligence**: Dynamic recommendations based on merchant, amount, and your spending patterns

---

## 🚀 Quick Setup (5 Minutes)

### Step 1: Start the Backend Server

```bash
# Navigate to backend directory
cd wisor-backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env file and add your Anthropic API key
# ANTHROPIC_API_KEY=your_api_key_here

# Start the server
npm run dev
```

### Step 2: Install Updated Extension

1. Download `wisor-extension-claude-v1.1.zip`
2. Extract to a folder
3. Open Chrome → Extensions → Enable Developer Mode → Load Unpacked
4. Select the extracted folder

### Step 3: Test the Integration

1. Visit Amazon.in
2. Add items to cart
3. See "🤖 Wisor AI" widget with intelligent recommendations!
4. Click extension icon → Chat with AI about credit cards

---

## 📋 Detailed Setup Instructions

### Backend Server Setup

#### 1. Get Anthropic API Key
- Visit [Anthropic Console](https://console.anthropic.com/)
- Create account/login
- Generate new API key
- Copy the key

#### 2. Configure Environment
```bash
cd wisor-backend
cp .env.example .env
```

Edit `.env`:
```
ANTHROPIC_API_KEY=your_actual_api_key_here
PORT=3001
NODE_ENV=development
CORS_ORIGIN=chrome-extension://*
```

#### 3. Install & Run
```bash
npm install
npm run dev
```

Server runs on `http://localhost:3001`

#### 4. Test Backend
```bash
# Health check
curl http://localhost:3001/health

# Test recommendation
curl -X POST http://localhost:3001/api/recommend \
  -H "Content-Type: application/json" \
  -d '{
    "merchant": "Amazon India",
    "amount": 2500,
    "userCards": ["hdfc-millennia", "sbi-simplyclick"]
  }'
```

### Extension Installation

1. **Download**: Get `wisor-extension-claude-v1.1.zip` from dist folder
2. **Extract**: Unzip to a permanent location
3. **Chrome Setup**:
   - Open `chrome://extensions/`
   - Enable "Developer mode" (top-right toggle)
   - Click "Load unpacked"
   - Select the extracted extension folder
4. **Pin Extension**: Click puzzle icon → Pin Wisor to toolbar

---

## 🎯 New Features

### 1. AI-Powered Recommendations
- **Context Analysis**: Claude understands merchant, purchase amount, your card portfolio
- **Smart Reasoning**: Get explanations like "HDFC Millennia gives 5% cashback on Amazon, earning ₹125 on this ₹2,500 purchase"
- **Personalized Advice**: Considers your spending patterns and preferences

### 2. Conversational Chat
- Click extension icon → "🤖 Ask Wisor AI"
- Ask questions like:
  - "Which card should I use for Zomato?"
  - "Should I get the HDFC Regalia card?"
  - "How can I optimize my rewards this month?"

### 3. Intelligent Loading States
- Shows "Getting AI recommendations..." while Claude processes
- Graceful fallback to local recommendations if backend unavailable

### 4. Enhanced UI
- 🤖 icon indicates AI-powered recommendations
- Chat interface in extension popup
- Better visual feedback

---

## 🔧 Configuration Options

### Backend Configuration
- **API Endpoint**: Change in `recommendation-engine.js` line 6
- **Timeout Settings**: Adjust request timeout for slower networks
- **Rate Limiting**: Modify in `server.js` for different usage patterns

### Extension Configuration
- **Fallback Mode**: Extension works offline with local rules
- **Debug Logging**: Enable in `content.js` for troubleshooting
- **API Retries**: Configure retry logic for failed requests

---

## 🧪 Testing Guide

### 1. Test AI Recommendations
1. Start backend server
2. Visit Amazon.in
3. Add items to cart (₹1000+)
4. Should see "🤖 Wisor AI" widget
5. Check console for "AI-powered" log messages

### 2. Test Chat Interface
1. Click extension icon
2. Click "💬" to open chat
3. Type: "Which card is best for online shopping?"
4. Should get intelligent AI response

### 3. Test Fallback Mode
1. Stop backend server
2. Visit Amazon cart page
3. Should see normal "💳 Wisor" widget (local recommendations)
4. Check console for "Claude API unavailable" message

---

## 🚨 Troubleshooting

### Common Issues

#### "Functions not defined" Error
- **Fix**: Clear extension cache, reload extension
- **Cause**: JavaScript loading order issues

#### Backend Connection Failed
- **Check**: Is server running on localhost:3001?
- **Fix**: Restart with `npm run dev`
- **Verify**: Visit `http://localhost:3001/health`

#### Chat Not Responding
- **Check**: Browser console for CORS errors
- **Fix**: Ensure backend CORS settings allow chrome-extension://
- **Verify**: API key is correctly set in .env

#### No AI Widget Appearing
- **Check**: Extension has host permissions for localhost
- **Fix**: Re-install extension, grant permissions
- **Verify**: Check merchant detection is working

### Debug Tips

1. **Enable Debug Logs**:
   ```javascript
   // In content.js, set to true
   const DEBUG_MODE = true;
   ```

2. **Check Backend Logs**:
   ```bash
   # Backend terminal shows request logs
   npm run dev
   ```

3. **Test API Directly**:
   ```bash
   # Test in browser console
   fetch('http://localhost:3001/api/chat', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ message: 'Hello' })
   })
   ```

---

## 🌟 What's Next?

### Planned Enhancements
1. **Cloud Deployment**: Deploy backend to Vercel/Railway for always-on access
2. **User Preferences**: Store spending patterns and preferences
3. **Advanced Analytics**: Monthly reports and insights
4. **Card Application Tracking**: Track applications through affiliate links
5. **Multi-language Support**: Hindi and other Indian languages

### Contribute
- Report issues on GitHub
- Suggest new features
- Contribute to open source development

---

## 📊 Performance & Usage

### API Costs (Estimated)
- **Claude API**: ~$0.01 per recommendation request
- **Monthly Usage**: ~$3-5 for active user (100 recommendations)
- **Chat Costs**: ~$0.005 per message

### Performance
- **Response Time**: 1-3 seconds for AI recommendations
- **Fallback**: Instant local recommendations
- **Memory Usage**: ~10MB additional for Claude integration

### Rate Limits
- **Backend**: 100 requests per 15 minutes per IP
- **Anthropic**: 10,000 tokens per minute (adjustable)

---

## 🎉 Success!

Your Wisor extension now has Claude AI integration! 

**Next Steps**:
1. Test on different shopping sites
2. Try the chat feature for credit card advice  
3. Watch your savings grow with AI-optimized recommendations

**Questions?** Check the troubleshooting section or create an issue on GitHub.

**Enjoying the AI features?** Consider starring the repository and sharing with friends!

---

*Made with ❤️ and 🤖 Claude AI*