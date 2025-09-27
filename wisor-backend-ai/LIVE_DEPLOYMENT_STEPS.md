# 🚀 Live Deployment Steps - Wisor AI Backend

## Status: Ready for Deployment
- ✅ Code in GitHub: https://github.com/Ashish-yolo/wisor-ai-backend
- ⏳ Render: Ready to deploy
- ⏳ Netlify: Ready to deploy

---

## 1. Deploy Backend to Render (5 minutes)

### Step 1: Create Render Account & Service
1. **Go to**: https://dashboard.render.com
2. **Sign up/Login** with GitHub account
3. **Click**: "New +" → "Web Service"
4. **Connect Repository**: Select `wisor-ai-backend`
5. **Configure**:
   - **Name**: `wisor-ai-backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free (for testing)

### Step 2: Set Environment Variables
**In Render dashboard, add these environment variables:**

```bash
NODE_ENV=production
PORT=10000
ANTHROPIC_API_KEY=your_claude_api_key_here
JWT_SECRET=wisor_production_jwt_secret_2024_secure_key
JWT_EXPIRES_IN=24h
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
LOG_LEVEL=info
```

### Step 3: Deploy
1. **Click**: "Create Web Service"
2. **Wait**: 3-5 minutes for build
3. **Test**: Your API will be at `https://wisor-ai-backend.onrender.com`

---

## 2. Set up Supabase Database (5 minutes)

### Step 1: Create Supabase Project
1. **Go to**: https://supabase.com/dashboard
2. **Sign up/Login**
3. **Click**: "New Project"
4. **Configure**:
   - **Name**: `wisor-ai-database`
   - **Database Password**: Choose secure password
   - **Region**: Closest to your users

### Step 2: Run Database Schema
1. **Go to**: SQL Editor in Supabase dashboard
2. **Copy entire content** from `config/database-schema.sql`
3. **Paste and Run** the SQL
4. **Verify**: Tables created successfully

### Step 3: Get Database URLs
1. **Go to**: Settings → API
2. **Copy**:
   - **Project URL**: `https://your-project.supabase.co`
   - **Anon public key**: `eyJhbGciOiJ...`

