// Enhanced Credit Cards Database with User Cards and Offers Support
const INDIAN_CREDIT_CARDS = {
  // HDFC Bank Cards
  'hdfc-millennia': {
    id: 'hdfc-millennia',
    name: 'HDFC Bank Millennia Credit Card',
    bank: 'HDFC Bank',
    annualFee: 1000,
    benefits: {
      'online-shopping': { rate: 5, type: 'cashback', cap: 1000, description: '5% cashback on online shopping' },
      'dining': { rate: 5, type: 'cashback', cap: 1000, description: '5% cashback on dining' },
      'general': { rate: 1, type: 'cashback', description: '1% cashback on all other spends' }
    },
    merchants: ['amazon', 'flipkart', 'myntra', 'zomato', 'swiggy'],
    color: '#1e40af',
    image: 'hdfc-millennia.png',
    applyUrl: 'https://www.hdfcbank.com/personal/pay/cards/millennia-cards/millennia-cc-new'
  },
  
  'hdfc-regalia': {
    id: 'hdfc-regalia',
    name: 'HDFC Bank Regalia Credit Card',
    bank: 'HDFC Bank',
    annualFee: 2500,
    benefits: {
      'dining': { rate: 6, type: 'points', description: '6 reward points per ₹150 on dining' },
      'travel': { rate: 6, type: 'points', description: '6 reward points per ₹150 on travel' },
      'fuel': { rate: 6, type: 'points', description: '6 reward points per ₹150 on fuel' },
      'general': { rate: 2, type: 'points', description: '2 reward points per ₹150 on other spends' }
    },
    merchants: ['makemytrip', 'goibibo', 'zomato', 'swiggy'],
    color: '#0f172a',
    image: 'hdfc-regalia.png',
    applyUrl: 'https://www.hdfcbank.com/personal/pay/cards/credit-cards/regalia-credit-card'
  },

  // SBI Cards
  'sbi-simplyclick': {
    id: 'sbi-simplyclick',
    name: 'SBI SimplyCLICK Credit Card',
    bank: 'State Bank of India',
    annualFee: 499,
    benefits: {
      'online-shopping': { rate: 5, type: 'points', cap: 1000, description: '5X reward points on online shopping' },
      'fuel': { rate: 1, type: 'surcharge-waiver', description: '1% fuel surcharge waiver' },
      'general': { rate: 1, type: 'points', description: '1 reward point per ₹100' }
    },
    merchants: ['amazon', 'flipkart', 'myntra', 'bigbasket'],
    color: '#059669',
    image: 'sbi-simplyclick.png',
    applyUrl: 'https://www.sbicard.com/en/personal/credit-cards/shopping/simplyclick-advantage-credit-card.page'
  },

  'sbi-prime': {
    id: 'sbi-prime',
    name: 'SBI Card PRIME',
    bank: 'State Bank of India',
    annualFee: 2999,
    benefits: {
      'dining': { rate: 5, type: 'points', description: '5 reward points per ₹100 on dining' },
      'movies': { rate: 5, type: 'points', description: '5 reward points per ₹100 on movies' },
      'grocery': { rate: 5, type: 'points', description: '5 reward points per ₹100 on grocery' },
      'general': { rate: 1, type: 'points', description: '1 reward point per ₹100' }
    },
    merchants: ['bookmyshow', 'bigbasket', 'zomato', 'swiggy'],
    color: '#7c2d12',
    image: 'sbi-prime.png',
    applyUrl: 'https://www.sbicard.com/en/personal/credit-cards/rewards/sbi-card-prime.page'
  },

  // ICICI Bank Cards
  'icici-amazon-pay': {
    id: 'icici-amazon-pay',
    name: 'Amazon Pay ICICI Bank Credit Card',
    bank: 'ICICI Bank',
    annualFee: 0,
    benefits: {
      'amazon': { rate: 5, type: 'cashback', description: '5% cashback on Amazon.in for Prime members' },
      'amazon-non-prime': { rate: 3, type: 'cashback', description: '3% cashback on Amazon.in for non-Prime members' },
      'general': { rate: 1, type: 'cashback', description: '1% cashback on all other spends' }
    },
    merchants: ['amazon'],
    color: '#ff9900',
    image: 'icici-amazon.png',
    applyUrl: 'https://www.icicibank.com/personal-banking/cards/credit-card/amazon-pay-credit-card'
  },

  'icici-platinum': {
    id: 'icici-platinum',
    name: 'ICICI Bank Platinum Credit Card',
    bank: 'ICICI Bank',
    annualFee: 499,
    benefits: {
      'fuel': { rate: 1, type: 'surcharge-waiver', description: '1% fuel surcharge waiver' },
      'general': { rate: 2, type: 'points', description: '2 reward points per ₹100' }
    },
    merchants: ['general'],
    color: '#6366f1',
    image: 'icici-platinum.png',
    applyUrl: 'https://www.icicibank.com/personal-banking/cards/credit-card/platinum-chip-credit-card'
  },

  // Axis Bank Cards
  'axis-flipkart': {
    id: 'axis-flipkart',
    name: 'Flipkart Axis Bank Credit Card',
    bank: 'Axis Bank',
    annualFee: 500,
    benefits: {
      'flipkart': { rate: 5, type: 'cashback', description: '5% unlimited cashback on Flipkart' },
      'myntra-cleartrip': { rate: 4, type: 'cashback', description: '4% cashback on Myntra and Cleartrip' },
      'general': { rate: 1, type: 'cashback', description: '1% cashback on all other spends' }
    },
    merchants: ['flipkart', 'myntra'],
    color: '#f59e0b',
    image: 'axis-flipkart.png',
    applyUrl: 'https://www.axisbank.com/retail/cards/credit-card/flipkart-axis-bank-credit-card'
  },

  'axis-ace': {
    id: 'axis-ace',
    name: 'Axis Bank ACE Credit Card',
    bank: 'Axis Bank',
    annualFee: 499,
    benefits: {
      'bill-payments': { rate: 5, type: 'cashback', description: '5% cashback on bill payments via Google Pay' },
      'swiggy-zomato': { rate: 4, type: 'cashback', description: '4% cashback on Swiggy and Zomato' },
      'general': { rate: 1, type: 'cashback', description: '1% cashback on all other spends' }
    },
    merchants: ['swiggy', 'zomato'],
    color: '#dc2626',
    image: 'axis-ace.png',
    applyUrl: 'https://www.axisbank.com/retail/cards/credit-card/ace-credit-card'
  },

  // Kotak Mahindra Bank Cards
  'kotak-league-platinum': {
    id: 'kotak-league-platinum',
    name: 'Kotak League Platinum Credit Card',
    bank: 'Kotak Mahindra Bank',
    annualFee: 750,
    benefits: {
      'fuel': { rate: 4, type: 'points', description: '4 reward points per ₹150 on fuel' },
      'utility': { rate: 4, type: 'points', description: '4 reward points per ₹150 on utility payments' },
      'general': { rate: 1, type: 'points', description: '1 reward point per ₹150' }
    },
    merchants: ['general'],
    color: '#8b5cf6',
    image: 'kotak-league.png',
    applyUrl: 'https://www.kotak.com/en/personal-banking/cards/credit-cards/league-platinum-credit-card.html'
  },

  // American Express Cards
  'amex-gold-charge': {
    id: 'amex-gold-charge',
    name: 'American Express Gold Charge Card',
    bank: 'American Express',
    annualFee: 4500,
    benefits: {
      'travel': { rate: 4, type: 'points', description: '4X Membership Reward points on travel' },
      'dining': { rate: 4, type: 'points', description: '4X Membership Reward points on dining' },
      'fuel': { rate: 2, type: 'points', description: '2X Membership Reward points on fuel' },
      'general': { rate: 1, type: 'points', description: '1X Membership Reward points on other spends' }
    },
    merchants: ['makemytrip', 'goibibo', 'zomato', 'swiggy'],
    color: '#d4af37',
    image: 'amex-gold.png',
    applyUrl: 'https://www.americanexpress.com/in/credit-cards/gold-charge-card/'
  }
};

