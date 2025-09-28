// Enhanced content script with ScraperAgent integration
declare global {
  interface Window {
    ScraperAgent: any;
    MerchantDetector: any;
    RecommendationEngine: any;
    CardDetector: any;
  }
}

interface ExtractedOffer {
  title: string;
  discount: string;
  description: string;
  validUntil?: string;
  minAmount?: number;
  cardRequired?: string;
  url: string;
  priority: 'high' | 'medium' | 'low';
}

class EnhancedWisorContentScript {
  private merchantDetector: any;
  private recommendationEngine: any;
  private cardDetector: any;
  private scraperAgent: any;
  private widget: HTMLElement | null = null;
  private isInitialized: boolean = false;
  private currentSubscription: any = null;
  private currentMerchant: any = null;
  private extractedOffers: ExtractedOffer[] = [];

  constructor() {
    this.merchantDetector = new window.MerchantDetector();
    this.recommendationEngine = new window.RecommendationEngine();
    this.cardDetector = new window.CardDetector();
    this.scraperAgent = null; // Will initialize after ScraperAgent loads
  }

  // Initialize the content script
  init(): void {
    if (this.isInitialized) return;
    
    console.log('Wisor Enhanced: Initializing on', window.location.hostname);
    
    // Initialize scraper agent if available
    this.initializeScraper();
    
    // Detect current merchant
    const merchant = this.merchantDetector.detectCurrentMerchant();
    
    if (merchant) {
      console.log('Wisor Enhanced: Detected merchant:', merchant);
      this.currentMerchant = merchant;
      this.startEnhancedMonitoring();
    } else {
      console.log('Wisor Enhanced: No merchant detected for:', window.location.hostname);
    }
    
    // Listen for offers from scraper
    this.setupOfferListener();
    
    this.isInitialized = true;
  }

  // Initialize scraper agent
  private initializeScraper(): void {
    try {
      if (window.ScraperAgent) {
        this.scraperAgent = new window.ScraperAgent();
        console.log('Wisor Enhanced: ScraperAgent initialized');
        
        // Start scraping immediately
        setTimeout(() => {
          this.scraperAgent.scrapeCurrentPage();
        }, 1000);
      } else {
        console.log('Wisor Enhanced: ScraperAgent not available');
      }
    } catch (error) {
      console.error('Wisor Enhanced: Failed to initialize ScraperAgent:', error);
    }
  }

  // Setup listener for extracted offers
  private setupOfferListener(): void {
    window.addEventListener('message', (event) => {
      if (event.data.type === 'WISOR_OFFERS_EXTRACTED') {
        this.extractedOffers = event.data.offers;
        console.log('Wisor Enhanced: Received offers:', this.extractedOffers);
        
        // Update widget with new offers
        this.updateWidgetWithOffers();
        
        // Send offers to background script for storage
        this.sendOffersToBackground();
      }
    });
  }

