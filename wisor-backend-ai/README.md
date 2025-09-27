# 🤖 Wisor-C: AI-Powered Credit Card Optimization Backend

> **Project Name**: Wisor-C (Wisor Credit Card AI Assistant)  
> **Status**: Production Ready 🚀  
> **Repository**: https://github.com/Ashish-yolo/wisor-ai-backend

A comprehensive AI-powered backend system for Wisor financial assistant that processes credit card statements and provides intelligent financial advice using Claude AI.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (optional)
- Redis (optional)
- Anthropic API key (for Claude AI)

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys and database URLs
   ```

3. **Start the server:**
   ```bash
   npm start
   ```

   For development with auto-reload:
   ```bash
   npm run dev
   ```

### 🌐 Server Information
- **URL:** http://localhost:3001
- **Health Check:** http://localhost:3001/health
- **Environment:** Development
- **Status:** ✅ Running

## 📋 Features

### ✅ Completed Features

1. **Express.js Server with Security**
   - Helmet for security headers
   - CORS configuration
   - Rate limiting
   - Request validation
   - Compression middleware

2. **Claude AI Integration**
   - Intelligent financial advice
   - Web search capabilities
   - Conversation management
   - Context-aware responses

3. **File Upload System**
   - PDF/CSV statement uploads
   - Secure file handling
   - Automatic cleanup
   - Size and type validation

4. **Statement Processing**
   - PDF text extraction
   - CSV parsing
   - Excel file support
   - Transaction categorization

5. **Rewards Calculation Engine**
   - Multi-card comparison
   - Category-based rewards
   - Milestone tracking
   - Optimization recommendations

6. **Transaction Categorization**
   - AI-powered categorization
   - Rule-based classification
   - User pattern learning
   - Indian merchant database

7. **Credit Card Database**
   - Web scraping capabilities
   - Real-time data updates
   - Comprehensive card info
   - Search and filtering

8. **Authentication System**
   - JWT-based auth
   - User registration/login
   - Profile management
   - Password security

9. **Database Integration**
   - MongoDB support
   - Redis caching
   - Session management
   - Rate limiting

## 🔗 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile

### AI Services
- `POST /api/ai/chat` - Chat with AI assistant
- `POST /api/ai/analyze-statement` - AI statement analysis
- `POST /api/ai/search` - Web search

### Statement Processing
- `POST /api/statements/upload` - Upload statement files
- `POST /api/statements/parse/:fileId` - Parse statement
- `POST /api/statements/analyze/:fileId` - Analyze with AI

### Rewards Calculation
- `POST /api/rewards/calculate` - Calculate rewards
- `POST /api/rewards/compare` - Compare credit cards
- `POST /api/rewards/optimize` - Get optimization tips

### Credit Cards
- `GET /api/cards` - List all cards
- `GET /api/cards/search` - Search cards
- `POST /api/cards/scrape` - Scrape web data

## 🛠 Configuration

### Environment Variables

```bash
# Server Configuration
PORT=3001
NODE_ENV=development

# Claude AI Configuration
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Database Configuration (optional)
MONGODB_URI=mongodb://localhost:27017/wisor-ai
REDIS_URL=redis://localhost:6379

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=24h

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
```

## 📊 System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client App    │    │  Wisor Backend  │    │   Claude AI     │
│                 │◄──►│                 │◄──►│                 │
│ (Mobile/Web)    │    │   Express.js    │    │   Anthropic     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │   Data Layer    │
                    │                 │
                    │ MongoDB + Redis │
                    └─────────────────┘
```

## 🔧 Development

### Available Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server
- `npm test` - Run tests
- `npm run lint` - Run ESLint

### Project Structure
```
wisor-backend-ai/
├── config/           # Database configuration
├── middleware/       # Express middlewares
├── routes/          # API route handlers
├── services/        # Business logic services
├── uploads/         # File upload directory
├── logs/           # Application logs
├── .env            # Environment variables
└── server.js       # Main server file
```

## 🧪 Testing

### Health Checks
```bash
# Server health
curl http://localhost:3001/health

# Service health checks
curl http://localhost:3001/api/ai/health
curl http://localhost:3001/api/cards/health/status
curl http://localhost:3001/api/statements/health
curl http://localhost:3001/api/rewards/health
curl http://localhost:3001/api/auth/health
```

### Example Usage

1. **Register a user:**
   ```bash
   curl -X POST http://localhost:3001/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"name":"John Doe","email":"john@example.com","password":"Password123"}'
   ```

2. **Upload and analyze statement:**
   ```bash
   # Upload file
   curl -X POST http://localhost:3001/api/statements/upload \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -F "statements=@statement.pdf"
   
   # Parse and analyze
   curl -X POST http://localhost:3001/api/statements/parse/FILE_ID \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

3. **Chat with AI:**
   ```bash
   curl -X POST http://localhost:3001/api/ai/chat \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"message":"What is the best credit card for fuel expenses?"}'
   ```

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting
- Input validation
- File upload security
- CORS protection
- Security headers

## 📈 Performance Features

- Redis caching
- Connection pooling
- Request compression
- Background processing
- Optimized queries

## 🚧 Future Enhancements

- Real-time notifications
- Advanced ML models
- Integration with more banks
- Mobile app SDK
- Dashboard analytics
- Automated insights

## 📞 Support

For questions or issues:
1. Check the health endpoints
2. Review server logs
3. Verify environment configuration
4. Ensure all dependencies are installed

## 📄 License

MIT License - see LICENSE file for details.