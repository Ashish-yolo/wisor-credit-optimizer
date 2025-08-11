// Main content script
class WisorContentScript {
  constructor() {
    this.merchantDetector = new MerchantDetector();
    this.recommendationEngine = new RecommendationEngine();
    this.cardDetector = new CardDetector();
    this.widget = null;
    this.isInitialized = false;
  }

  init() {
    if (this.isInitialized) return;
    
    console.log('Wisor: Initializing on', window.location.hostname);
    console.log('Wisor: URL:', window.location.href);
    
    // Detect current merchant
    const merchant = this.merchantDetector.detectCurrentMerchant();
    
    if (merchant) {
      console.log('Wisor: Detected merchant:', merchant);
      this.startMonitoring();
    } else {
      console.log('Wisor: No merchant detected for:', window.location.hostname);
    }
    
    this.isInitialized = true;
  }

  startMonitoring() {
    // Check immediately but with delay to avoid crashes
    setTimeout(() => {
      this.checkAndShowRecommendation();
    }, 2000);
    
    // Very limited monitoring to avoid performance issues
    let hasChecked = false;
    const lightObserver = new MutationObserver(() => {
      if (!hasChecked) {
        hasChecked = true;
        setTimeout(() => {
          this.checkAndShowRecommendation();
          hasChecked = false;
        }, 3000);
      }
    });
    
    // Only observe major changes
    lightObserver.observe(document.body, {
      childList: true,
      subtree: false
    });
  }

  async checkAndShowRecommendation() {
    try {
      console.log('Wisor: Starting check on URL:', window.location.href);
      console.log('Wisor: Current merchant detected:', this.merchantDetector.currentMerchant);
      
      // First, try to detect and sync cards from payment page
      if (this.merchantDetector.currentMerchant?.hostname === 'amazon.in') {
        this.cardDetector.syncDetectedCards();
      }
      
      const isCheckout = this.merchantDetector.detectCheckoutPage();
      const cartValue = this.merchantDetector.detectCartValue();
      
      console.log('Wisor: Detection results:', {
        merchant: this.merchantDetector.currentMerchant?.name || 'None detected',
        hostname: this.merchantDetector.currentMerchant?.hostname || 'Unknown',
        checkout: isCheckout, 
        cart: cartValue, 
        userCards: USER_CARDS.length,
        url: window.location.href
      });
      
      // Show widget if we found any price or on any shopping site
      const shouldShow = cartValue > 0 || window.location.hostname.includes('amazon') || 
                        window.location.hostname.includes('flipkart') || 
                        window.location.hostname.includes('zomato');
      
      console.log('Wisor: Should show widget?', shouldShow, {cartValue, hostname: window.location.hostname});
      
      if (shouldShow) {
        // Update recommendation engine with latest cards
        this.recommendationEngine.userCards = USER_CARDS;
        
        // Use detected cart value or reasonable default
        const finalCartValue = cartValue > 0 ? cartValue : 1500;
        
        console.log(`Wisor: Processing shopping page with value ₹${finalCartValue}`);
        
        // Show loading state first
        this.showLoadingWidget();
        
        // Create simple merchant object
        const merchant = this.merchantDetector.currentMerchant || {
          name: window.location.hostname,
          hostname: window.location.hostname,
          category: 'shopping'
        };
        
        // Get recommendation (now async with Claude integration)
        const recommendation = await this.recommendationEngine.getRecommendationForMerchant(
          merchant,
          finalCartValue
        );
        
        if (recommendation && recommendation.userCardRecommendations.length > 0) {
          console.log('Wisor: Showing widget', recommendation.aiPowered ? '(AI-powered)' : '(local)');
          this.showWidget(recommendation);
        } else {
          console.log('Wisor: No recommendations found, showing demo');
          this.showDemoWidget();
        }
      } else {
        console.log('Wisor: Not showing widget. Reasons:', {
          noMerchant: !this.merchantDetector.currentMerchant,
          notCheckout: !isCheckout,
          noCartValue: cartValue === 0,
          notSupportedPage: !this.isLikelySupportedPage()
        });
        
        // Show demo widget on any supported shopping site for testing
        if (window.location.hostname.includes('amazon') || 
            window.location.hostname.includes('flipkart') ||
            window.location.hostname.includes('zomato')) {
          console.log('Wisor: Showing demo widget for testing');
          this.showDemoWidget();
        }
      }
    } catch (error) {
      console.log('Wisor: Error:', error.message);
      this.hideWidget();
    }
  }

  showLoadingWidget() {
    if (this.widget) {
      // Update existing widget to show loading
      const content = this.widget.querySelector('.wisor-content');
      if (content) {
        content.innerHTML = `
          <div class="wisor-loading" style="text-align: center; padding: 20px;">
            <div style="font-size: 24px; margin-bottom: 10px;">🤖</div>
            <div>Getting recommendations...</div>
            <div style="font-size: 12px; opacity: 0.7; margin-top: 8px;">AI first, then local fallback (8s max)</div>
          </div>
        `;
      }
      return;
    }

    // Create loading widget
    this.widget = document.createElement('div');
    this.widget.id = 'wisor-widget';
    this.widget.className = 'wisor-widget';
    
    this.widget.innerHTML = `
      <div class="wisor-header">
        <div class="wisor-logo">
          <span class="wisor-icon">💳</span>
          <span class="wisor-title">Wisor AI</span>
        </div>
        <button class="wisor-close" onclick="this.parentElement.parentElement.style.display='none'">×</button>
      </div>
      <div class="wisor-content">
        <div class="wisor-loading" style="text-align: center; padding: 20px;">
          <div style="font-size: 24px; margin-bottom: 10px;">🤖</div>
          <div>Getting AI recommendations...</div>
        </div>
      </div>
    `;
    
    this.positionWidget();
    document.body.appendChild(this.widget);
    
    setTimeout(() => {
      this.widget.classList.add('wisor-show');
    }, 100);
  }