  // Enhanced monitoring with scraper integration
  private startEnhancedMonitoring(): void {
    // Original recommendation monitoring
    setTimeout(() => {
      this.checkAndShowRecommendation();
    }, 2000);
    
    // Enhanced monitoring for offers and dynamic content
    let hasChecked = false;
    const enhancedObserver = new MutationObserver((mutations) => {
      if (!hasChecked) {
        hasChecked = true;
        
        // Check for price changes or new offers
        const hasOfferChanges = mutations.some(mutation => 
          this.containsOfferRelatedChanges(mutation)
        );
        
        if (hasOfferChanges && this.scraperAgent) {
          setTimeout(() => {
            this.scraperAgent.scrapeCurrentPage();
          }, 1000);
        }
        
        // Original recommendation check
        setTimeout(() => {
          this.checkAndShowRecommendation();
          hasChecked = false;
        }, 3000);
      }
    });
    
    // Observe for changes
    enhancedObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'data-price', 'data-discount']
    });
  }

  // Check if mutations contain offer-related changes
  private containsOfferRelatedChanges(mutation: MutationRecord): boolean {
    if (mutation.type === 'childList') {
      for (const node of Array.from(mutation.addedNodes)) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as Element;
          const text = element.textContent?.toLowerCase() || '';
          const offerKeywords = ['offer', 'discount', 'deal', 'save', 'off', 'promo', 'cashback'];
          
          if (offerKeywords.some(keyword => text.includes(keyword))) {
            return true;
          }
        }
      }
    }
    
    if (mutation.type === 'attributes') {
      const target = mutation.target as Element;
      const text = target.textContent?.toLowerCase() || '';
      return text.includes('price') || text.includes('discount') || text.includes('offer');
    }
    
    return false;
  }

  // Original recommendation method (preserved)
  private async checkAndShowRecommendation(): Promise<void> {
    try {
      const cartValue = this.cardDetector.detectCartValue();
      
      if (cartValue && cartValue > 0) {
        console.log('Wisor Enhanced: Cart value detected:', cartValue);
        
        if (this.currentSubscription) {
          this.currentSubscription();
        }
        
        this.currentSubscription = this.recommendationEngine.subscribeToRewardUpdates(
          this.currentMerchant,
          (data: any) => {
            if (data.loading) {
              this.showWidget({ loading: true, cartValue });
            } else if (data.recommendation) {
              // Enhanced widget with offers
              this.showWidget({ 
                recommendation: data.recommendation, 
                cartValue,
                offers: this.extractedOffers 
              });
            } else if (data.error) {
              console.error('Wisor Enhanced: Recommendation error:', data.error);
            }
          }
        );
        
        // Get reactive recommendation
        this.recommendationEngine.getReactiveRecommendation(this.currentMerchant, cartValue);
      }
    } catch (error) {
      console.error('Wisor Enhanced: Error in checkAndShowRecommendation:', error);
    }
  }

  // Enhanced widget display with offers
  private showWidget(data: any): void {
    if (this.widget) {
      this.widget.remove();
    }
    
    this.widget = this.createEnhancedWidget(data);
    document.body.appendChild(this.widget);
  }

  // Create enhanced widget with offers section
  private createEnhancedWidget(data: any): HTMLElement {
    const widget = document.createElement('div');
    widget.id = 'wisor-enhanced-widget';
    widget.innerHTML = `
      <div class="wisor-widget-content">
        ${this.createWidgetHeader()}
        ${data.loading ? this.createLoadingSection() : ''}
        ${data.recommendation ? this.createRecommendationSection(data.recommendation, data.cartValue) : ''}
        ${this.extractedOffers.length > 0 ? this.createOffersSection() : ''}
        ${this.createActionButtons()}
      </div>
    `;
    
    this.addWidgetEventListeners(widget);
    return widget;
  }

  // Create widget header
  private createWidgetHeader(): string {
    return `
      <div class="wisor-header">
        <div class="wisor-logo">
          <span class="wisor-icon">💳</span>
          <span class="wisor-title">Wisor</span>
        </div>
        <button class="wisor-close" id="wisor-close">×</button>
      </div>
    `;
  }

  // Create loading section
  private createLoadingSection(): string {
    return `
      <div class="wisor-loading">
        <div class="wisor-spinner"></div>
        <p>Finding best card & offers...</p>
      </div>
    `;
  }

  // Create recommendation section (enhanced)
  private createRecommendationSection(recommendation: any, cartValue: number): string {
    const bestCard = recommendation.userCardRecommendations?.[0];
    if (!bestCard) return '';
    
    return `
      <div class="wisor-recommendation">
        <h3>💡 Best Card Recommendation</h3>
        <div class="wisor-card-rec">
          <div class="wisor-card-name">${bestCard.card.name}</div>
          <div class="wisor-reward-value">Save ₹${bestCard.value}</div>
          <div class="wisor-description">${bestCard.description}</div>
        </div>
        ${recommendation.aiPowered ? '<div class="wisor-ai-badge">🤖 AI Powered</div>' : ''}
      </div>
    `;
  }

  // Create offers section (new)
  private createOffersSection(): string {
    const topOffers = this.extractedOffers.slice(0, 3);
    
    return `
      <div class="wisor-offers">
        <h3>🔥 Live Offers Detected</h3>
        <div class="wisor-offers-list">
          ${topOffers.map(offer => `
            <div class="wisor-offer-item ${offer.priority}">
              <div class="wisor-offer-discount">${offer.discount}</div>
              <div class="wisor-offer-title">${offer.title}</div>
              <div class="wisor-offer-desc">${offer.description}</div>
              ${offer.validUntil ? `<div class="wisor-offer-validity">Until: ${offer.validUntil}</div>` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // Create action buttons
  private createActionButtons(): string {
    return `
      <div class="wisor-actions">
        <button class="wisor-btn wisor-btn-primary" id="wisor-optimize">
          ⚡ Optimize Cards
        </button>
        <button class="wisor-btn wisor-btn-secondary" id="wisor-offers">
          🎯 View All Offers
        </button>
      </div>
    `;
  }

  // Add event listeners to widget
  private addWidgetEventListeners(widget: HTMLElement): void {
    // Close button
    const closeBtn = widget.querySelector('#wisor-close');
    closeBtn?.addEventListener('click', () => {
      widget.remove();
    });
    
    // Optimize cards button
    const optimizeBtn = widget.querySelector('#wisor-optimize');
    optimizeBtn?.addEventListener('click', () => {
      this.openOptimizationFlow();
    });
    
    // View offers button
    const offersBtn = widget.querySelector('#wisor-offers');
    offersBtn?.addEventListener('click', () => {
      this.openOffersView();
    });
  }

  // Open optimization flow (triggers popup)
  private openOptimizationFlow(): void {
    chrome.runtime.sendMessage({
      type: 'OPEN_OPTIMIZATION_FLOW',
      merchant: this.currentMerchant,
      offers: this.extractedOffers
    });
  }

  // Open offers view
  private openOffersView(): void {
    chrome.runtime.sendMessage({
      type: 'OPEN_OFFERS_VIEW',
      offers: this.extractedOffers,
      url: window.location.href
    });
  }

  // Update widget with new offers
  private updateWidgetWithOffers(): void {
    if (this.widget && this.extractedOffers.length > 0) {
      const offersSection = this.widget.querySelector('.wisor-offers');
      if (!offersSection) {
        // Add offers section if it doesn't exist
        const widgetContent = this.widget.querySelector('.wisor-widget-content');
        if (widgetContent) {
          const offersHtml = this.createOffersSection();
          const actionsSection = widgetContent.querySelector('.wisor-actions');
          if (actionsSection) {
            actionsSection.insertAdjacentHTML('beforebegin', offersHtml);
          }
        }
      }
    }
  }

  // Send offers to background script
  private sendOffersToBackground(): void {
    chrome.runtime.sendMessage({
      type: 'OFFERS_EXTRACTED',
      offers: this.extractedOffers,
      merchant: this.currentMerchant,
      url: window.location.href,
      timestamp: Date.now()
    });
  }

  // Get current offers (public method)
  public getCurrentOffers(): ExtractedOffer[] {
    return this.extractedOffers;
  }

  // Cleanup method
  public destroy(): void {
    if (this.widget) {
      this.widget.remove();
    }
    
    if (this.currentSubscription) {
      this.currentSubscription();
    }
    
    if (this.scraperAgent) {
      this.scraperAgent.destroy();
    }
  }
}

// Initialize enhanced content script
const enhancedWisorContentScript = new EnhancedWisorContentScript();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    enhancedWisorContentScript.init();
  });
} else {
  enhancedWisorContentScript.init();
}

// Global access for debugging
(window as any).wisorEnhanced = enhancedWisorContentScript;