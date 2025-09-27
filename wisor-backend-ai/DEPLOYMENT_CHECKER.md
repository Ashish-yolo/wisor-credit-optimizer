# 🚀 Wisor AI - Complete Deployment Setup & Checker

## 📊 Current Status

### ❌ **Backend (Render)**: Not Deployed
- **Expected URL**: `https://wisor-ai-backend.onrender.com`
- **Status**: 502 Error (service not created)
- **Action Needed**: Create Render web service

### ❌ **Frontend (Netlify)**: Not Deployed  
- **Expected URL**: `https://wisor-ai.netlify.app`
- **Status**: Not found
- **Action Needed**: Deploy frontend

### ❌ **Database (Supabase)**: Not Set Up
- **Status**: No project created
- **Action Needed**: Follow SUPABASE_SETUP.md

---

## 🎯 Complete Deployment Guide (15 minutes)

### Step 1: Set Up Supabase Database (5 minutes)

**Follow the detailed guide in `SUPABASE_SETUP.md`**

**Quick Steps:**
1. Go to https://supabase.com/dashboard
2. Create new project: `wisor-ai-database`
3. Run the SQL schema from SUPABASE_SETUP.md
4. Get your SUPABASE_URL and SUPABASE_ANON_KEY

---

### Step 2: Deploy Backend to Render (5 minutes)

