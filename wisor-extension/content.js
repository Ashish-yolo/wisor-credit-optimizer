// Enhanced content script with web scraper
class WisorContentScript {
  constructor() {
    this.merchantDetector = new MerchantDetector();
    this.recommendationEngine = new RecommendationEngine();
    this.cardDetector = new CardDetector();
    this.widget = null;
    this.isInitialized = false;
    this.currentSubscription = null;
    this.currentMerchant = null;
    this.extractedOffers = [];
    this.offerMutationObserver = null;
    this.initializeOfferScraper();
  }

  // Initialize web scraper for offers
  initializeOfferScraper() {
    // Configuration for different sites
    this.scraperConfig = {
      'amazon.in': {
        selectors: [
          '.promoPriceBlockMessage',
          '.savingsPercentage', 
          '.dealPriceText',
          '[data-testid="coupon-offer"]',
          '.a-badge-text'
        ],
        keywords: ['off', 'discount', 'save', 'deal', 'offer', 'cashback']
      },
      'flipkart.com': {
        selectors: [
          '._3Ay6Sb._31Dcoz',
          '._1_WHN1',
          '.bankOfferSection',
          '._2ZdXDB'
        ],
        keywords: ['off', 'discount', 'bank offer', 'cashback', 'instant']
      },
      'zomato.com': {
        selectors: [
          '[data-testid="offer-card"]',
          '.offer-item',
          '.coupon-card',
          '.promo-banner'
        ],
        keywords: ['off', 'discount', 'free delivery', 'cashback', 'promo']
      },
      'swiggy.com': {
        selectors: [
          '[data-testid="offer-widget"]',
          '.RestaurantOffer__OfferContent',
          '.offer-meta'
        ],
        keywords: ['off', 'discount', 'free', 'cashback', 'combo']
      }
    };
    
    // Setup mutation observer for dynamic offers
    this.setupOfferObserver();
  }

