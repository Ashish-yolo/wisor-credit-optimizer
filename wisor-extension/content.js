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

  checkAndShowRecommendation() {
    try {
      // First, try to detect and sync cards from payment page
      if (this.merchantDetector.currentMerchant?.hostname === 'amazon.in') {
        this.cardDetector.syncDetectedCards();
      }
      
      const isCheckout = this.merchantDetector.detectCheckoutPage();
      const cartValue = this.merchantDetector.detectCartValue();
      
      console.log('Wisor: Checking...', {checkout: isCheckout, cart: cartValue, userCards: USER_CARDS.length});
      
      // Show widget on any supported merchant page
      if (this.merchantDetector.currentMerchant) {
        // Update recommendation engine with latest cards
        this.recommendationEngine.userCards = USER_CARDS;
        
        const recommendation = this.recommendationEngine.getRecommendationForMerchant(
          this.merchantDetector.currentMerchant,
          cartValue || 1000
        );
        
        if (recommendation && recommendation.userCardRecommendations.length > 0) {
          console.log('Wisor: Showing widget');
          this.showWidget(recommendation);
        }
      }
    } catch (error) {
      console.log('Wisor: Error:', error.message);
    }
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
          <span class="wisor-icon">💳</span>
          <span class="wisor-title">Wisor</span>
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