import { IndianBankCard, CardNetwork } from '@/types';

// Popular Indian Credit Cards from major banks
export const INDIAN_BANK_CARDS: IndianBankCard[] = [
  // HDFC Bank
  { id: 'hdfc-regalia', name: 'HDFC Regalia', bank: 'HDFC', type: 'Premium' },
  { id: 'hdfc-millennia', name: 'HDFC Millennia', bank: 'HDFC', type: 'Lifestyle' },
  { id: 'hdfc-diners-black', name: 'HDFC Diners Club Black', bank: 'HDFC', type: 'Super Premium' },
  { id: 'hdfc-infinia', name: 'HDFC Infinia', bank: 'HDFC', type: 'Super Premium' },
  { id: 'hdfc-swiggy', name: 'HDFC Swiggy', bank: 'HDFC', type: 'Co-branded' },
  { id: 'hdfc-tata-neu-plus', name: 'HDFC Tata Neu Plus', bank: 'HDFC', type: 'Co-branded' },
  
  // ICICI Bank
  { id: 'icici-sapphiro', name: 'ICICI Bank Sapphiro', bank: 'ICICI', type: 'Premium' },
  { id: 'icici-emeralde', name: 'ICICI Bank Emeralde', bank: 'ICICI', type: 'Super Premium' },
  { id: 'icici-amazon-pay', name: 'ICICI Amazon Pay', bank: 'ICICI', type: 'Co-branded' },
  { id: 'icici-manchest-united', name: 'ICICI Manchester United', bank: 'ICICI', type: 'Co-branded' },
  { id: 'icici-mmt', name: 'ICICI MakeMyTrip', bank: 'ICICI', type: 'Co-branded' },
  
  // SBI Bank
  { id: 'sbi-elite', name: 'SBI Elite', bank: 'SBI', type: 'Premium' },
  { id: 'sbi-prime', name: 'SBI Prime', bank: 'SBI', type: 'Premium' },
  { id: 'sbi-cashback', name: 'SBI Cashback', bank: 'SBI', type: 'Cashback' },
  { id: 'sbi-simply-click', name: 'SBI SimplyCLICK', bank: 'SBI', type: 'Online Shopping' },
  
  // Axis Bank
  { id: 'axis-magnus', name: 'Axis Magnus', bank: 'Axis', type: 'Super Premium' },
  { id: 'axis-reserve', name: 'Axis Reserve', bank: 'Axis', type: 'Ultra Premium' },
  { id: 'axis-ace', name: 'Axis ACE', bank: 'Axis', type: 'Cashback' },
  { id: 'axis-flipkart', name: 'Axis Flipkart', bank: 'Axis', type: 'Co-branded' },
  { id: 'axis-myzone', name: 'Axis MyZone', bank: 'Axis', type: 'Lifestyle' },
  
  // Kotak Bank
  { id: 'kotak-zen', name: 'Kotak Zen Signature', bank: 'Kotak', type: 'Premium' },
  { id: 'kotak-league', name: 'Kotak League Platinum', bank: 'Kotak', type: 'Premium' },
  { id: 'kotak-royale', name: 'Kotak Royale Signature', bank: 'Kotak', type: 'Super Premium' },
  
  // Yes Bank
  { id: 'yes-marquee', name: 'Yes Marquee', bank: 'Yes Bank', type: 'Super Premium' },
  { id: 'yes-elite-plus', name: 'Yes Elite Plus', bank: 'Yes Bank', type: 'Premium' },
  { id: 'yes-first-preferred', name: 'Yes First Preferred', bank: 'Yes Bank', type: 'Premium' },
  
  // RBL Bank
  { id: 'rbl-icon', name: 'RBL Icon', bank: 'RBL', type: 'Premium' },
  { id: 'rbl-world-safari', name: 'RBL World Safari', bank: 'RBL', type: 'Travel' },
  { id: 'rbl-shoprite', name: 'RBL ShopRite', bank: 'RBL', type: 'Shopping' },
  
  // Citibank
  { id: 'citi-prestige', name: 'Citi Prestige', bank: 'Citibank', type: 'Super Premium' },
  { id: 'citi-premier-miles', name: 'Citi PremierMiles', bank: 'Citibank', type: 'Travel' },
  { id: 'citi-rewards', name: 'Citi Rewards', bank: 'Citibank', type: 'Rewards' },
  
  // Standard Chartered
  { id: 'sc-platinum-rewards', name: 'SC Platinum Rewards', bank: 'Standard Chartered', type: 'Rewards' },
  { id: 'sc-super-value-titanium', name: 'SC Super Value Titanium', bank: 'Standard Chartered', type: 'Value' },
  { id: 'sc-manhattan', name: 'SC Manhattan', bank: 'Standard Chartered', type: 'Premium' },
  
  // American Express
  { id: 'amex-platinum-travel', name: 'Amex Platinum Travel', bank: 'American Express', type: 'Super Premium' },
  { id: 'amex-gold', name: 'Amex Gold', bank: 'American Express', type: 'Premium' },
  { id: 'amex-membership-rewards', name: 'Amex Membership Rewards', bank: 'American Express', type: 'Rewards' },
];

// Card Networks
export const CARD_NETWORKS: CardNetwork[] = [
  { id: 'visa', name: 'Visa', value: 'visa' },
  { id: 'mastercard', name: 'Mastercard', value: 'mastercard' },
  { id: 'rupay', name: 'RuPay', value: 'rupay' },
  { id: 'amex', name: 'American Express', value: 'amex' },
  { id: 'diners', name: 'Diners Club', value: 'diners' },
];

// Helper function to filter cards by search term
export const filterCards = (cards: IndianBankCard[], searchTerm: string): IndianBankCard[] => {
  if (!searchTerm.trim()) return cards;
  
  const term = searchTerm.toLowerCase();
  return cards.filter(card => 
    card.name.toLowerCase().includes(term) || 
    card.bank.toLowerCase().includes(term) ||
    card.type.toLowerCase().includes(term)
  );
};

// Helper function to filter networks by search term
export const filterNetworks = (networks: CardNetwork[], searchTerm: string): CardNetwork[] => {
  if (!searchTerm.trim()) return networks;
  
  const term = searchTerm.toLowerCase();
  return networks.filter(network => 
    network.name.toLowerCase().includes(term)
  );
};