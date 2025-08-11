// Merchant Detection Logic
class MerchantDetector {
  constructor() {
    this.currentMerchant = null;
    this.isCheckoutPage = false;
  }

  detectCurrentMerchant() {
    const hostname = window.location.hostname.toLowerCase();
    const pathname = window.location.pathname.toLowerCase();
    
    // Remove www. prefix
    const cleanHostname = hostname.replace(/^www\./, '');
    
    // Find merchant in our database
    const merchant = MERCHANT_CATEGORIES[cleanHostname];
    
    if (merchant) {
      this.currentMerchant = {
        ...merchant,
        hostname: cleanHostname,
        url: window.location.href
      };
    }
    
    return this.currentMerchant;
  }

  detectCheckoutPage() {
    const url = window.location.href.toLowerCase();
    const pathname = window.location.pathname.toLowerCase();
    
    // Common checkout page indicators
    const checkoutIndicators = [
      '/checkout',
      '/cart',
      '/payment',
      '/pay',
      '/order',
      '/billing',
      '/purchase',
      'checkout=true',
      'step=payment',
      'buy-now'
    ];
    
    this.isCheckoutPage = checkoutIndicators.some(indicator => 
      url.includes(indicator) || pathname.includes(indicator)
    );
    
    // Special cases for specific merchants
    if (this.currentMerchant) {
      switch (this.currentMerchant.hostname) {
        case 'amazon.in':
          this.isCheckoutPage = this.isCheckoutPage || 
            pathname.includes('/gp/buy') || 
            pathname.includes('/gp/cart') ||
            pathname.includes('/ap/signin') && url.includes('openid.return_to') ||
            document.querySelector('#sc-active-cart') !== null ||
            document.querySelector('.a-button-buybox') !== null;
          break;
        case 'flipkart.com':
          this.isCheckoutPage = this.isCheckoutPage || 
            pathname.includes('/checkout') ||
            document.querySelector('[data-testid="cart"]') !== null;
          break;
        case 'zomato.com':
          this.isCheckoutPage = this.isCheckoutPage || 
            pathname.includes('/payment') ||
            pathname.includes('/checkout') ||
            document.querySelector('.payment-container') !== null ||
            document.querySelector('[data-cy="checkout"]') !== null ||
            document.querySelector('.cart-container') !== null ||
            url.includes('checkout') ||
            document.body.textContent.includes('Place Order');
          break;
        case 'swiggy.com':
          this.isCheckoutPage = this.isCheckoutPage ||
            pathname.includes('/checkout') ||
            url.includes('checkout');
          break;
      }
    }
    
    return this.isCheckoutPage;
  }

  detectCartValue() {
    console.log('Wisor: Starting cart value detection...');
    let cartValue = 0;
    
    try {
      // Universal price detection - scan ALL text on page for price patterns
      const allText = document.body.innerText || document.body.textContent;
      const priceMatches = allText.match(/₹[\d,]+(?:\.\d{2})?/g);
      
      if (priceMatches) {
        console.log('Wisor: Found price patterns:', priceMatches.slice(0, 10));
        // Get the highest reasonable price (likely to be total)
        const prices = priceMatches
          .map(match => parseFloat(match.replace(/[₹,]/g, '')))
          .filter(price => price > 50 && price < 100000) // Reasonable range
          .sort((a, b) => b - a); // Highest first
          
        if (prices.length > 0) {
          cartValue = prices[0];
          console.log('Wisor: Selected highest reasonable price:', cartValue);
        }
      }
      
      // Also try specific selectors for common patterns
      const commonSelectors = [
        // Generic price patterns
        '*[class*="total"]', '*[class*="price"]', '*[class*="amount"]',
        '*[id*="total"]', '*[id*="price"]', '*[id*="amount"]',
        // Common checkout patterns
        '.checkout-total', '.order-total', '.cart-total', '.grand-total',
        '.final-total', '.payable-amount', '.bill-amount',
        // Data attributes
        '[data-testid*="total"]', '[data-testid*="price"]',
        '[data-cy*="total"]', '[data-cy*="price"]'
      ];
      
      for (const selector of commonSelectors) {
        const elements = document.querySelectorAll(selector);
        for (const element of elements) {
          const text = element.textContent || element.innerText;
          const match = text.match(/₹[\d,]+(?:\.\d{2})?/);
          if (match) {
            const price = parseFloat(match[0].replace(/[₹,]/g, ''));
            if (price > cartValue && price > 50 && price < 100000) {
              cartValue = price;
              console.log(`Wisor: Found better price ${price} in ${selector}:`, text.trim());
            }
          }
        }
      }
      
      // Default fallback for any shopping page
      if (cartValue === 0) {
        const url = window.location.href.toLowerCase();
        if (url.includes('amazon') || url.includes('flipkart') || 
            url.includes('zomato') || url.includes('swiggy') ||
            url.includes('cart') || url.includes('checkout') ||
            url.includes('buy') || url.includes('order')) {
          cartValue = 1500; // Default for shopping pages
          console.log('Wisor: Using default value for shopping page');
        }
      }
      
    } catch (error) {
      console.log('Wisor: Error detecting cart value:', error);
      cartValue = 1500; // Safe default
    }
    
    console.log('Wisor: Final detected cart value:', cartValue);
    return cartValue;
  }

  shouldShowRecommendation() {
    return this.currentMerchant && (this.isCheckoutPage || this.detectCartValue() > 0);
  }
}