#### A. Create Render Service
1. **Go to**: https://dashboard.render.com
2. **Sign up/Login** with GitHub
3. **Click**: "New +" → "Web Service"
4. **Connect Repository**: `wisor-ai-backend`
5. **Configure**:
   - **Name**: `wisor-ai-backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

#### B. Set Environment Variables
**In Render dashboard, add these exact variables:**

```bash
NODE_ENV=production
PORT=10000
ANTHROPIC_API_KEY=your_claude_api_key_here
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
JWT_SECRET=wisor_production_jwt_secret_2024_ultra_secure_key
JWT_EXPIRES_IN=24h
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
LOG_LEVEL=info
```

#### C. Deploy
1. **Click**: "Create Web Service"
2. **Wait**: 3-5 minutes for build
3. **Test**: https://wisor-ai-backend.onrender.com/health

---

### Step 3: Deploy Frontend to Netlify (5 minutes)

#### A. Create Frontend Files

Create a new folder called `wisor-frontend` with these files:

**index.html:**
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Wisor AI - Financial Assistant</title>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/tailwindcss/2.2.19/tailwind.min.css" rel="stylesheet">
    <style>
        .gradient-bg { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
        .api-card { transition: transform 0.2s, box-shadow 0.2s; }
        .api-card:hover { transform: translateY(-2px); box-shadow: 0 10px 25px rgba(0,0,0,0.15); }
        .status-indicator { animation: pulse 2s infinite; }
    </style>
</head>
<body class="gradient-bg min-h-screen">
    <div class="container mx-auto px-4 py-8">
        <div class="bg-white rounded-2xl shadow-2xl p-8 max-w-6xl mx-auto">
            <!-- Header -->
            <div class="text-center mb-8">
                <h1 class="text-4xl font-bold text-gray-800 mb-4">🤖 Wisor AI</h1>
                <p class="text-xl text-gray-600">AI-Powered Financial Assistant</p>
                <p class="text-gray-500 mt-2">Credit card optimization, statement analysis, and intelligent financial advice</p>
            </div>

            <!-- API Status -->
            <div class="bg-gray-50 rounded-xl p-6 mb-8">
                <h2 class="text-2xl font-semibold mb-4 flex items-center">
                    <span class="status-indicator inline-block w-3 h-3 bg-yellow-400 rounded-full mr-3"></span>
                    API Status
                </h2>
                <div id="api-status" class="text-lg">
                    <span class="text-yellow-600">🔄 Checking API connection...</span>
                </div>
                <div id="deployment-info" class="mt-4 text-sm text-gray-600"></div>
            </div>

            <!-- Features Grid -->
            <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <div class="api-card bg-blue-50 p-6 rounded-xl border border-blue-200">
                    <div class="text-2xl mb-3">🔐</div>
                    <h3 class="font-semibold text-blue-800">Authentication</h3>
                    <p class="text-blue-600 text-sm mt-2">Secure user registration and login</p>
                    <button onclick="testAuth()" class="mt-4 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition">Test</button>
                </div>

                <div class="api-card bg-green-50 p-6 rounded-xl border border-green-200">
                    <div class="text-2xl mb-3">🤖</div>
                    <h3 class="font-semibold text-green-800">AI Chat</h3>
                    <p class="text-green-600 text-sm mt-2">Claude AI financial assistant</p>
                    <button onclick="testAI()" class="mt-4 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition">Test</button>
                </div>

                <div class="api-card bg-purple-50 p-6 rounded-xl border border-purple-200">
                    <div class="text-2xl mb-3">📄</div>
                    <h3 class="font-semibold text-purple-800">Statement Upload</h3>
                    <p class="text-purple-600 text-sm mt-2">PDF/CSV transaction processing</p>
                    <button onclick="testUpload()" class="mt-4 bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition">Test</button>
                </div>

                <div class="api-card bg-yellow-50 p-6 rounded-xl border border-yellow-200">
                    <div class="text-2xl mb-3">💳</div>
                    <h3 class="font-semibold text-yellow-800">Credit Cards</h3>
                    <p class="text-yellow-600 text-sm mt-2">Browse card database</p>
                    <button onclick="testCards()" class="mt-4 bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition">Test</button>
                </div>

                <div class="api-card bg-red-50 p-6 rounded-xl border border-red-200">
                    <div class="text-2xl mb-3">🎯</div>
                    <h3 class="font-semibold text-red-800">Rewards Engine</h3>
                    <p class="text-red-600 text-sm mt-2">Calculate optimal rewards</p>
                    <button onclick="testRewards()" class="mt-4 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition">Test</button>
                </div>

                <div class="api-card bg-indigo-50 p-6 rounded-xl border border-indigo-200">
                    <div class="text-2xl mb-3">📊</div>
                    <h3 class="font-semibold text-indigo-800">Analytics</h3>
                    <p class="text-indigo-600 text-sm mt-2">Spending insights & trends</p>
                    <button onclick="testAnalytics()" class="mt-4 bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 transition">Test</button>
                </div>
            </div>

            <!-- Test Area -->
            <div class="bg-gray-50 rounded-xl p-6">
                <h2 class="text-2xl font-semibold mb-4">🧪 API Testing</h2>
                <div id="test-area" class="mb-4">
                    <p class="text-gray-600">Click any feature above to test the API endpoints</p>
                </div>
                <div id="response-area"></div>
            </div>

            <!-- System Info -->
            <div class="mt-8 bg-blue-50 rounded-xl p-6">
                <h2 class="text-xl font-semibold text-blue-800 mb-4">🚀 System Information</h2>
                <div class="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                        <h4 class="font-semibold text-blue-700">Backend Features:</h4>
                        <ul class="text-blue-600 mt-2 space-y-1">
                            <li>✅ Claude AI Integration</li>
                            <li>✅ Supabase Database</li>
                            <li>✅ JWT Authentication</li>
                            <li>✅ File Upload System</li>
                            <li>✅ Rewards Calculation</li>
                            <li>✅ Transaction Categorization</li>
                        </ul>
                    </div>
                    <div>
                        <h4 class="font-semibold text-blue-700">Database Tables:</h4>
                        <ul class="text-blue-600 mt-2 space-y-1">
                            <li>• Users & Authentication</li>
                            <li>• Statements & Transactions</li>
                            <li>• Credit Cards Database</li>
                            <li>• AI Conversations</li>
                            <li>• Rewards Tracking</li>
                            <li>• Analytics & Caching</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        const API_BASE = 'https://wisor-ai-backend.onrender.com';
        let authToken = localStorage.getItem('authToken');

        // Check API status on load
        window.onload = checkAPI;

        async function checkAPI() {
            try {
                const response = await fetch(`${API_BASE}/health`);
                const data = await response.json();
                
                document.getElementById('api-status').innerHTML = `
                    <span class="text-green-600">✅ API is ${data.status}</span>
                    <span class="text-gray-500 text-sm ml-4">Uptime: ${Math.round(data.uptime)}s</span>
                `;
                
                document.querySelector('.status-indicator').className = 
                    'inline-block w-3 h-3 bg-green-400 rounded-full mr-3';
                    
                document.getElementById('deployment-info').innerHTML = `
                    <strong>Backend:</strong> Deployed on Render ✅<br>
                    <strong>Frontend:</strong> Deployed on Netlify ✅<br>
                    <strong>Database:</strong> Supabase PostgreSQL ✅
                `;
            } catch (error) {
                document.getElementById('api-status').innerHTML = `
                    <span class="text-red-600">❌ API not responding</span>
                    <span class="text-gray-500 text-sm ml-4">Check Render deployment</span>
                `;
                
                document.querySelector('.status-indicator').className = 
                    'inline-block w-3 h-3 bg-red-400 rounded-full mr-3';
                    
                document.getElementById('deployment-info').innerHTML = `
                    <strong>Status:</strong> Backend not deployed. Follow deployment guide.<br>
                    <strong>Repository:</strong> <a href="https://github.com/Ashish-yolo/wisor-ai-backend" class="text-blue-500 hover:underline">GitHub</a>
                `;
            }
        }

        function testAuth() {
            document.getElementById('test-area').innerHTML = `
                <h3 class="font-semibold mb-3">User Registration Test</h3>
                <div class="grid md:grid-cols-3 gap-3">
                    <input type="text" id="name" placeholder="Name" value="Test User" class="p-2 border rounded">
                    <input type="email" id="email" placeholder="Email" value="test@wisor.com" class="p-2 border rounded">
                    <input type="password" id="password" placeholder="Password" value="Password123" class="p-2 border rounded">
                </div>
                <button onclick="register()" class="mt-3 bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600">Register</button>
                <button onclick="login()" class="mt-3 bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 ml-2">Login</button>
            `;
        }

        function testAI() {
            if (!authToken) {
                showError('Please login first to test AI features');
                return;
            }
            
            document.getElementById('test-area').innerHTML = `
                <h3 class="font-semibold mb-3">AI Chat Test</h3>
                <textarea id="ai-message" placeholder="Ask about credit cards, rewards, or financial advice..." class="w-full p-3 border rounded-lg" rows="3">What is the best credit card for fuel expenses in India?</textarea>
                <button onclick="sendAIMessage()" class="mt-3 bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600">Send to AI</button>
            `;
        }

        function testCards() {
            callAPI('/api/cards?limit=5', 'GET');
        }

        function testRewards() {
            document.getElementById('test-area').innerHTML = `
                <h3 class="font-semibold mb-3">Rewards Calculation Test</h3>
                <p class="text-gray-600 mb-3">This will test the rewards calculation engine with sample transaction data.</p>
                <button onclick="calculateSampleRewards()" class="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600">Calculate Sample Rewards</button>
            `;
        }

        function testUpload() {
            if (!authToken) {
                showError('Please login first to test file upload');
                return;
            }
            
            document.getElementById('test-area').innerHTML = `
                <h3 class="font-semibold mb-3">File Upload Test</h3>
                <input type="file" id="fileInput" accept=".pdf,.csv,.xlsx" class="mb-3 p-2 border rounded w-full">
                <button onclick="uploadFile()" class="bg-purple-500 text-white px-6 py-2 rounded-lg hover:bg-purple-600">Upload Statement</button>
            `;
        }

        function testAnalytics() {
            document.getElementById('test-area').innerHTML = `
                <h3 class="font-semibold mb-3">Analytics Test</h3>
                <p class="text-gray-600 mb-3">Test system analytics and database functions.</p>
                <button onclick="callAPI('/api/cards/stats/overview', 'GET')" class="bg-indigo-500 text-white px-6 py-2 rounded-lg hover:bg-indigo-600">Get System Stats</button>
            `;
        }

        async function register() {
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            const result = await callAPI('/api/auth/register', 'POST', { name, email, password });
            if (result && result.success) {
                authToken = result.token;
                localStorage.setItem('authToken', authToken);
                showSuccess('Registration successful! You can now test other features.');
            }
        }

        async function login() {
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            const result = await callAPI('/api/auth/login', 'POST', { email, password });
            if (result && result.success) {
                authToken = result.token;
                localStorage.setItem('authToken', authToken);
                showSuccess('Login successful! You can now test authenticated features.');
            }
        }

        async function sendAIMessage() {
            const message = document.getElementById('ai-message').value;
            await callAPI('/api/ai/chat', 'POST', { message }, true);
        }

        async function calculateSampleRewards() {
            const sampleData = {
                transactions: [
                    { amount: 500, category: 'fuel', date: '2024-01-15', description: 'Petrol Station' },
                    { amount: 1200, category: 'grocery', date: '2024-01-16', description: 'Supermarket' },
                    { amount: 800, category: 'dining', date: '2024-01-17', description: 'Restaurant' }
                ],
                creditCard: {
                    name: 'HDFC Millennia',
                    bank: 'HDFC Bank',
                    rewardRate: { default: 1.0, fuel: 2.0, dining: 2.5 }
                }
            };
            
            await callAPI('/api/rewards/calculate', 'POST', sampleData, true);
        }

        async function uploadFile() {
            const fileInput = document.getElementById('fileInput');
            const file = fileInput.files[0];
            
            if (!file) {
                showError('Please select a file first');
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
                const result = await response.json();
                showResponse(result);
            } catch (error) {
                showError('Upload failed: ' + error.message);
            }
        }

        async function callAPI(endpoint, method = 'GET', data = null, requireAuth = false) {
            try {
                const options = {
                    method,
                    headers: { 'Content-Type': 'application/json' }
                };

                if (requireAuth && authToken) {
                    options.headers.Authorization = `Bearer ${authToken}`;
                }

                if (data && method !== 'GET') {
                    options.body = JSON.stringify(data);
                }

                const response = await fetch(`${API_BASE}${endpoint}`, options);
                const result = await response.json();
                showResponse(result);
                return result;
            } catch (error) {
                showError('API call failed: ' + error.message);
                return null;
            }
        }

        function showResponse(data) {
            document.getElementById('response-area').innerHTML = `
                <div class="bg-gray-100 border border-gray-300 rounded-lg p-4 mt-4">
                    <h4 class="font-semibold text-gray-700 mb-2">API Response:</h4>
                    <pre class="text-sm text-gray-600 whitespace-pre-wrap overflow-auto max-h-96">${JSON.stringify(data, null, 2)}</pre>
                </div>
            `;
        }

        function showSuccess(message) {
            document.getElementById('response-area').innerHTML = `
                <div class="bg-green-100 border border-green-300 text-green-700 rounded-lg p-4 mt-4">
                    <strong>Success:</strong> ${message}
                </div>
            `;
        }

        function showError(message) {
            document.getElementById('response-area').innerHTML = `
                <div class="bg-red-100 border border-red-300 text-red-700 rounded-lg p-4 mt-4">
                    <strong>Error:</strong> ${message}
                </div>
            `;
        }
    </script>
</body>
</html>
```

