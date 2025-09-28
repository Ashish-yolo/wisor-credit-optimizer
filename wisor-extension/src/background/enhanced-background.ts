// enhanced-background.ts - Enhanced background script for Wisor extension
interface ExtractedOffer {
  title: string;
  discount: string;
  description: string;
  validUntil?: string;
  minAmount?: number;
  cardRequired?: string;
  url: string;
  priority: 'high' | 'medium' | 'low';
  timestamp: number;
}

interface OfferStore {
  [tabId: number]: {
    offers: ExtractedOffer[];
    merchant: any;
    url: string;
    lastUpdate: number;
  };
}

class EnhancedWisorBackground {
  private offerStore: OfferStore = {};
  private userPreferences: any = {};

  constructor() {
    this.init();
  }

  private init(): void {
    this.setupMessageListeners();
    this.setupTabListeners();
    this.setupStorageListeners();
    this.loadUserPreferences();
  }

  private setupMessageListeners(): void {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      switch (message.type) {
        case 'OFFERS_EXTRACTED':
          this.handleOffersExtracted(message, sender);
          break;
        
        case 'GET_CURRENT_OFFERS':
          this.handleGetCurrentOffers(message, sender, sendResponse);
          return true; // Keep channel open for async response
        
        case 'OPEN_OPTIMIZATION_FLOW':
          this.handleOpenOptimizationFlow(message, sender);
          break;
        
        case 'OPEN_OFFERS_VIEW':
          this.handleOpenOffersView(message, sender);
          break;
        
        case 'USER_LOGIN_COMPLETE':
          this.handleUserLoginComplete(message);
          break;
        
        case 'STORE_USER_CARD':
          this.handleStoreUserCard(message);
          break;
        
        default:
          console.log('Wisor Background: Unknown message type:', message.type);
      }
    });
  }

  private setupTabListeners(): void {
    // Clean up offer store when tabs are closed
    chrome.tabs.onRemoved.addListener((tabId) => {
      delete this.offerStore[tabId];
    });

    // Clean up offer store when tabs navigate away
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.url) {
        delete this.offerStore[tabId];
      }
    });
  }

  private setupStorageListeners(): void {
    // Listen for storage changes to sync user preferences
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'local' && changes.wisorUserData) {
        this.loadUserPreferences();
      }
    });
  }

  private async loadUserPreferences(): Promise<void> {
    try {
      const result = await chrome.storage.local.get(['wisorUserData', 'wisorPreferences']);
      this.userPreferences = {
        userData: result.wisorUserData,
        preferences: result.wisorPreferences || {}
      };
    } catch (error) {
      console.error('Wisor Background: Failed to load user preferences:', error);
    }
  }

  private handleOffersExtracted(message: any, sender: chrome.runtime.MessageSender): void {
    const tabId = sender.tab?.id;
    if (!tabId) return;

    console.log('Wisor Background: Offers extracted for tab', tabId, message.offers);

    // Store offers for this tab
    this.offerStore[tabId] = {
      offers: message.offers.map((offer: ExtractedOffer) => ({
        ...offer,
        timestamp: Date.now()
      })),
      merchant: message.merchant,
      url: message.url,
      lastUpdate: Date.now()
    };

    // Notify popup if it's open
    this.notifyPopupOffers(tabId);

    // Process offers for recommendations
    this.processOffersForRecommendations(tabId, message.offers);

    // Store high-priority offers for later retrieval
    this.storeHighPriorityOffers(message.offers);
  }

  private async handleGetCurrentOffers(
    message: any, 
    sender: chrome.runtime.MessageSender, 
    sendResponse: (response: any) => void
  ): Promise<void> {
    try {
      // Get current active tab
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const activeTab = tabs[0];
      
      if (!activeTab?.id) {
        sendResponse({ offers: [] });
        return;
      }

      const tabOffers = this.offerStore[activeTab.id];
      if (!tabOffers) {
        sendResponse({ offers: [] });
        return;
      }

      // Filter out stale offers (older than 10 minutes)
      const tenMinutesAgo = Date.now() - (10 * 60 * 1000);
      const freshOffers = tabOffers.offers.filter(offer => 
        offer.timestamp > tenMinutesAgo
      );

      sendResponse({
        offers: freshOffers,
        merchant: tabOffers.merchant,
        url: tabOffers.url
      });
    } catch (error) {
      console.error('Wisor Background: Error getting current offers:', error);
      sendResponse({ offers: [] });
    }
  }

  private handleOpenOptimizationFlow(message: any, sender: chrome.runtime.MessageSender): void {
    // Open popup with optimization focus
    chrome.action.openPopup();
    
    // Store optimization context for popup
    chrome.storage.session.set({
      optimizationContext: {
        merchant: message.merchant,
        offers: message.offers,
        timestamp: Date.now()
      }
    });
  }

  private handleOpenOffersView(message: any, sender: chrome.runtime.MessageSender): void {
    // Create a new tab with offers view or open popup
    chrome.action.openPopup();
    
    // Store offers view context
    chrome.storage.session.set({
      offersViewContext: {
        offers: message.offers,
        url: message.url,
        timestamp: Date.now()
      }
    });
  }

  private handleUserLoginComplete(message: any): void {
    console.log('Wisor Background: User login complete', message.userData);
    
    // Store user data securely
    chrome.storage.local.set({
      wisorUserData: message.userData,
      wisorLoginTimestamp: Date.now()
    });

    // Initialize user-specific features
    this.initializeUserFeatures(message.userData);
  }

  private handleStoreUserCard(message: any): void {
    console.log('Wisor Background: Storing user card', message.card);
    
    // Add card to user data
    chrome.storage.local.get(['wisorUserData'], (result) => {
      if (result.wisorUserData) {
        const userData = result.wisorUserData;
        userData.cards = userData.cards || [];
        userData.cards.push(message.card);
        
        chrome.storage.local.set({ wisorUserData: userData });
      }
    });
  }

  private notifyPopupOffers(tabId: number): void {
    // Send message to popup if it's listening
    chrome.runtime.sendMessage({
      type: 'OFFERS_UPDATED',
      tabId: tabId,
      offers: this.offerStore[tabId]?.offers || []
    }).catch(() => {
      // Popup not open or not listening, which is fine
    });
  }

  private processOffersForRecommendations(tabId: number, offers: ExtractedOffer[]): void {
    // Enhanced offer processing for AI recommendations
    const highValueOffers = offers.filter(offer => 
      offer.priority === 'high' || 
      this.extractNumericValue(offer.discount) >= 100
    );

    if (highValueOffers.length > 0) {
      // Store high-value offers for recommendation engine
      chrome.storage.session.set({
        [`highValueOffers_${tabId}`]: {
          offers: highValueOffers,
          timestamp: Date.now()
        }
      });
    }
  }

  private async storeHighPriorityOffers(offers: ExtractedOffer[]): Promise<void> {
    try {
      const highPriorityOffers = offers.filter(offer => offer.priority === 'high');
      
      if (highPriorityOffers.length > 0) {
        // Get existing stored offers
        const result = await chrome.storage.local.get(['storedHighPriorityOffers']);
        const existingOffers = result.storedHighPriorityOffers || [];
        
        // Add new offers and remove duplicates
        const allOffers = [...existingOffers, ...highPriorityOffers];
        const uniqueOffers = this.deduplicateOffers(allOffers);
        
        // Keep only last 50 offers and recent ones (last 24 hours)
        const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
        const recentOffers = uniqueOffers
          .filter(offer => offer.timestamp > oneDayAgo)
          .slice(-50);
        
        await chrome.storage.local.set({ storedHighPriorityOffers: recentOffers });
      }
    } catch (error) {
      console.error('Wisor Background: Error storing high-priority offers:', error);
    }
  }

  private deduplicateOffers(offers: ExtractedOffer[]): ExtractedOffer[] {
    const seen = new Set<string>();
    return offers.filter(offer => {
      const key = `${offer.discount}-${offer.title}-${offer.url}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private extractNumericValue(discount: string): number {
    // Extract numeric value from discount string
    const rupeeMatch = discount.match(/₹\s*(\d+(?:,\d+)*)/);
    if (rupeeMatch) {
      return parseInt(rupeeMatch[1].replace(/,/g, ''));
    }
    
    const percentMatch = discount.match(/(\d+)%/);
    if (percentMatch) {
      // Assume percentage on average cart value of 2000
      return (parseInt(percentMatch[1]) * 2000) / 100;
    }
    
    return 0;
  }

  private initializeUserFeatures(userData: any): void {
    // Set up user-specific features
    console.log('Wisor Background: Initializing features for user:', userData.phone);
    
    // Enable advanced offer tracking
    this.enableAdvancedOfferTracking();
    
    // Set up personalized notifications
    this.setupPersonalizedNotifications(userData);
    
    // Initialize recommendation sync
    this.initializeRecommendationSync(userData);
  }

  private enableAdvancedOfferTracking(): void {
    // Enhanced offer tracking for logged-in users
    console.log('Wisor Background: Advanced offer tracking enabled');
  }

  private setupPersonalizedNotifications(userData: any): void {
    // Set up notifications based on user cards and preferences
    console.log('Wisor Background: Setting up notifications for', userData.cards?.length || 0, 'cards');
  }

  private initializeRecommendationSync(userData: any): void {
    // Sync user data with recommendation engine
    console.log('Wisor Background: Initializing recommendation sync');
  }

  // Public methods for extension popup/content scripts
  public async getCurrentTabOffers(): Promise<ExtractedOffer[]> {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const activeTab = tabs[0];
      
      if (!activeTab?.id) return [];
      
      const tabOffers = this.offerStore[activeTab.id];
      return tabOffers?.offers || [];
    } catch (error) {
      console.error('Wisor Background: Error getting current tab offers:', error);
      return [];
    }
  }

  public async getAllStoredOffers(): Promise<ExtractedOffer[]> {
    try {
      const result = await chrome.storage.local.get(['storedHighPriorityOffers']);
      return result.storedHighPriorityOffers || [];
    } catch (error) {
      console.error('Wisor Background: Error getting stored offers:', error);
      return [];
    }
  }

  public async getUserData(): Promise<any> {
    try {
      const result = await chrome.storage.local.get(['wisorUserData']);
      return result.wisorUserData || null;
    } catch (error) {
      console.error('Wisor Background: Error getting user data:', error);
      return null;
    }
  }
}

// Initialize enhanced background service
const enhancedWisorBackground = new EnhancedWisorBackground();

// Export for debugging
(globalThis as any).wisorBackground = enhancedWisorBackground;