// Merchant category mapping
const MERCHANT_CATEGORIES = {
  'amazon.in': { category: 'online-shopping', subcategory: 'amazon', name: 'Amazon India' },
  'flipkart.com': { category: 'online-shopping', subcategory: 'flipkart', name: 'Flipkart' },
  'myntra.com': { category: 'online-shopping', subcategory: 'fashion', name: 'Myntra' },
  'zomato.com': { category: 'dining', subcategory: 'food-delivery', name: 'Zomato' },
  'swiggy.com': { category: 'dining', subcategory: 'food-delivery', name: 'Swiggy' },
  'makemytrip.com': { category: 'travel', subcategory: 'booking', name: 'MakeMyTrip' },
  'goibibo.com': { category: 'travel', subcategory: 'booking', name: 'Goibibo' },
  'bookmyshow.com': { category: 'movies', subcategory: 'entertainment', name: 'BookMyShow' },
  'bigbasket.com': { category: 'grocery', subcategory: 'online-grocery', name: 'BigBasket' },
  'reliancedigital.in': { category: 'online-shopping', subcategory: 'electronics', name: 'Reliance Digital' },
  'croma.com': { category: 'online-shopping', subcategory: 'electronics', name: 'Croma' },
  'nykaa.com': { category: 'online-shopping', subcategory: 'beauty', name: 'Nykaa' },
  'ajio.com': { category: 'online-shopping', subcategory: 'fashion', name: 'AJIO' }
};

