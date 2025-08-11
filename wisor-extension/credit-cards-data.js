// Comprehensive Indian Credit Cards Database
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