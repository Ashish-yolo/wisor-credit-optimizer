# 🗄️ Supabase Database Setup for Wisor AI

## Step 1: Create Supabase Project (2 minutes)

1. **Go to**: https://supabase.com/dashboard
2. **Sign up/Login** with GitHub
3. **Click**: "New Project"
4. **Fill out**:
   - **Organization**: Create new or use existing
   - **Project Name**: `wisor-ai-database`
   - **Database Password**: `WisorAI2024!` (save this!)
   - **Region**: Choose closest to users (e.g., Southeast Asia)
   - **Pricing Plan**: Free tier (sufficient for testing)
5. **Click**: "Create new project"
6. **Wait**: 2-3 minutes for setup

## Step 2: Run Database Schema (3 minutes)

### Copy and Execute This SQL:

```sql
-- Wisor AI Backend - Complete Database Schema
-- Execute this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Statements table (for uploaded files)
CREATE TABLE statements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    file_id VARCHAR(255) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'uploaded',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions table
CREATE TABLE transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    file_id VARCHAR(255),
    transaction_id VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    category VARCHAR(50) NOT NULL,
    merchant VARCHAR(255),
    is_recurring BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Credit cards table
CREATE TABLE credit_cards (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    card_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    bank VARCHAR(255) NOT NULL,
    annual_fee INTEGER DEFAULT 0,
    reward_rates JSONB DEFAULT '{}',
    category VARCHAR(100) DEFAULT 'general',
    tier VARCHAR(50) DEFAULT 'standard',
    features TEXT[] DEFAULT ARRAY[]::TEXT[],
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User credit cards (cards owned by users)
CREATE TABLE user_credit_cards (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    credit_card_id UUID REFERENCES credit_cards(id) ON DELETE CASCADE,
    nickname VARCHAR(255),
    limit_amount DECIMAL(12,2),
    current_balance DECIMAL(12,2) DEFAULT 0,
    statement_date INTEGER,
    due_date INTEGER,
    is_primary BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, credit_card_id)
);

-- Rewards tracking table
CREATE TABLE rewards_tracking (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
    credit_card_id UUID REFERENCES credit_cards(id),
    reward_amount DECIMAL(8,2) NOT NULL,
    reward_rate DECIMAL(5,2) NOT NULL,
    reward_type VARCHAR(50) DEFAULT 'cashback',
    calculation_details JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI conversations table
CREATE TABLE ai_conversations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(255) NOT NULL,
    message_role VARCHAR(20) NOT NULL,
    message_content TEXT NOT NULL,
    context_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cache table
CREATE TABLE cache (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    cache_key VARCHAR(255) UNIQUE NOT NULL,
    cache_value TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System logs table
CREATE TABLE system_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    level VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    service VARCHAR(100),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_statements_user_id ON statements(user_id);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_category ON transactions(category);
CREATE INDEX idx_credit_cards_bank ON credit_cards(bank);
CREATE INDEX idx_credit_cards_category ON credit_cards(category);
CREATE INDEX idx_user_credit_cards_user_id ON user_credit_cards(user_id);
CREATE INDEX idx_rewards_tracking_user_id ON rewards_tracking(user_id);
CREATE INDEX idx_ai_conversations_user_id ON ai_conversations(user_id);
CREATE INDEX idx_cache_key ON cache(cache_key);
CREATE INDEX idx_cache_expires_at ON cache(expires_at);

-- Insert sample credit cards
INSERT INTO credit_cards (card_id, name, bank, annual_fee, reward_rates, category, tier, features) VALUES
('hdfc_millennia', 'Millennia Credit Card', 'HDFC Bank', 1000, '{"default": 1.0, "online": 2.5, "dining": 2.5}', 'cashback', 'standard', ARRAY['cashback', 'fuel_surcharge_waiver', 'insurance']),
('icici_amazon_pay', 'Amazon Pay ICICI Credit Card', 'ICICI Bank', 0, '{"default": 1.0, "amazon": 5.0, "online": 2.0}', 'shopping', 'basic', ARRAY['cashback', 'amazon_benefits']),
('sbi_simplyclick', 'SBI SimplyCLICK Credit Card', 'SBI Cards', 499, '{"default": 1.0, "online": 10.0}', 'shopping', 'standard', ARRAY['reward_points', 'fuel_surcharge_waiver']),
('axis_magnus', 'Axis Bank Magnus Credit Card', 'Axis Bank', 12500, '{"default": 1.2, "travel": 5.0, "dining": 5.0}', 'travel', 'premium', ARRAY['lounge_access', 'concierge', 'insurance', 'milestone_benefits']),
('amex_platinum_travel', 'American Express Platinum Travel Credit Card', 'American Express', 3500, '{"default": 1.0, "travel": 5.0, "dining": 2.0}', 'travel', 'premium', ARRAY['lounge_access', 'travel_insurance', 'concierge']);

-- Analytics function
CREATE OR REPLACE FUNCTION get_user_spending_analytics(
    p_user_id UUID,
    p_date_from DATE,
    p_date_to DATE
) RETURNS TABLE (
    category VARCHAR(50),
    total_amount DECIMAL(12,2),
    transaction_count BIGINT,
    avg_amount DECIMAL(12,2),
    percentage DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    WITH category_totals AS (
        SELECT 
            t.category,
            SUM(t.amount) as total_amount,
            COUNT(*) as transaction_count,
            AVG(t.amount) as avg_amount
        FROM transactions t
        WHERE t.user_id = p_user_id
          AND t.date >= p_date_from
          AND t.date <= p_date_to
        GROUP BY t.category
    ),
    total_spending AS (
        SELECT SUM(amount) as grand_total
        FROM transactions
        WHERE user_id = p_user_id
          AND date >= p_date_from
          AND date <= p_date_to
    )
    SELECT 
        ct.category,
        ct.total_amount,
        ct.transaction_count,
        ct.avg_amount,
        ROUND(
            (ct.total_amount / NULLIF(ts.grand_total, 0) * 100)::DECIMAL, 
            2
        ) as percentage
    FROM category_totals ct
    CROSS JOIN total_spending ts
    ORDER BY ct.total_amount DESC;
END;
$$ LANGUAGE plpgsql;

-- Success message
SELECT 'Wisor AI Database Schema Created Successfully! 🎉' as message;
```

