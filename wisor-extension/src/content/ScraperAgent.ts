// ScraperAgent.ts - Intelligent web scraper for extracting offers and deals
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

interface ScrapeConfig {
  selectors: {
    offers: string[];
    discount: string[];
    description: string[];
    validity: string[];
    minAmount: string[];
  };
  keywords: string[];
  excludeKeywords: string[];
}

class ScraperAgent {
  private config: Map<string, ScrapeConfig> = new Map();
  private mutationObserver: MutationObserver | null = null;
  private lastScrapeTime: number = 0;
  private debounceDelay: number = 2000; // 2 seconds
  private extractedOffers: ExtractedOffer[] = [];

  constructor() {
    this.initializeSiteConfigs();
    this.setupMutationObserver();
  }

  // Initialize scraping configurations for supported sites
  private initializeSiteConfigs(): void {
    // Amazon configuration
    this.config.set('amazon.in', {
      selectors: {
        offers: [
          '[data-testid="coupon-offer"]',
          '.promoPriceBlockMessage',
          '.a-color-price.savingsPercentage',
          '.dealPriceText',
          '.s-price-range-display',
          '.a-badge-text'
        ],
        discount: ['.savingsPercentage', '.a-color-price', '.dealPriceText'],
        description: ['.promoPriceBlockMessage span', '.couponText', '.dealBadgeText'],
        validity: ['.couponExpiry', '.dealExpiry', '[data-testid="validity"]'],
        minAmount: ['.minimumOrderValue', '.minSpend']
      },
      keywords: ['off', 'discount', 'save', 'deal', 'offer', 'cashback', 'coupon'],
      excludeKeywords: ['shipping', 'delivery', 'warranty']
    });

    // Flipkart configuration
    this.config.set('flipkart.com', {
      selectors: {
        offers: [
          '._3Ay6Sb._31Dcoz',
          '._1_WHN1',
          '._3xFhiH',
          '.bankOfferSection',
          '._2ZdXDB'
        ],
        discount: ['._31Dcoz', '._3Ay6Sb span'],
        description: ['._31Dcoz ._1_WHN1', '.bankOfferSection span'],
        validity: ['.validity', '.expiry'],
        minAmount: ['.minOrderValue']
      },
      keywords: ['off', 'discount', 'bank offer', 'cashback', 'instant'],
      excludeKeywords: ['shipping', 'replacement', 'warranty']
    });

    // Zomato configuration
    this.config.set('zomato.com', {
      selectors: {
        offers: [
          '[data-testid="offer-card"]',
          '.sc-1s0saks-5',
          '.offer-item',
          '.coupon-card',
          '.promo-banner'
        ],
        discount: ['.discount-percent', '.offer-value', '.coupon-value'],
        description: ['.offer-description', '.coupon-description'],
        validity: ['.validity-text', '.expires-on'],
        minAmount: ['.min-order', '.minimum-amount']
      },
      keywords: ['off', 'discount', 'free delivery', 'cashback', 'promo'],
      excludeKeywords: ['terms', 'conditions']
    });

    // Swiggy configuration
    this.config.set('swiggy.com', {
      selectors: {
        offers: [
          '[data-testid="offer-widget"]',
          '.RestaurantOffer__OfferContent',
          '.offer-meta',
          '.promo-tag'
        ],
        discount: ['.discount-text', '.offer-percent'],
        description: ['.offer-description', '.promo-text'],
        validity: ['.validity', '.expires'],
        minAmount: ['.min-order-value']
      },
      keywords: ['off', 'discount', 'free', 'cashback', 'combo'],
      excludeKeywords: ['delivery fee', 'packaging']
    });
  }

