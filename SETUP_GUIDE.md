# 🚀 Wisor Complete Starter Kit - Setup Guide

This repository contains a complete full-stack application for Wisor - an AI-powered credit card optimizer with mobile authentication, card management, and Chrome extension integration.

## 🎯 What You Get

✅ **Next.js 14 Web App** with TypeScript  
✅ **Mobile OTP Authentication** via Supabase  
✅ **Card Management System** with searchable dropdowns  
✅ **Chrome Extension** with real-time sync  
✅ **API Routes** for card CRUD operations  
✅ **Responsive Design** with TailwindCSS  
✅ **Production Ready** deployment configuration  

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js App  │    │   Supabase      │    │ Chrome Extension│
│                 │    │                 │    │                 │
│ • Auth Flow     │◄──►│ • Authentication│◄──►│ • Card Sync     │
│ • Card Form     │    │ • Database      │    │ • Recommendations│
│ • Dashboard     │    │ • Real-time API │    │ • Content Script│
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📂 Project Structure

```
wisor-credit-optimizer/
├── wisor-web-app/                 # Next.js 14 Application
│   ├── src/
│   │   ├── app/                   # App Router (Next.js 14)
│   │   │   ├── api/cards/         # API routes for card management
│   │   │   ├── globals.css        # Global styles
│   │   │   ├── layout.tsx         # Root layout
│   │   │   └── page.tsx           # Main page with auth flow
│   │   ├── components/
│   │   │   ├── auth/              # Authentication components
│   │   │   │   ├── LoginForm.tsx  # Mobile number input
│   │   │   │   └── OTPForm.tsx    # OTP verification
│   │   │   ├── cards/             # Card management
│   │   │   │   ├── AddCardForm.tsx
│   │   │   │   └── SearchableDropdown.tsx
│   │   │   └── Dashboard.tsx      # Main dashboard
│   │   ├── lib/                   # Utilities and configuration
│   │   │   ├── supabase.ts        # Supabase client config
│   │   │   └── data.ts            # Card data (50+ Indian cards)
│   │   ├── types/                 # TypeScript definitions
│   │   └── utils/                 # Helper functions
│   ├── public/                    # Static assets
│   ├── .env.example               # Environment template
│   └── package.json
│
├── extension/                     # Plasmo Chrome Extension
│   ├── lib/
│   │   ├── supabase.ts           # Extension Supabase client
│   │   ├── storage.ts            # Chrome storage utilities
│   │   └── cardSync.ts           # Card synchronization logic
│   ├── popup.tsx                 # Extension popup UI
│   ├── background.ts             # Background service worker
│   ├── content.ts                # Content script for recommendations
│   ├── style.css                 # Extension styling
│   ├── .env.example              # Extension environment template
│   └── package.json
│
├── public/                       # Landing page assets
├── SETUP_GUIDE.md               # This file
└── README.md                    # Project documentation
```

## 🚀 Quick Start (5 Minutes)

### Step 1: Prerequisites
```bash
# Install Node.js 18+ and pnpm
node --version  # Should be 18+
npm install -g pnpm
```

### Step 2: Supabase Setup