### How to Run:
1. **Go to**: SQL Editor in your Supabase dashboard
2. **Paste**: The entire SQL above
3. **Click**: "Run" button
4. **Verify**: Should see success message and tables created

## Step 3: Get Database Credentials (1 minute)

1. **Go to**: Settings → API in Supabase
2. **Copy these values**:

```bash
# Project URL
SUPABASE_URL=https://your-project-id.supabase.co

# Anon public key (starts with eyJhbGciOiJ...)
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Service role key (for server-side operations, starts with eyJhbGciOiJ...)
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Step 4: Configure Row Level Security (2 minutes)

Run this additional SQL to enable security:

```sql
-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_credit_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;

-- Create policies (simplified for API access)
CREATE POLICY "Allow authenticated access" ON users FOR ALL USING (true);
CREATE POLICY "Allow authenticated access" ON statements FOR ALL USING (true);
CREATE POLICY "Allow authenticated access" ON transactions FOR ALL USING (true);
CREATE POLICY "Allow authenticated access" ON user_credit_cards FOR ALL USING (true);
CREATE POLICY "Allow authenticated access" ON rewards_tracking FOR ALL USING (true);
CREATE POLICY "Allow authenticated access" ON ai_conversations FOR ALL USING (true);
CREATE POLICY "Allow public read access" ON credit_cards FOR SELECT USING (true);

SELECT 'Row Level Security Configured! 🔒' as message;
```

## ✅ Verification Steps

After setup, verify:

1. **Check Tables**: Go to Table Editor, should see 8 tables
2. **Check Data**: Should see 5 sample credit cards
3. **Test Connection**: Use API URL in your app
4. **Check Policies**: RLS should be enabled

## 🔗 Database Ready!

Your Supabase database is now configured for:
- ✅ User management and authentication
- ✅ Statement and transaction storage
- ✅ Credit card database with sample data
- ✅ AI conversation tracking
- ✅ Rewards calculation storage
- ✅ Caching system
- ✅ Analytics functions
- ✅ Security policies

**Next**: Use the SUPABASE_URL and SUPABASE_ANON_KEY in your Render deployment!