// User's card portfolio (would come from extension storage in real app)
let USER_CARDS = [
  'hdfc-millennia',
  'sbi-simplyclick',
  'icici-amazon-pay'
];

// Enhanced data structures for user-added cards and offers
const USER_ADDED_CARDS = new Map(); // Stores custom cards added by users
const DYNAMIC_OFFERS = new Map(); // Stores scraped offers with expiry dates
const REWARD_RATE_CACHE = new Map(); // Caches scraped reward rates

// Enhanced card data structure
class EnhancedCreditCard {
  constructor(cardData) {
    this.id = cardData.id;
    this.name = cardData.name;
    this.bank = cardData.bank;
    this.annualFee = cardData.annualFee;
    this.benefits = cardData.benefits || {};
    this.merchants = cardData.merchants || [];
    this.color = cardData.color;
    this.image = cardData.image;
    this.applyUrl = cardData.applyUrl;
    
    // Enhanced fields
    this.source = cardData.source || 'static'; // 'static' | 'user-added' | 'detected'
    this.lastUpdated = cardData.lastUpdated || new Date().toISOString();
    this.customRewards = cardData.customRewards || {}; // User-defined reward rates
    this.isActive = cardData.isActive !== false;
    this.userNotes = cardData.userNotes || '';
    this.verification = cardData.verification || { status: 'unverified', date: null };
  }

  // Get effective benefits (combines static + custom + dynamic offers)
  getEffectiveBenefits(merchant = null, date = new Date()) {
    const benefits = { ...this.benefits, ...this.customRewards };
    
    // Add dynamic offers if applicable
    if (merchant) {
      const offers = this.getActiveOffers(merchant, date);
      offers.forEach(offer => {
        if (offer.category && (!benefits[offer.category] || offer.rate > benefits[offer.category].rate)) {
          benefits[offer.category] = {
            rate: offer.rate,
            type: offer.type,
            description: offer.description,
            source: 'offer',
            expires: offer.expires
          };
        }
      });
    }
    
    return benefits;
  }

  // Get active offers for this card
  getActiveOffers(merchant = null, date = new Date()) {
    const cardOffers = DYNAMIC_OFFERS.get(this.id) || [];
    return cardOffers.filter(offer => {
      const isActive = new Date(offer.expires) > date;
      const matchesMerchant = !merchant || offer.merchants.includes(merchant) || offer.category === merchant.category;
      return isActive && matchesMerchant;
    });
  }
}

