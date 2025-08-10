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
            pathname.includes('/ap/signin') && url.includes('openid.return_to');
          break;
        case 'flipkart.com':
          this.isCheckoutPage = this.isCheckoutPage || 
            pathname.includes('/checkout');
          break;
        case 'zomato.com':
          this.isCheckoutPage = this.isCheckoutPage || 
            pathname.includes('/payment') ||
            document.querySelector('.payment-container') !== null;
          break;
      }
    }
    
    return this.isCheckoutPage;
  }

  detectCartValue() {
    let cartValue = 0;
    
    try {
      // Amazon cart detection
      if (this.currentMerchant?.hostname === 'amazon.in') {
        const priceElement = document.querySelector('#sc-subtotal-amount-activecart .a-price-whole, .a-price-whole');
        if (priceElement) {
          cartValue = parseFloat(priceElement.textContent.replace(/[₹,]/g, '')) || 0;
        }
      }
      
      // Flipkart cart detection
      if (this.currentMerchant?.hostname === 'flipkart.com') {
        const priceElement = document.querySelector('._1f22mC, .ZP7ysC');
        if (priceElement) {
          cartValue = parseFloat(priceElement.textContent.replace(/[₹,]/g, '')) || 0;
        }
      }
      
      // Zomato order value
      if (this.currentMerchant?.hostname === 'zomato.com') {
        const priceElement = document.querySelector('.total-price, [data-cy="total-bill"]');
        if (priceElement) {
          cartValue = parseFloat(priceElement.textContent.replace(/[₹,]/g, '')) || 0;
        }
      }
      
      // Generic detection for other sites
      if (cartValue === 0) {
        const priceSelectors = [
          '.total-price',
          '.cart-total',
          '.order-total',
          '.grand-total',
          '[data-testid="total"]',
          '.total'
        ];
        
        for (const selector of priceSelectors) {
          const element = document.querySelector(selector);
          if (element) {
            const price = parseFloat(element.textContent.replace(/[₹,]/g, ''));
            if (price > 0) {
              cartValue = price;
              break;
            }
          }
        }
      }
    } catch (error) {
      console.log('Wisor: Error detecting cart value:', error);
    }
    
    return cartValue;
  }

  shouldShowRecommendation() {
    return this.currentMerchant && (this.isCheckoutPage || this.detectCartValue() > 0);
  }
}