1. **Create Supabase Project:**
   - Go to [supabase.com](https://supabase.com)
   - Create new project
   - Note your project URL and anon key

2. **Setup Database:**
   - Go to SQL Editor in Supabase
   - Copy and run this SQL:

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

-- Policies for users
CREATE POLICY "Users can view own data" ON public.users
    FOR ALL USING (auth.uid() = id);

-- Policies for cards
CREATE POLICY "Users can manage own cards" ON public.cards
    FOR ALL USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_cards_user_id ON public.cards(user_id);
CREATE INDEX idx_cards_created_at ON public.cards(created_at DESC);
```

3. **Configure Phone Authentication:**
   - Go to Authentication > Settings in Supabase
   - Enable "Phone" provider
   - Set up SMS provider (Twilio recommended for India)

### Step 3: Web App Setup

```bash
# Navigate to web app
cd wisor-web-app

# Install dependencies
pnpm install

# Setup environment
cp .env.example .env.local

# Edit .env.local with your Supabase credentials:
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXTAUTH_SECRET=your-random-secret
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Start development server
pnpm dev
```

### Step 4: Extension Setup

```bash
# Open new terminal and navigate to extension
cd extension

# Install dependencies
pnpm install

# Setup environment
cp .env.example .env

# Edit .env with same Supabase credentials:
PLASMO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PLASMO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
PLASMO_PUBLIC_WEB_APP_URL=http://localhost:3000

# Build extension
pnpm build
```

### Step 5: Load Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (top right toggle)
3. Click "Load unpacked"
4. Select `extension/build/chrome-mv3-prod` folder
5. Pin Wisor extension to toolbar

## 🧪 Testing the Complete Flow

### 1. Test Authentication
- Visit http://localhost:3000
- Enter Indian mobile number (format: +91XXXXXXXXXX)
- Verify OTP (check your SMS)
- Should proceed to card addition form

### 2. Test Card Addition
- Select cards from searchable dropdown (50+ Indian cards included)
- Choose network (Visa, Mastercard, RuPay, etc.)
- Enter last 4 digits
- Add multiple cards if desired
- Click "Continue" to reach dashboard

### 3. Test Extension Sync
- Open Wisor extension popup
- Verify cards are synced from web app
- Cards should appear in extension popup

### 4. Test Recommendations
- Visit supported sites:
  - amazon.in
  - flipkart.com
  - zomato.com
  - swiggy.com
  - myntra.com
- Extension should show recommendation widget
- Should suggest optimal card for each site

### 5. Test Adding Cards via Extension
- Click "Add Card" in extension popup
- Should redirect to web app
- Add card in web app
- Return to extension - new card should sync automatically

## 🎯 Key Features Demonstrated

### 🔐 Authentication Flow
- **Mobile OTP**: Complete phone verification
- **Auto-populate OTP**: Works on supported mobile browsers
- **Session Management**: Persistent login state
- **Logout**: Clean session termination

### 💳 Card Management
- **Searchable Dropdowns**: Type to filter 50+ Indian cards
- **Real-time Validation**: Instant feedback on form inputs
- **Multiple Cards**: Add unlimited cards
- **Secure Storage**: Only last 4 digits stored

### 🔄 Extension Integration
- **Real-time Sync**: Cards sync between web and extension
- **Background Updates**: Automatic syncing every 10 minutes
- **Site Detection**: Smart recommendations on shopping sites
- **Visual Widgets**: Non-intrusive recommendation overlays

### 🤖 Smart Recommendations
- **Domain-specific**: Different suggestions per website
- **Savings Calculator**: Shows potential cashback
- **Best Card Logic**: Recommends optimal choice
- **Extensible AI**: Ready for ML model integration

## 📊 Included Data

### Credit Cards (50+ Popular Indian Cards)
- **HDFC**: Regalia, Millennia, Infinia, Diners Black, Swiggy
- **ICICI**: Sapphiro, Emeralde, Amazon Pay, Manchester United
- **SBI**: Elite, Prime, Cashback, SimplyCLICK
- **Axis**: Magnus, Reserve, ACE, Flipkart, MyZone
- **Kotak**: Zen, League, Royale
- **Yes Bank**: Marquee, Elite Plus, First Preferred
- **RBL**: Icon, World Safari, ShopRite
- **Citibank**: Prestige, PremierMiles, Rewards
- **Standard Chartered**: Platinum Rewards, Super Value
- **American Express**: Platinum Travel, Gold, Membership Rewards

### Supported Shopping Sites
- **E-commerce**: Amazon, Flipkart, Myntra
- **Food Delivery**: Zomato, Swiggy
- **Travel**: MakeMyTrip
- **Groceries**: BigBasket
- **Entertainment**: BookMyShow
- **Beauty**: Nykaa
- **Electronics**: Croma, Reliance Digital
- **Easily Extensible**: Add more in `background.ts`

## 🚀 Deployment Options

### Web App Deployment

**Vercel (Recommended):**
```bash
cd wisor-web-app
npx vercel
# Follow prompts, add environment variables
```

**Netlify:**
```bash
cd wisor-web-app
pnpm build
# Upload dist folder to Netlify
# Add environment variables in Netlify dashboard
```

### Extension Deployment

**Chrome Web Store:**
```bash
cd extension
pnpm build
pnpm package
# Upload generated ZIP to Chrome Web Store Developer Dashboard
```

**Internal Distribution:**
```bash
cd extension
pnpm build
# Share build/chrome-mv3-prod folder for manual installation
```

## 🛠️ Customization Guide

### Adding New Credit Cards

Edit `wisor-web-app/src/lib/data.ts`:

```typescript
export const INDIAN_BANK_CARDS: IndianBankCard[] = [
  {
    id: 'custom-card-id',
    name: 'Your Custom Card',
    bank: 'Bank Name',
    type: 'Premium/Cashback/Travel'
  },
  // ... existing cards
]
```

### Adding New Shopping Sites

Edit `extension/background.ts`:

```typescript
function isSupportedSite(hostname: string): boolean {
  const supportedSites = [
    'your-new-site.com',
    'another-site.in',
    // ... existing sites
  ]
  
  return supportedSites.some(site => hostname.includes(site))
}
```

### Enhancing Recommendations

Edit `extension/lib/cardSync.ts`:

```typescript
export const getCardRecommendations = async (domain: string, amount?: number) => {
  // Your custom recommendation logic
  // Can integrate with:
  // - OpenAI API for AI recommendations
  // - Claude API for advanced analysis
  // - Custom ML models
  // - Rule-based engines
}
```

### Styling Customization

**Web App**: Edit `wisor-web-app/tailwind.config.js`
**Extension**: Edit `extension/style.css`

## 🔒 Security Features

- ✅ Row Level Security (RLS) in Supabase
- ✅ API authentication required for all endpoints
- ✅ Only last 4 digits of cards stored
- ✅ Secure Chrome extension storage
- ✅ HTTPS enforcement in production
- ✅ Input validation and sanitization
- ✅ Session management with automatic expiry

## 🐛 Troubleshooting

### Common Issues & Solutions

**1. OTP Not Received:**
```bash
# Check Supabase Authentication settings
# Verify SMS provider configuration
# Ensure phone format: +91XXXXXXXXXX
# Check SMS quota and credits
```

**2. Extension Not Syncing:**
```bash
# Verify extension .env variables
# Check if web app is running on correct URL
# Open browser console for extension errors
# Ensure Supabase RLS policies are correct
```

**3. Cards Not Displaying:**
```bash
# Check browser network tab for API errors
# Verify user authentication state
# Check Supabase table data directly
# Enable debug logging in components
```

**4. Recommendation Widget Not Showing:**
```bash
# Check if site is in supported sites list
# Verify extension content script is injected
# Check browser console for errors
# Ensure user is logged in with cards added
```

### Debug Mode

Enable detailed logging:

```typescript
// Add to any component for debugging
console.log('Debug State:', { 
  user: session.user, 
  cards: userCards,
  recommendations 
})
```

## 📈 Performance Optimizations

- ✅ Card data cached in extension storage
- ✅ Background sync only when needed (5-minute intervals)
- ✅ Debounced API calls
- ✅ Optimized database indexes
- ✅ Lazy loading of components
- ✅ Minimal extension bundle size

## 🎓 Learning Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js 14 App Router](https://nextjs.org/docs/app)
- [Plasmo Extension Framework](https://docs.plasmo.com)
- [TailwindCSS Reference](https://tailwindcss.com/docs)
- [Chrome Extension APIs](https://developer.chrome.com/docs/extensions/)

## 🤝 Support & Contribution

### Getting Help
1. Check this setup guide
2. Review the troubleshooting section
3. Check browser console for errors
4. Verify Supabase configuration

### Contributing
1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📋 Checklist for Production

### Before Deploying:
- [ ] Environment variables configured
- [ ] Supabase RLS policies tested
- [ ] SMS provider configured and tested
- [ ] Extension permissions reviewed
- [ ] API rate limits configured
- [ ] Error handling tested
- [ ] Mobile responsiveness verified
- [ ] Cross-browser compatibility checked
- [ ] Performance optimization applied
- [ ] Security review completed

### Post-Deployment:
- [ ] Authentication flow tested in production
- [ ] Card sync verified
- [ ] Extension recommendations working
- [ ] Error monitoring set up
- [ ] User analytics configured
- [ ] Backup procedures in place

---

## 🎉 Congratulations!

You now have a complete, production-ready Wisor starter kit with:

✅ **Authentication**: Mobile OTP with Supabase  
✅ **Card Management**: Full CRUD with searchable UI  
✅ **Chrome Extension**: Real-time sync and recommendations  
✅ **API Layer**: Secure, scalable backend  
✅ **Modern UI**: Responsive, accessible design  
✅ **Production Ready**: Deployment configurations included  

**Start building amazing credit card optimization experiences! 🚀**