### Step 4: Update Render Environment Variables
**Add to your Render service:**
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
```

---

## 3. Deploy Frontend to Netlify (3 minutes)

### Step 1: Create Frontend Files
Create a new folder and files:

```html
<!-- index.html -->
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Wisor AI - Financial Assistant</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .container {
            background: white;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
        }
        .status-card {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            border-left: 4px solid #28a745;
        }
        .api-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }
        .endpoint-card {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            border: 1px solid #dee2e6;
        }
        .method {
            background: #007bff;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
            display: inline-block;
            margin-bottom: 10px;
        }
        .method.post { background: #28a745; }
        .method.put { background: #ffc107; color: #000; }
        .method.delete { background: #dc3545; }
        .test-section {
            background: #e9ecef;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        .btn {
            background: #007bff;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            margin: 5px;
        }
        .btn:hover { background: #0056b3; }
        input, textarea {
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            margin: 5px 0;
        }
        .response {
            background: #d4edda;
            border: 1px solid #c3e6cb;
            border-radius: 4px;
            padding: 10px;
            margin: 10px 0;
            font-family: monospace;
            white-space: pre-wrap;
        }
        .error {
            background: #f8d7da;
            border: 1px solid #f5c6cb;
            color: #721c24;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🤖 Wisor AI Financial Assistant</h1>
            <p>AI-powered backend system for intelligent financial advice and credit card optimization</p>
        </div>

        <div class="status-card">
            <h3>🚀 API Status</h3>
            <div id="api-status">Checking API connection...</div>
        </div>

        <div class="api-grid">
            <div class="endpoint-card">
                <div class="method">GET</div>
                <h4>/health</h4>
                <p>System health check</p>
                <button class="btn" onclick="testHealth()">Test</button>
            </div>

            <div class="endpoint-card">
                <div class="method post">POST</div>
                <h4>/api/auth/register</h4>
                <p>User registration</p>
                <button class="btn" onclick="showRegisterForm()">Test</button>
            </div>

            <div class="endpoint-card">
                <div class="method post">POST</div>
                <h4>/api/auth/login</h4>
                <p>User authentication</p>
                <button class="btn" onclick="showLoginForm()">Test</button>
            </div>

            <div class="endpoint-card">
                <div class="method post">POST</div>
                <h4>/api/ai/chat</h4>
                <p>AI financial assistant</p>
                <button class="btn" onclick="showChatForm()">Test</button>
            </div>

            <div class="endpoint-card">
                <div class="method post">POST</div>
                <h4>/api/statements/upload</h4>
                <p>Upload PDF/CSV statements</p>
                <button class="btn" onclick="showUploadForm()">Test</button>
            </div>

            <div class="endpoint-card">
                <div class="method">GET</div>
                <h4>/api/cards</h4>
                <p>Browse credit cards</p>
                <button class="btn" onclick="testCards()">Test</button>
            </div>
        </div>

        <div class="test-section">
            <h3>🧪 API Testing</h3>
            <div id="test-forms"></div>
            <div id="response-area"></div>
        </div>

        <div class="status-card">
            <h3>📊 System Features</h3>
            <ul>
                <li>✅ Claude AI Integration - Intelligent financial advice</li>
                <li>✅ Statement Processing - PDF/CSV transaction extraction</li>
                <li>✅ Reward Optimization - Find best credit cards</li>
                <li>✅ Transaction Categorization - AI-powered classification</li>
                <li>✅ Secure Authentication - JWT-based user management</li>
                <li>✅ Credit Card Database - 1000+ cards with web scraping</li>
                <li>✅ Real-time Analytics - Spending insights and trends</li>
                <li>✅ File Upload System - Secure PDF/CSV processing</li>
            </ul>
        </div>
    </div>

    <script>
        const API_BASE = 'https://wisor-ai-backend.onrender.com';
        let authToken = localStorage.getItem('authToken');

        // Check API status on load
        window.onload = function() {
            testHealth();
        };

        async function testHealth() {
            try {
                const response = await fetch(`${API_BASE}/health`);
                const data = await response.json();
                document.getElementById('api-status').innerHTML = 
                    `✅ API is ${data.status} (uptime: ${Math.round(data.uptime)}s)`;
            } catch (error) {
                document.getElementById('api-status').innerHTML = 
                    `❌ API not responding. Check if deployed to Render.`;
            }
        }

        function showRegisterForm() {
            document.getElementById('test-forms').innerHTML = `
                <h4>User Registration</h4>
                <input type="text" id="reg-name" placeholder="Name" value="Test User">
                <input type="email" id="reg-email" placeholder="Email" value="test@example.com">
                <input type="password" id="reg-password" placeholder="Password" value="Password123">
                <button class="btn" onclick="register()">Register</button>
            `;
        }

        function showLoginForm() {
            document.getElementById('test-forms').innerHTML = `
                <h4>User Login</h4>
                <input type="email" id="login-email" placeholder="Email" value="test@example.com">
                <input type="password" id="login-password" placeholder="Password" value="Password123">
                <button class="btn" onclick="login()">Login</button>
            `;
        }

        function showChatForm() {
            document.getElementById('test-forms').innerHTML = `
                <h4>AI Chat</h4>
                <textarea id="chat-message" placeholder="Ask about credit cards, rewards, or financial advice..." rows="3">What is the best credit card for fuel expenses in India?</textarea>
                <button class="btn" onclick="chat()">Send Message</button>
                <p><small>Note: Requires authentication token from login</small></p>
            `;
        }

        function showUploadForm() {
            document.getElementById('test-forms').innerHTML = `
                <h4>File Upload</h4>
                <input type="file" id="file-upload" accept=".pdf,.csv,.xlsx">
                <button class="btn" onclick="uploadFile()">Upload Statement</button>
                <p><small>Note: Requires authentication token from login</small></p>
            `;
        }

        async function register() {
            const name = document.getElementById('reg-name').value;
            const email = document.getElementById('reg-email').value;
            const password = document.getElementById('reg-password').value;

            try {
                const response = await fetch(`${API_BASE}/api/auth/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password })
                });
                const data = await response.json();
                
                if (data.success) {
                    authToken = data.token;
                    localStorage.setItem('authToken', authToken);
                }
                
                showResponse(data);
            } catch (error) {
                showResponse({ error: error.message }, true);
            }
        }

        async function login() {
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            try {
                const response = await fetch(`${API_BASE}/api/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                const data = await response.json();
                
                if (data.success) {
                    authToken = data.token;
                    localStorage.setItem('authToken', authToken);
                }
                
                showResponse(data);
            } catch (error) {
                showResponse({ error: error.message }, true);
            }
        }

        async function chat() {
            if (!authToken) {
                showResponse({ error: 'Please login first to use AI chat' }, true);
                return;
            }

            const message = document.getElementById('chat-message').value;

            try {
                const response = await fetch(`${API_BASE}/api/ai/chat`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`
                    },
                    body: JSON.stringify({ message })
                });
                const data = await response.json();
                showResponse(data);
            } catch (error) {
                showResponse({ error: error.message }, true);
            }
        }

        async function testCards() {
            try {
                const response = await fetch(`${API_BASE}/api/cards?limit=5`);
                const data = await response.json();
                showResponse(data);
            } catch (error) {
                showResponse({ error: error.message }, true);
            }
        }

        async function uploadFile() {
            if (!authToken) {
                showResponse({ error: 'Please login first to upload files' }, true);
                return;
            }

            const fileInput = document.getElementById('file-upload');
            const file = fileInput.files[0];

            if (!file) {
                showResponse({ error: 'Please select a file' }, true);
                return;
            }

            const formData = new FormData();
            formData.append('statements', file);

            try {
                const response = await fetch(`${API_BASE}/api/statements/upload`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${authToken}` },
                    body: formData
                });
                const data = await response.json();
                showResponse(data);
            } catch (error) {
                showResponse({ error: error.message }, true);
            }
        }

        function showResponse(data, isError = false) {
            const responseArea = document.getElementById('response-area');
            const className = isError ? 'response error' : 'response';
            responseArea.innerHTML = `<div class="${className}">${JSON.stringify(data, null, 2)}</div>`;
        }
    </script>
</body>
</html>
```

```toml
# netlify.toml
[build]
  publish = "."

[[redirects]]
  from = "/api/*"
  to = "https://wisor-ai-backend.onrender.com/api/:splat"
  status = 200
  force = true

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
```

### Step 2: Deploy to Netlify
1. **Go to**: https://app.netlify.com
2. **Sign up/Login**
3. **Drag and drop** your frontend folder
4. **Or connect GitHub** and create new repo with frontend files

---

## 4. Test Complete System

### Backend Tests (Render)
```bash
# Health check
curl https://wisor-ai-backend.onrender.com/health

# Register user
curl -X POST https://wisor-ai-backend.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"Password123"}'
```

### Frontend Tests (Netlify)
- Visit your Netlify URL
- Test API connections
- Register and login
- Try AI chat features

---

## 🎯 Current Status

**✅ Ready for Deployment:**
- Backend code in GitHub
- Database schema ready
- Environment variables documented
- Frontend interface created

**⏳ Manual Steps Needed:**
1. Create Render web service (5 min)
2. Set up Supabase database (5 min)
3. Deploy Netlify frontend (3 min)

**🚀 After Deployment:**
- Backend: `https://wisor-ai-backend.onrender.com`
- Frontend: `https://your-app.netlify.app`
- Database: Supabase PostgreSQL with analytics

Total deployment time: **~15 minutes**