  // Setup mutation observer for offer detection
  setupOfferObserver() {
    this.offerMutationObserver = new MutationObserver((mutations) => {
      let shouldScrape = false;
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const text = node.textContent?.toLowerCase() || '';
              if (text.includes('offer') || text.includes('discount') || text.includes('deal')) {
                shouldScrape = true;
              }
            }
          });
        }
      });

      if (shouldScrape) {
        clearTimeout(this.scrapeTimeout);
        this.scrapeTimeout = setTimeout(() => this.scrapeOffers(), 2000);
      }
    });

    this.offerMutationObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Scrape offers from current page
  scrapeOffers() {
    const hostname = window.location.hostname;
    const domain = hostname.replace('www.', '').split('.').slice(-2).join('.');
    const config = this.scraperConfig[domain];
    
    if (!config) return;

    console.log('Wisor: Scraping offers on', domain);
    
    const offers = [];
    
    config.selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        const text = element.textContent || '';
        const offer = this.extractOfferFromText(text, element);
        if (offer) {
          offers.push(offer);
        }
      });
    });

    // Remove duplicates and sort by priority
    this.extractedOffers = this.processOffers(offers);
    
    if (this.extractedOffers.length > 0) {
      console.log('Wisor: Found', this.extractedOffers.length, 'offers');
      this.updateWidgetWithOffers();
    }
  }

  // Extract offer from text content
  extractOfferFromText(text, element) {
    const cleanText = text.trim().toLowerCase();
    
    // Look for percentage discounts
    const percentMatch = cleanText.match(/(\d+)%\s*(off|discount)/);
    if (percentMatch) {
      return {
        discount: `${percentMatch[1]}% off`,
        description: text.substring(0, 80),
        priority: parseInt(percentMatch[1]) >= 20 ? 'high' : 'medium',
        element: element
      };
    }
    
    // Look for rupee amounts
    const rupeeMatch = cleanText.match(/₹\s*(\d+(?:,\d+)*)\s*(off|discount|save)/);
    if (rupeeMatch) {
      const amount = parseInt(rupeeMatch[1].replace(/,/g, ''));
      return {
        discount: `₹${rupeeMatch[1]} off`,
        description: text.substring(0, 80),
        priority: amount >= 500 ? 'high' : amount >= 100 ? 'medium' : 'low',
        element: element
      };
    }
    
    // Look for general offers
    if (cleanText.includes('free delivery') || cleanText.includes('cashback')) {
      return {
        discount: 'Special offer',
        description: text.substring(0, 80),
        priority: 'medium',
        element: element
      };
    }
    
    return null;
  }

  // Process and deduplicate offers
  processOffers(offers) {
    // Remove duplicates
    const unique = offers.filter((offer, index, self) => 
      self.findIndex(o => o.discount === offer.discount && o.description === offer.description) === index
    );
    
    // Sort by priority
    return unique.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  // Update widget with scraped offers
  updateWidgetWithOffers() {
    if (this.widget && this.extractedOffers.length > 0) {
      // Add offers section to existing widget
      const offersSection = this.createOffersSection();
      const content = this.widget.querySelector('.wisor-content');
      if (content && !content.querySelector('.wisor-offers')) {
        content.insertAdjacentHTML('beforeend', offersSection);
      }
    }
  }

  // Create offers section HTML
  createOffersSection() {
    const topOffers = this.extractedOffers.slice(0, 3);
    
    return `
      <div class="wisor-offers">
        <div class="wisor-offers-header">🔥 Live Offers Detected</div>
        <div class="wisor-offers-list">
          ${topOffers.map(offer => `
            <div class="wisor-offer-item wisor-offer-${offer.priority}">
              <div class="wisor-offer-discount">${offer.discount}</div>
              <div class="wisor-offer-desc">${offer.description}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  init() {
    if (this.isInitialized) return;
    
    // Start offer scraping after initialization
    setTimeout(() => {
      this.scrapeOffers();
    }, 3000);
    
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
        
        // Get recommendation with reactive updates
        console.log('Wisor: Calling reactive recommendation engine...', {merchant, finalCartValue});
        
        // Subscribe to live updates for this merchant
        if (this.currentSubscription) {
          this.currentSubscription();
        }
        
        this.currentMerchant = merchant;
        this.currentSubscription = this.recommendationEngine.subscribeToRewardUpdates(
          merchant,
          (updateData) => {
            if (updateData.loading) {
              this.updateWidgetLoadingState();
            } else if (updateData.recommendation) {
              this.updateWidgetRecommendation(updateData.recommendation);
            } else if (updateData.error) {
              console.error('Wisor: Reactive recommendation error:', updateData.error);
            }
          }
        );
        
        const recommendation = await this.recommendationEngine.getReactiveRecommendation(
          merchant,
          finalCartValue,
          300 // 300ms debounce
        );
        
        console.log('Wisor: Got recommendation result:', recommendation);
        
        if (recommendation && recommendation.userCardRecommendations && recommendation.userCardRecommendations.length > 0) {
          console.log('Wisor: Showing widget with', recommendation.userCardRecommendations.length, 'recommendations');
          this.showWidget(recommendation);
        } else {
          console.log('Wisor: No valid recommendations, showing demo widget');
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
            <div style="font-size: 12px; opacity: 0.7; margin-top: 8px;">Wisor is doing its magic...</div>
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
    
    console.log('Wisor: Updating widget with recommendation:', recommendation);
    
    const bestRecommendation = recommendation.userCardRecommendations[0];
    const merchant = recommendation.merchant;
    
    // Replace the entire content with the actual recommendation
    const content = this.widget.querySelector('.wisor-content');
    if (content) {
      content.innerHTML = `
        <div class="wisor-merchant">
          <span class="wisor-merchant-icon">🏪</span>
          <span>${merchant.name || 'Shopping Site'} detected</span>
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
            ${recommendation.userCardRecommendations.some(r => r.source === 'demo') ? 'Learn More' : 'Get This Card'}
          </button>
        </div>
      `;
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

  updateWidgetLoadingState() {
    if (this.widget && document.body.contains(this.widget)) {
      const recommendationSection = this.widget.querySelector('.wisor-recommendation');
      if (recommendationSection) {
        recommendationSection.innerHTML = `
          <div class="wisor-loading">
            <div class="wisor-spinner"></div>
            <span>Calculating best rewards...</span>
          </div>
        `;
      }
    }
  }

  updateWidgetRecommendation(recommendation) {
    if (this.widget && document.body.contains(this.widget) && recommendation?.userCardRecommendations?.length > 0) {
      const recommendationSection = this.widget.querySelector('.wisor-recommendation');
      const topRecommendation = recommendation.userCardRecommendations[0];
      
      if (recommendationSection) {
        recommendationSection.innerHTML = `
          <div class="wisor-best-card">
            <div class="wisor-card-header">
              <span class="wisor-card-icon">💳</span>
              <div>
                <div class="wisor-card-name">${topRecommendation.card.name}</div>
                <div class="wisor-card-bank">${topRecommendation.card.bank}</div>
              </div>
              <div class="wisor-reward-badge">
                ₹${topRecommendation.value}
              </div>
            </div>
            <div class="wisor-card-description">
              ${topRecommendation.description}
              ${recommendation.aiPowered ? ' <span class="wisor-ai-badge">🤖 AI</span>' : ''}
            </div>
          </div>
        `;
      }
    }
  }

  // Cleanup method
  cleanup() {
    if (this.currentSubscription) {
      this.currentSubscription();
      this.currentSubscription = null;
    }
  }

  showDemoWidget() {
    console.log('Wisor: Creating demo widget...');
    
    // Show a demo widget with sample recommendations for testing
    const demoRecommendation = {
      userCardRecommendations: [{
        card: { 
          name: 'HDFC Millennia', 
          bank: 'HDFC',
          applyUrl: 'https://bankbazaar.com'
        },
        value: 75,
        description: 'Demo: 5% cashback on online shopping (up to ₹1000/month)',
        source: 'demo',
        cartValue: 1500
      }, {
        card: { 
          name: 'SBI SimplyCLICK', 
          bank: 'SBI',
          applyUrl: 'https://bankbazaar.com'
        },
        value: 50,
        description: 'Demo: 5X rewards on online shopping',
        source: 'demo',
        cartValue: 1500
      }],
      aiPowered: false,
      merchant: { name: window.location.hostname || 'Shopping Site' },
      cartValue: 1500
    };
    
    console.log('Wisor: Showing demo widget with recommendations:', demoRecommendation);
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