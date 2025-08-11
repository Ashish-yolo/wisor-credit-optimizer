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
    let cartValue = 0;
    
    try {
      // Amazon cart detection - expanded selectors
      if (this.currentMerchant?.hostname === 'amazon.in') {
        const priceSelectors = [
          '#sc-subtotal-amount-activecart .a-price-whole',
          '#sc-subtotal-amount-buybox .a-price-whole',
          '.a-price-whole',
          '[data-cy="price-recipe"] .a-price-whole',
          '.sw-subtotal-details-total .a-price-whole',
          '.grand-total-price .a-price-whole'
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
      
      // Flipkart cart detection - expanded
      else if (this.currentMerchant?.hostname === 'flipkart.com') {
        const priceSelectors = [
          '._1f22mC', 
          '.ZP7ysC',
          '._2-ut7d',
          '._1dqRvU',
          '[data-testid="total-payable"]'
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
      
      // Zomato order value - expanded
      else if (this.currentMerchant?.hostname === 'zomato.com') {
        const priceSelectors = [
          '.total-price', 
          '[data-cy="total-bill"]',
          '.bill-total',
          '.grand-total',
          '.order-total'
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
      
      // Generic detection for all sites
      if (cartValue === 0) {
        const priceSelectors = [
          '.total-price',
          '.cart-total', 
          '.order-total',
          '.grand-total',
          '.bill-total',
          '[data-testid="total"]',
          '[data-testid="cart-total"]',
          '.total',
          '.price-total',
          '.checkout-total',
          '.payment-total',
          '.subtotal'
        ];
        
        for (const selector of priceSelectors) {
          const elements = document.querySelectorAll(selector);
          for (const element of elements) {
            const text = element.textContent || element.innerText;
            const price = parseFloat(text.replace(/[₹,]/g, ''));
            if (price > 0) {
              cartValue = price;
              break;
            }
          }
          if (cartValue > 0) break;
        }
      }
      
      // If still no cart value found, use default for checkout pages
      if (cartValue === 0 && this.isCheckoutPage) {
        cartValue = 1000; // Default value for checkout pages
        console.log('Wisor: Using default cart value for checkout page');
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