  showWidget(recommendation) {
    if (this.widget) {
      this.updateWidget(recommendation);
      return;
    }
    
    this.createWidget(recommendation);
  }

  createWidget(recommendation) {
    const bestRecommendation = recommendation.userCardRecommendations[0];
    const merchant = recommendation.merchant;
    
    // Create widget container
    this.widget = document.createElement('div');
    this.widget.id = 'wisor-widget';
    this.widget.className = 'wisor-widget';
    
    this.widget.innerHTML = `
      <div class="wisor-header">
        <div class="wisor-logo">
          <span class="wisor-icon">${recommendation.aiPowered ? '🤖' : '💳'}</span>
          <span class="wisor-title">Wisor ${recommendation.aiPowered ? 'AI' : ''}</span>
        </div>
        <button class="wisor-close" onclick="this.parentElement.parentElement.style.display='none'">×</button>
      </div>
      
      <div class="wisor-content">
        <div class="wisor-merchant">
          <span class="wisor-merchant-icon">🏪</span>
          <span>${merchant.name} detected</span>
        </div>
        
        <div class="wisor-recommendation">
          <div class="wisor-rec-header">💡 Smart Recommendation</div>
          <div class="wisor-rec-card">
            <div class="wisor-card-info">
              <div class="wisor-card-name">${bestRecommendation.card.name}</div>
              <div class="wisor-card-bank">${bestRecommendation.card.bank}</div>
            </div>
            <div class="wisor-benefit">
              <div class="wisor-benefit-value">₹${Math.round(bestRecommendation.value)}</div>
              <div class="wisor-benefit-desc">Potential reward</div>
            </div>
          </div>
          <div class="wisor-benefit-details">
            ${bestRecommendation.description}
          </div>
        </div>
        
        ${recommendation.userCardRecommendations.length > 1 ? `
          <div class="wisor-alternatives">
            <div class="wisor-alternatives-title">Other options:</div>
            ${recommendation.userCardRecommendations.slice(1, 3).map(rec => `
              <div class="wisor-alt-card">
                <span class="wisor-alt-name">${rec.card.name}</span>
                <span class="wisor-alt-value">₹${Math.round(rec.value)}</span>
              </div>
            `).join('')}
          </div>
        ` : ''}
        
        <div class="wisor-actions">
          <button class="wisor-btn-secondary" onclick="document.getElementById('wisor-widget').style.display='none'">
            Maybe Later
          </button>
          <button class="wisor-btn-primary" onclick="window.open('${bestRecommendation.card.applyUrl || 'https://bankbazaar.com'}', '_blank')">
            Get This Card
          </button>
        </div>
      </div>
    `;
    
    // Position widget
    this.positionWidget();
    
    // Add to page
    document.body.appendChild(this.widget);
    
    // Animate in
    setTimeout(() => {
      this.widget.classList.add('wisor-show');
    }, 100);
  }

  updateWidget(recommendation) {
    if (!this.widget) return;
    
    const bestRecommendation = recommendation.userCardRecommendations[0];
    
    // Update benefit value
    const valueElement = this.widget.querySelector('.wisor-benefit-value');
    if (valueElement) {
      valueElement.textContent = `₹${Math.round(bestRecommendation.value)}`;
    }
  }

  positionWidget() {
    if (!this.widget) return;
    
    // Try to position near checkout/payment area
    const paymentSelectors = [
      '[data-testid="payment"]',
      '.payment-container',
      '.checkout-container',
      '#checkout',
      '.cart-summary',
      '.order-summary'
    ];
    
    let targetElement = null;
    for (const selector of paymentSelectors) {
      targetElement = document.querySelector(selector);
      if (targetElement) break;
    }
    
    if (targetElement) {
      // Position relative to payment area
      const rect = targetElement.getBoundingClientRect();
      this.widget.style.position = 'fixed';
      this.widget.style.top = `${rect.top + 10}px`;
      this.widget.style.right = '20px';
    } else {
      // Default position
      this.widget.style.position = 'fixed';
      this.widget.style.bottom = '20px';
      this.widget.style.right = '20px';
    }
  }

  hideWidget() {
    if (this.widget) {
      this.widget.style.display = 'none';
    }
  }

  isLikelySupportedPage() {
    const url = window.location.href.toLowerCase();
    const pathname = window.location.pathname.toLowerCase();
    
    // Check for common shopping/checkout indicators
    const indicators = [
      'cart', 'checkout', 'buy', 'order', 'payment', 'billing',
      'product', 'item', 'shop', 'store', 'add-to-cart'
    ];
    
    return indicators.some(indicator => 
      url.includes(indicator) || pathname.includes(indicator)
    );
  }

  showDemoWidget() {
    // Show a demo widget with sample recommendations for testing
    const demoRecommendation = {
      userCardRecommendations: [{
        card: { name: 'HDFC Millennia', bank: 'HDFC' },
        value: 50,
        description: 'Demo: 5% cashback on online shopping',
        source: 'demo'
      }],
      aiPowered: true,
      merchant: { name: window.location.hostname }
    };
    
    this.showWidget(demoRecommendation);
  }
}

// Initialize when page loads - simplified to avoid crashes
setTimeout(() => {
  try {
    console.log('Wisor: Starting...');
    const wisorScript = new WisorContentScript();
    wisorScript.init();
  } catch (error) {
    console.log('Wisor: Init error:', error.message);
  }
}, 3000); // Wait 3 seconds to let page load completely