// Offer data structure
class DynamicOffer {
  constructor(offerData) {
    this.id = offerData.id || Date.now().toString();
    this.cardId = offerData.cardId;
    this.title = offerData.title;
    this.description = offerData.description;
    this.rate = offerData.rate; // Benefit rate (e.g., 5 for 5%)
    this.type = offerData.type; // 'cashback' | 'points' | 'discount'
    this.category = offerData.category; // 'dining' | 'shopping' etc.
    this.merchants = offerData.merchants || []; // Specific merchants
    this.minSpend = offerData.minSpend || 0;
    this.maxBenefit = offerData.maxBenefit || null;
    this.expires = offerData.expires;
    this.source = offerData.source; // 'scraped' | 'bank-email' | 'manual'
    this.sourceUrl = offerData.sourceUrl;
    this.scraped = {
      date: offerData.scraped?.date || new Date().toISOString(),
      confidence: offerData.scraped?.confidence || 0.8
    };
  }

  isValid(date = new Date()) {
    return new Date(this.expires) > date;
  }

  matchesMerchant(merchant) {
    if (this.merchants.includes(merchant.hostname)) return true;
    if (this.category && this.category === merchant.category) return true;
    return false;
  }
}

// Bank configuration for reward scraping
const BANK_SCRAPING_CONFIG = {
  'hdfc': {
    baseUrl: 'https://www.hdfcbank.com',
    rewardPagesEndpoints: ['/personal/pay/cards/credit-cards', '/offers'],
    selectors: {
      offerCards: '.offer-card, .credit-card-offer',
      title: '.offer-title, h3, h4',
      description: '.offer-description, .card-benefits p',
      validTill: '.validity, .expires, .valid-till'
    },
    rateLimit: 5000 // 5 seconds between requests
  },
  'sbi': {
    baseUrl: 'https://www.sbicard.com',
    rewardPagesEndpoints: ['/en/personal/credit-cards', '/en/offers'],
    selectors: {
      offerCards: '.offer-item, .card-offer',
      title: '.title, h3',
      description: '.description, .offer-text',
      validTill: '.validity-date, .expire-date'
    },
    rateLimit: 5000
  },
  'icici': {
    baseUrl: 'https://www.icicibank.com',
    rewardPagesEndpoints: ['/personal-banking/cards/credit-card', '/offers'],
    selectors: {
      offerCards: '.offer-box, .credit-card-offer',
      title: '.offer-heading, h4',
      description: '.offer-details, .benefits',
      validTill: '.expiry, .valid-date'
    },
    rateLimit: 5000
  },
  'axis': {
    baseUrl: 'https://www.axisbank.com',
    rewardPagesEndpoints: ['/retail/cards/credit-card', '/offers-and-deals'],
    selectors: {
      offerCards: '.offer-card, .axis-offer',
      title: '.offer-title, h3',
      description: '.offer-content, .card-benefit',
      validTill: '.expiry-date, .validity'
    },
    rateLimit: 5000
  }
};

// Merchant offer scraping configuration
const MERCHANT_SCRAPING_CONFIG = {
  'amazon': {
    offerSelectors: [
      '.s-coupon-highlight-color', // Coupon offers
      '[data-testid="offer-display-text"]', // Card offers
      '.promotions-coupon', // Promotions
      '.a-color-success' // General offers
    ],
    cardOfferPatterns: [
      /(\d+)%\s*(cashback|off).*?(hdfc|sbi|icici|axis)/i,
      /save\s*₹(\d+).*?(hdfc|sbi|icici|axis)/i,
      /extra\s*(\d+)%.*?credit\s*card/i
    ]
  },
  'flipkart': {
    offerSelectors: [
      '._2ZdXDB', // Offer tags
      '._3j4Zjq', // Bank offers
      '._16FRp0' // Additional offers
    ],
    cardOfferPatterns: [
      /(\d+)%\s*instant\s*discount.*?(axis|sbi|hdfc|icici)/i,
      /₹(\d+)\s*off.*?credit\s*card/i
    ]
  },
  'zomato': {
    offerSelectors: [
      '[data-testid="offer-card"]',
      '.offer-item',
      '.promo-tag'
    ],
    cardOfferPatterns: [
      /(\d+)%\s*off.*?(hdfc|axis|sbi|icici)/i,
      /up\s*to\s*₹(\d+).*?cashback/i
    ]
  }
};