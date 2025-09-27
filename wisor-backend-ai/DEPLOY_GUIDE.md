# 🚀 Wisor AI Backend - Deployment Guide

## Deploy to Render

### 1. Environment Variables for Render

Set these environment variables in your Render dashboard:

```
NODE_ENV=production
PORT=10000
ANTHROPIC_API_KEY=[Your Claude AI API Key]
SUPABASE_URL=[Your Supabase Project URL]
SUPABASE_ANON_KEY=[Your Supabase Anon Key]
JWT_SECRET=[Generate a secure JWT secret]
JWT_EXPIRES_IN=24h
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
LOG_LEVEL=info
```

### 2. Render Configuration

- **Build Command**: `npm install`
- **Start Command**: `npm start` 
- **Health Check Path**: `/health`
- **Auto Deploy**: Enabled

### 3. Supabase Setup

1. **Create Supabase Project**: https://supabase.com/dashboard
2. **Run Database Schema**: Copy and execute the SQL from `config/database-schema.sql`
3. **Get Environment Variables**:
   - Project URL from Settings → API
   - Anon public key from Settings → API

## Deploy Frontend to Netlify

### 1. Create Basic Frontend

```html
<!DOCTYPE html>
<html>
<head>
    <title>Wisor AI Financial Assistant</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; margin: 0; padding: 20px; }
        .container { max-width: 800px; margin: 0 auto; }
        .api-test { background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .endpoint { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #ddd; }
        .method { background: #007acc; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🤖 Wisor AI Financial Assistant</h1>
        <div class="api-test">
            <h3>API Status</h3>
            <div id="status">Checking...</div>
        </div>
        
        <div class="api-test">
            <h3>Available Endpoints</h3>
            <div class="endpoint"><span class="method">GET</span> /health</div>
            <div class="endpoint"><span class="method">POST</span> /api/auth/register</div>
            <div class="endpoint"><span class="method">POST</span> /api/ai/chat</div>
            <div class="endpoint"><span class="method">POST</span> /api/statements/upload</div>
        </div>
    </div>
    
    <script>
        fetch('https://your-render-app.onrender.com/health')
            .then(r => r.json())
            .then(data => {
                document.getElementById('status').innerHTML = 
                    `✅ API is ${data.status} (uptime: ${Math.round(data.uptime)}s)`;
            })
            .catch(() => {
                document.getElementById('status').innerHTML = '❌ API not responding';
            });
    </script>
</body>
</html>
```

### 2. Netlify Configuration

```toml
# netlify.toml
[build]
  publish = "."

[[redirects]]
  from = "/api/*"
  to = "https://your-render-app.onrender.com/api/:splat"
  status = 200
  force = true
```

## Quick Deployment Steps

1. **Push to GitHub** (already done)
2. **Create Render Web Service** from GitHub repo
3. **Set environment variables** in Render
4. **Create Supabase project** and run schema
5. **Deploy frontend** to Netlify
6. **Test all endpoints**

## Repository Information

- **GitHub**: https://github.com/Ashish-yolo/wisor-ai-backend
- **Features**: Claude AI, Supabase, File Upload, Rewards Engine
- **Status**: Production Ready 🚀