**netlify.toml:**
```toml
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

#### B. Deploy to Netlify
1. **Go to**: https://app.netlify.com
2. **Sign up/Login**
3. **Drag and drop** your `wisor-frontend` folder
4. **Or**: Connect GitHub repo with frontend files

---

## ✅ Verification Checklist

After deployment, verify each service:

### Backend (Render)
- [ ] Service created and deployed
- [ ] Environment variables set
- [ ] Health check: `https://wisor-ai-backend.onrender.com/health`
- [ ] Returns: `{"status":"healthy","uptime":...}`

### Database (Supabase)
- [ ] Project created
- [ ] SQL schema executed (8 tables)
- [ ] Sample credit cards inserted (5 cards)
- [ ] API credentials copied

### Frontend (Netlify)
- [ ] Site deployed
- [ ] API status shows green
- [ ] All test buttons functional
- [ ] Authentication works

---

## 🎯 Final URLs

After successful deployment:

- **Backend API**: `https://wisor-ai-backend.onrender.com`
- **Frontend**: `https://wisor-ai.netlify.app` (or your custom domain)
- **Database**: Supabase dashboard
- **Repository**: https://github.com/Ashish-yolo/wisor-ai-backend

## 🚨 Troubleshooting

**If Backend fails to deploy:**
- Check Render build logs
- Verify environment variables
- Ensure GitHub repo is accessible

**If Database connection fails:**
- Verify SUPABASE_URL and SUPABASE_ANON_KEY
- Check SQL schema execution
- Test connection in Supabase dashboard

**If Frontend shows API errors:**
- Verify backend URL in frontend code
- Check CORS settings
- Test backend health endpoint directly

---

Your complete AI-powered financial assistant will be live across all three services! 🚀