  // Setup MutationObserver to detect dynamic content changes
  private setupMutationObserver(): void {
    this.mutationObserver = new MutationObserver((mutations) => {
      let shouldScrape = false;
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // Check if added nodes contain offer-related content
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              if (this.containsOfferContent(element)) {
                shouldScrape = true;
              }
            }
          });
        }
      });

      if (shouldScrape) {
        this.debouncedScrape();
      }
    });

    // Start observing the document
    this.mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false
    });
  }

  // Check if element contains offer-related content
  private containsOfferContent(element: Element): boolean {
    const text = element.textContent?.toLowerCase() || '';
    const keywords = ['offer', 'discount', 'deal', 'promo', 'cashback', 'save'];
    return keywords.some(keyword => text.includes(keyword));
  }

  // Debounced scraping to avoid excessive calls
  private debouncedScrape(): void {
    const now = Date.now();
    if (now - this.lastScrapeTime < this.debounceDelay) return;
    
    setTimeout(() => {
      this.scrapeCurrentPage();
    }, this.debounceDelay);
  }

  // Main scraping function
  public async scrapeCurrentPage(): Promise<ExtractedOffer[]> {
    this.lastScrapeTime = Date.now();
    
    const hostname = window.location.hostname;
    const domain = this.extractDomain(hostname);
    const config = this.config.get(domain);
    
    if (!config) {
      console.log(`Wisor Scraper: No configuration for ${domain}`);
      return [];
    }

    console.log(`Wisor Scraper: Starting scrape for ${domain}`);
    
    const offers: ExtractedOffer[] = [];
    
    // Extract offers using configured selectors
    config.selectors.offers.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        const offer = this.extractOfferFromElement(element, config);
        if (offer && this.isValidOffer(offer)) {
          offers.push(offer);
        }
      });
    });

    // Remove duplicates and sort by priority
    const uniqueOffers = this.deduplicateOffers(offers);
    const sortedOffers = this.sortOffersByPriority(uniqueOffers);
    
    this.extractedOffers = sortedOffers;
    
    // Send offers to extension UI
    this.sendOffersToUI(sortedOffers);
    
    console.log(`Wisor Scraper: Found ${sortedOffers.length} offers`);
    return sortedOffers;
  }

  // Extract offer details from DOM element
  private extractOfferFromElement(element: Element, config: ScrapeConfig): ExtractedOffer | null {
    try {
      const text = element.textContent || '';
      
      // Extract discount percentage/amount
      const discount = this.extractDiscount(element, config);
      if (!discount) return null;
      
      // Extract description
      const description = this.extractDescription(element, text);
      
      // Extract validity
      const validUntil = this.extractValidity(element, config);
      
      // Extract minimum amount
      const minAmount = this.extractMinAmount(element, config);
      
      // Determine priority based on discount value
      const priority = this.calculatePriority(discount, minAmount);
      
      return {
        title: this.generateOfferTitle(discount, description),
        discount,
        description: description.substring(0, 100), // Limit description length
        validUntil,
        minAmount,
        url: window.location.href,
        priority
      };
    } catch (error) {
      console.error('Wisor Scraper: Error extracting offer:', error);
      return null;
    }
  }

  // Extract discount from element
  private extractDiscount(element: Element, config: ScrapeConfig): string | null {
    for (const selector of config.selectors.discount) {
      const discountEl = element.querySelector(selector) || element;
      const text = discountEl.textContent || '';
      
      // Look for percentage discounts
      const percentMatch = text.match(/(\d+)%\s*(off|discount)/i);
      if (percentMatch) return `${percentMatch[1]}% off`;
      
      // Look for rupee amounts
      const rupeeMatch = text.match(/₹\s*(\d+(?:,\d+)*)\s*(off|discount|save)/i);
      if (rupeeMatch) return `₹${rupeeMatch[1]} off`;
      
      // Look for "up to" discounts
      const upToMatch = text.match(/up\s*to\s*(\d+)%/i);
      if (upToMatch) return `Up to ${upToMatch[1]}% off`;
    }
    
    return null;
  }

  // Extract description from element
  private extractDescription(element: Element, text: string): string {
    // Clean and extract meaningful description
    const cleaned = text.replace(/\s+/g, ' ').trim();
    
    // Remove common noise words
    const noiseWords = ['click', 'here', 'apply', 'code', 'terms', 'conditions'];
    let description = cleaned;
    
    noiseWords.forEach(word => {
      description = description.replace(new RegExp(word, 'gi'), '');
    });
    
    return description.trim() || 'Special offer available';
  }

  // Extract validity period
  private extractValidity(element: Element, config: ScrapeConfig): string | undefined {
    for (const selector of config.selectors.validity) {
      const validityEl = element.querySelector(selector);
      if (validityEl?.textContent) {
        return validityEl.textContent.trim();
      }
    }
    return undefined;
  }

  // Extract minimum amount
  private extractMinAmount(element: Element, config: ScrapeConfig): number | undefined {
    for (const selector of config.selectors.minAmount) {
      const minAmountEl = element.querySelector(selector);
      if (minAmountEl?.textContent) {
        const match = minAmountEl.textContent.match(/₹\s*(\d+(?:,\d+)*)/);
        if (match) {
          return parseInt(match[1].replace(/,/g, ''));
        }
      }
    }
    return undefined;
  }

  // Calculate offer priority
  private calculatePriority(discount: string, minAmount?: number): 'high' | 'medium' | 'low' {
    const percentMatch = discount.match(/(\d+)%/);
    if (percentMatch) {
      const percent = parseInt(percentMatch[1]);
      if (percent >= 30) return 'high';
      if (percent >= 15) return 'medium';
    }
    
    const rupeeMatch = discount.match(/₹\s*(\d+(?:,\d+)*)/);
    if (rupeeMatch) {
      const amount = parseInt(rupeeMatch[1].replace(/,/g, ''));
      if (amount >= 500) return 'high';
      if (amount >= 100) return 'medium';
    }
    
    return 'low';
  }

  // Generate offer title
  private generateOfferTitle(discount: string, description: string): string {
    const site = this.extractDomain(window.location.hostname);
    return `${discount} on ${site.charAt(0).toUpperCase() + site.slice(1)}`;
  }

  // Extract domain from hostname
  private extractDomain(hostname: string): string {
    const parts = hostname.split('.');
    return parts.length > 1 ? parts[parts.length - 2] : hostname;
  }

  // Validate if offer is meaningful
  private isValidOffer(offer: ExtractedOffer): boolean {
    // Check if discount contains actual numbers
    const hasNumber = /\d/.test(offer.discount);
    
    // Check if description is meaningful
    const hasDescription = offer.description.length > 3;
    
    return hasNumber && hasDescription;
  }

  // Remove duplicate offers
  private deduplicateOffers(offers: ExtractedOffer[]): ExtractedOffer[] {
    const seen = new Set<string>();
    return offers.filter(offer => {
      const key = `${offer.discount}-${offer.description.substring(0, 50)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  // Sort offers by priority and discount value
  private sortOffersByPriority(offers: ExtractedOffer[]): ExtractedOffer[] {
    return offers.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  // Send offers to extension UI
  private sendOffersToUI(offers: ExtractedOffer[]): void {
    // Send message to content script which will relay to popup
    window.postMessage({
      type: 'WISOR_OFFERS_EXTRACTED',
      offers: offers,
      timestamp: Date.now()
    }, '*');
  }

  // Public method to get current offers
  public getCurrentOffers(): ExtractedOffer[] {
    return this.extractedOffers;
  }

  // Cleanup method
  public destroy(): void {
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
      this.mutationObserver = null;
    }
  }
}

// Export for use in content script
(window as any).ScraperAgent = ScraperAgent;