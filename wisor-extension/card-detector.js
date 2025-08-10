// Card Detection from Payment Pages
class CardDetector {
  constructor() {
    this.detectedCards = new Set();
  }

  // Detect cards from Amazon payment page
  detectAmazonCards() {
    const detectedCards = [];
    
    try {
      // Amazon payment methods selector
      const paymentMethods = document.querySelectorAll(
        '.a-radio[name="ppw-instrumentRowSelection"], .pmts-instrument-container, [data-testid="payment-method"]'
      );
      
      paymentMethods.forEach(method => {
        const cardInfo = this.extractCardInfo(method);
        if (cardInfo) {
          detectedCards.push(cardInfo);
        }
      });

      // Also check saved payment methods
      const savedCards = document.querySelectorAll('.pmts-credit-card, .pmts-instrument-details');
      savedCards.forEach(card => {
        const cardInfo = this.extractCardInfo(card);
        if (cardInfo) {
          detectedCards.push(cardInfo);
        }
      });

    } catch (error) {
      console.log('Wisor: Card detection error:', error.message);
    }

    return detectedCards;
  }

  extractCardInfo(element) {
    try {
      const text = element.textContent.toLowerCase();
      
      // HDFC Bank detection
      if (text.includes('hdfc')) {
        if (text.includes('millennia')) return 'hdfc-millennia';
        if (text.includes('regalia')) return 'hdfc-regalia';
        return 'hdfc-generic';
      }
      
      // SBI Cards detection
      if (text.includes('sbi') || text.includes('state bank')) {
        if (text.includes('simply') || text.includes('click')) return 'sbi-simplyclick';
        if (text.includes('prime')) return 'sbi-prime';
        return 'sbi-generic';
      }
      
      // ICICI Bank detection
      if (text.includes('icici')) {
        if (text.includes('amazon')) return 'icici-amazon-pay';
        if (text.includes('platinum')) return 'icici-platinum';
        return 'icici-generic';
      }
      
      // Axis Bank detection
      if (text.includes('axis')) {
        if (text.includes('flipkart')) return 'axis-flipkart';
        if (text.includes('ace')) return 'axis-ace';
        return 'axis-generic';
      }
      
      // Kotak detection
      if (text.includes('kotak')) {
        return 'kotak-league-platinum';
      }
      
      // American Express detection
      if (text.includes('american express') || text.includes('amex')) {
        return 'amex-gold-charge';
      }

    } catch (error) {
      console.log('Wisor: Card extraction error:', error.message);
    }
    
    return null;
  }

  // Get all detected cards and add to user's portfolio
  syncDetectedCards() {
    const amazonCards = this.detectAmazonCards();
    
    if (amazonCards.length > 0) {
      console.log('Wisor: Detected cards:', amazonCards);
      
      // Add to USER_CARDS if not already present
      amazonCards.forEach(cardId => {
        if (INDIAN_CREDIT_CARDS[cardId] && !USER_CARDS.includes(cardId)) {
          USER_CARDS.push(cardId);
          console.log('Wisor: Added detected card:', cardId);
        }
      });
      
      // Store in browser storage
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.sync.set({ userCards: USER_CARDS });
      }
    }
    
    return amazonCards;
  }
}