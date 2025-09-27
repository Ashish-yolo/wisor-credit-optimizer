# 🚀 Wisor Starter Kit

A complete full-stack application for Wisor - AI-powered credit card optimizer with mobile OTP authentication, card management, and Chrome extension sync.

## 🏗️ Tech Stack

- **Frontend**: Next.js 14 with TypeScript
- **Authentication**: Supabase Auth (Mobile OTP)
- **Database**: Supabase PostgreSQL
- **Styling**: TailwindCSS
- **Extension**: Plasmo Framework
- **Deployment**: Vercel/Netlify compatible

## 📋 Features

### 🔐 Authentication Flow
- Mobile number + OTP authentication
- Auto-populate OTP on supported devices
- Session management with Supabase
- Automatic logout on session expiry

### 💳 Card Management
- Searchable dropdown for 50+ popular Indian credit cards
- Network selection (Visa, Mastercard, RuPay, Amex, Diners)
- Secure storage of last 4 digits only
- Real-time validation and error handling

### 🔄 Extension Integration
- Chrome extension syncs cards from web app
- Real-time recommendations on shopping sites
- Add new cards via extension (syncs back to web)
- Background sync every 10 minutes

### 🎯 Smart Recommendations
- Domain-specific card suggestions
- AI-powered optimization (extensible)
- Savings calculations
- Visual recommendation widgets

## 🚀 Quick Setup

### 1. Prerequisites
```bash
# Install Node.js 18+ and pnpm
npm install -g pnpm
```

### 2. Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)

2. Run this SQL in your Supabase SQL editor:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create cards table
CREATE TABLE public.cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    card_name TEXT NOT NULL,
    network TEXT NOT NULL,
    last_four_digits TEXT NOT NULL CHECK (length(last_four_digits) = 4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can view own data" ON public.users
    FOR ALL USING (auth.uid() = id);

-- Create policies for cards table
CREATE POLICY "Users can manage own cards" ON public.cards
    FOR ALL USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_cards_user_id ON public.cards(user_id);
CREATE INDEX idx_cards_created_at ON public.cards(created_at DESC);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cards_updated_at BEFORE UPDATE ON public.cards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

3. Configure Authentication:
   - Go to Authentication > Settings
   - Enable "Phone" provider
   - Configure your SMS provider (Twilio recommended)
   - Set up phone number verification

### 3. Web App Setup

```bash
# Clone or navigate to the web app directory
cd wisor-web-app

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env.local

# Edit .env.local with your Supabase credentials
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXTAUTH_SECRET=your_nextauth_secret
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

```bash
# Start development server
pnpm dev

# Open http://localhost:3000
```

### 4. Extension Setup

```bash
# Navigate to extension directory
cd ../extension

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env

# Edit .env with your Supabase credentials
PLASMO_PUBLIC_SUPABASE_URL=your_supabase_project_url
PLASMO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
PLASMO_PUBLIC_WEB_APP_URL=http://localhost:3000
```

```bash
# Start extension development
pnpm dev

# Or build for production
pnpm build
```

### 5. Load Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked"
4. Select the `extension/build/chrome-mv3-dev` directory
5. Pin the Wisor extension to your toolbar

## 🔄 Development Workflow

### Testing the Complete Flow

1. **Start both servers:**
   ```bash
   # Terminal 1: Web app
   cd wisor-web-app && pnpm dev
   
   # Terminal 2: Extension
   cd extension && pnpm dev
   ```

2. **Test authentication:**
   - Visit http://localhost:3000
   - Enter mobile number and verify OTP
   - Add one or more credit cards

3. **Test extension sync:**
   - Open extension popup
   - Verify cards are synced from web app
   - Visit supported sites (amazon.in, flipkart.com, etc.)
   - Check for recommendation widgets

4. **Test adding cards via extension:**
   - Click "Add Card" in extension
   - Should redirect to web app
   - New cards should sync back to extension

## 🏗️ Project Structure

```
wisor-starter-kit/
├── wisor-web-app/                 # Next.js web application
│   ├── src/
│   │   ├── app/                   # App router pages
│   │   ├── components/            # React components
│   │   │   ├── auth/             # Authentication components
│   │   │   └── cards/            # Card management components
│   │   ├── lib/                  # Utilities and configs
│   │   ├── types/                # TypeScript types
│   │   └── utils/                # Helper functions
│   ├── public/                   # Static assets
│   └── package.json
│
├── extension/                     # Plasmo Chrome extension
│   ├── lib/                      # Extension utilities
│   ├── popup.tsx                 # Extension popup UI
│   ├── background.ts             # Background script
│   ├── content.ts                # Content script
│   └── package.json
│
└── README.md                     # This file
```

## 🔌 API Endpoints

### Authentication
- Handled by Supabase Auth
- Mobile OTP verification
- Session management

### Cards API
```typescript
// GET /api/cards - Fetch user's cards
// POST /api/cards - Add new cards
// PUT /api/cards/[id] - Update card
// DELETE /api/cards/[id] - Delete card
```

All API routes require authentication via Bearer token.

## 🛠️ Customization

### Adding New Credit Cards

Edit `src/lib/data.ts` in the web app:

```typescript
export const INDIAN_BANK_CARDS: IndianBankCard[] = [
  {
    id: 'your-card-id',
    name: 'Your Card Name',
    bank: 'Bank Name',
    type: 'Card Type'
  },
  // ... existing cards
]
```

### Adding New Shopping Sites

Edit `background.ts` in the extension:

```typescript
function isSupportedSite(hostname: string): boolean {
  const supportedSites = [
    'your-new-site.com',
    // ... existing sites
  ]
  
  return supportedSites.some(site => hostname.includes(site))
}
```

### Enhancing Recommendations

Edit `lib/cardSync.ts` in the extension to add AI-powered logic:

```typescript
export const getCardRecommendations = async (domain: string, amount?: number) => {
  // Add your AI/ML recommendation logic here
  // Can integrate with OpenAI, Claude, or custom models
}
```

## 🚀 Deployment

### Web App (Vercel)
```bash
cd wisor-web-app
vercel deploy
```

### Extension (Chrome Web Store)
```bash
cd extension
pnpm build
pnpm package

# Upload the generated ZIP to Chrome Web Store
```

## 🔒 Security Notes

- Only last 4 digits of cards are stored
- All API calls require authentication
- Row Level Security enabled in Supabase
- Extension uses secure storage APIs
- HTTPS required for production

## 🐛 Troubleshooting

### Common Issues

1. **OTP not received:**
   - Check Supabase SMS provider configuration
   - Verify phone number format (+91XXXXXXXXXX)
   - Check SMS quotas and credits

2. **Extension not syncing:**
   - Verify Supabase credentials in extension .env
   - Check browser console for errors
   - Ensure web app is running on correct URL

3. **Cards not appearing:**
   - Check RLS policies in Supabase
   - Verify user authentication state
   - Check API endpoint responses

### Debug Mode

Enable debug logging:

```typescript
// In any component
console.log('Debug info:', { user, cards, session })
```

## 📚 Additional Resources

- [Supabase Docs](https://supabase.com/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [Plasmo Docs](https://docs.plasmo.com)
- [TailwindCSS Docs](https://tailwindcss.com/docs)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

MIT License - see LICENSE file for details.

---

**🎉 Your Wisor starter kit is ready! Start building amazing credit card optimization experiences.**