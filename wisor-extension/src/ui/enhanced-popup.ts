// enhanced-popup.ts - Enhanced popup with login flow and offers display
interface UserData {
  phone: string;
  cards: CreditCard[];
  isVerified: boolean;
}

interface CreditCard {
  id: string;
  name: string;
  bank: string;
  network: string;
  lastFour: string;
  expiryMonth: string;
  expiryYear: string;
  isActive: boolean;
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

class EnhancedWisorPopup {
  private userData: UserData | null = null;
  private currentOffers: ExtractedOffer[] = [];
  private currentTab: chrome.tabs.Tab | null = null;
  private isLoginFlowOpen: boolean = false;

  constructor() {
    this.init();
  }

  private async init(): Promise<void> {
    // Load user data from storage
    await this.loadUserData();
    
    // Get current tab info
    await this.getCurrentTab();
    
    // Load offers from background
    await this.loadCurrentOffers();
    
    // Render appropriate UI
    this.render();
    
    // Setup event listeners
    this.setupEventListeners();
  }

  private async loadUserData(): Promise<void> {
    try {
      const result = await chrome.storage.local.get(['wisorUserData']);
      this.userData = result.wisorUserData || null;
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  }

  private async getCurrentTab(): Promise<void> {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      this.currentTab = tabs[0] || null;
    } catch (error) {
      console.error('Failed to get current tab:', error);
    }
  }

  private async loadCurrentOffers(): Promise<void> {
    try {
      // Request offers from background script
      const response = await chrome.runtime.sendMessage({ type: 'GET_CURRENT_OFFERS' });
      this.currentOffers = response.offers || [];
    } catch (error) {
      console.error('Failed to load offers:', error);
    }
  }

  private render(): void {
    const container = document.getElementById('popup-container');
    if (!container) return;

    if (!this.userData) {
      this.renderWelcomeState(container);
    } else {
      this.renderLoggedInState(container);
    }
  }

  private renderWelcomeState(container: HTMLElement): void {
    container.innerHTML = `
      <div class="welcome-state">
        ${this.renderHeader()}
        
        <div class="welcome-content">
          <div class="welcome-hero">
            <div class="hero-icon">🚀</div>
            <h2>Welcome to Wisor</h2>
            <p class="hero-subtitle">Your AI-powered credit card optimization assistant</p>
          </div>
          
          <div class="value-props">
            <div class="value-prop">
              <span class="prop-icon">🤖</span>
              <div class="prop-text">
                <h4>Smart Recommendations</h4>
                <p>AI suggests the best card for every purchase</p>
              </div>
            </div>
            <div class="value-prop">
              <span class="prop-icon">🔥</span>
              <div class="prop-text">
                <h4>Live Offer Detection</h4>
                <p>Automatically finds deals on current page</p>
              </div>
            </div>
            <div class="value-prop">
              <span class="prop-icon">💰</span>
              <div class="prop-text">
                <h4>Maximize Savings</h4>
                <p>Save thousands with optimized spending</p>
              </div>
            </div>
          </div>
          
          ${this.currentOffers.length > 0 ? this.renderDetectedOffers() : ''}
        </div>
        
        <div class="welcome-actions">
          <button class="btn btn-primary btn-large" id="start-login-flow">
            <span class="btn-icon">🚀</span>
            Get Started - It's Free!
          </button>
          <p class="privacy-note">
            <span class="lock-icon">🔒</span>
            Your data stays secure and private
          </p>
        </div>
        
        ${this.renderFooter()}
      </div>
    `;
  }

  private renderLoggedInState(container: HTMLElement): void {
    const totalCards = this.userData?.cards.length || 0;
    const currentSite = this.getCurrentSiteName();
    
    container.innerHTML = `
      <div class="logged-in-state">
        ${this.renderHeader()}
        
        <div class="user-welcome">
          <div class="user-info">
            <span class="user-icon">👋</span>
            <div class="user-details">
              <h3>Welcome back!</h3>
              <p>${totalCards} card${totalCards !== 1 ? 's' : ''} • ${this.userData?.phone}</p>
            </div>
          </div>
          <button class="settings-btn" id="open-settings">⚙️</button>
        </div>
        
        <div class="current-site-info">
          <div class="site-header">
            <span class="site-icon">${this.getSiteIcon(currentSite)}</span>
            <div class="site-details">
              <h4>${currentSite}</h4>
              <p class="site-status">${this.getSiteStatus()}</p>
            </div>
          </div>
        </div>
        
        ${this.renderQuickStats()}
        ${this.renderCurrentRecommendation()}
        ${this.currentOffers.length > 0 ? this.renderLiveOffers() : ''}
        ${this.renderQuickActions()}
        ${this.renderUserCards()}
        ${this.renderFooter()}
      </div>
    `;
  }

  private renderHeader(): string {
    return `
      <div class="popup-header">
        <div class="logo">
          <span class="logo-icon">💳</span>
          <span class="logo-text">Wisor</span>
        </div>
        <div class="header-badge">Enhanced</div>
      </div>
    `;
  }

  private renderDetectedOffers(): string {
    if (this.currentOffers.length === 0) return '';
    
    const topOffers = this.currentOffers.slice(0, 2);
    
    return `
      <div class="detected-offers-preview">
        <h4>🔥 Live Offers Detected on This Page</h4>
        <div class="offers-preview-list">
          ${topOffers.map(offer => `
            <div class="offer-preview-item ${offer.priority}">
              <span class="offer-discount">${offer.discount}</span>
              <span class="offer-title">${offer.title}</span>
            </div>
          `).join('')}
        </div>
        <p class="offers-cta">Sign up to get personalized recommendations!</p>
      </div>
    `;
  }

  private renderQuickStats(): string {
    // Calculate dummy stats for demo
    const monthlySavings = Math.floor(Math.random() * 5000) + 1000;
    const optimizedTransactions = Math.floor(Math.random() * 50) + 10;
    
    return `
      <div class="quick-stats">
        <div class="stat-card">
          <div class="stat-value">₹${monthlySavings.toLocaleString()}</div>
          <div class="stat-label">Monthly Savings</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${optimizedTransactions}</div>
          <div class="stat-label">Optimized</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${this.currentOffers.length}</div>
          <div class="stat-label">Live Offers</div>
        </div>
      </div>
    `;
  }

  private renderCurrentRecommendation(): string {
    // Mock recommendation based on current site
    const siteName = this.getCurrentSiteName();
    const bestCard = this.userData?.cards[0];
    
    if (!bestCard) {
      return `
        <div class="recommendation-card">
          <h4>💡 Add More Cards</h4>
          <p>Add your credit cards to get AI-powered recommendations</p>
          <button class="btn btn-secondary btn-small" id="add-card-btn">Add Card</button>
        </div>
      `;
    }
    
    return `
      <div class="recommendation-card">
        <h4>💡 Best Card for ${siteName}</h4>
        <div class="recommended-card">
          <div class="card-info">
            <span class="card-icon">💳</span>
            <div class="card-details">
              <div class="card-name">${bestCard.name}</div>
              <div class="card-bank">${bestCard.bank}</div>
            </div>
          </div>
          <div class="reward-info">
            <span class="reward-value">₹${Math.floor(Math.random() * 200) + 50}</span>
            <span class="reward-label">est. savings</span>
          </div>
        </div>
        <button class="btn btn-primary btn-small" id="optimize-current">Optimize Purchase</button>
      </div>
    `;
  }

  private renderLiveOffers(): string {
    const topOffers = this.currentOffers.slice(0, 3);
    
    return `
      <div class="live-offers-section">
        <div class="section-header">
          <h4>🔥 Live Offers on This Page</h4>
          <button class="view-all-btn" id="view-all-offers">View All</button>
        </div>
        <div class="offers-list">
          ${topOffers.map(offer => `
            <div class="offer-item ${offer.priority}-priority">
              <div class="offer-main">
                <span class="offer-discount">${offer.discount}</span>
                <div class="offer-details">
                  <div class="offer-title">${offer.title}</div>
                  <div class="offer-description">${offer.description}</div>
                </div>
              </div>
              ${offer.validUntil ? `<div class="offer-validity">Until: ${offer.validUntil}</div>` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  private renderQuickActions(): string {
    return `
      <div class="quick-actions">
        <button class="action-btn" id="optimize-site">
          <span class="action-icon">⚡</span>
          <span class="action-text">Optimize This Site</span>
        </button>
        <button class="action-btn" id="scan-offers">
          <span class="action-icon">🔍</span>
          <span class="action-text">Scan for Offers</span>
        </button>
      </div>
    `;
  }

  private renderUserCards(): string {
    if (!this.userData?.cards.length) return '';
    
    return `
      <div class="user-cards-section">
        <div class="section-header">
          <h4>Your Cards</h4>
          <button class="add-card-btn" id="add-another-card">+</button>
        </div>
        <div class="cards-list">
          ${this.userData.cards.map(card => `
            <div class="card-item">
              <span class="card-icon">💳</span>
              <div class="card-info">
                <div class="card-name">${card.name}</div>
                <div class="card-details">${card.bank} •••• ${card.lastFour}</div>
              </div>
              <div class="card-status ${card.isActive ? 'active' : 'inactive'}"></div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  private renderFooter(): string {
    return `
      <div class="popup-footer">
        <div class="footer-links">
          <button class="footer-link" id="help-btn">Help</button>
          <button class="footer-link" id="feedback-btn">Feedback</button>
          ${this.userData ? '<button class="footer-link" id="logout-btn">Logout</button>' : ''}
        </div>
      </div>
    `;
  }

  private setupEventListeners(): void {
    // Login flow
    const startLoginBtn = document.getElementById('start-login-flow');
    startLoginBtn?.addEventListener('click', () => this.openLoginFlow());
    
    // Optimization actions
    const optimizeBtn = document.getElementById('optimize-site') || document.getElementById('optimize-current');
    optimizeBtn?.addEventListener('click', () => this.optimizeCurrentSite());
    
    // Offer scanning
    const scanOffersBtn = document.getElementById('scan-offers');
    scanOffersBtn?.addEventListener('click', () => this.scanForOffers());
    
    // View all offers
    const viewAllOffersBtn = document.getElementById('view-all-offers');
    viewAllOffersBtn?.addEventListener('click', () => this.viewAllOffers());
    
    // Add card
    const addCardBtns = document.querySelectorAll('#add-card-btn, #add-another-card');
    addCardBtns.forEach(btn => {
      btn.addEventListener('click', () => this.openAddCardFlow());
    });
    
    // Settings
    const settingsBtn = document.getElementById('open-settings');
    settingsBtn?.addEventListener('click', () => this.openSettings());
    
    // Logout
    const logoutBtn = document.getElementById('logout-btn');
    logoutBtn?.addEventListener('click', () => this.logout());
    
    // Help and feedback
    const helpBtn = document.getElementById('help-btn');
    helpBtn?.addEventListener('click', () => this.openHelp());
    
    const feedbackBtn = document.getElementById('feedback-btn');
    feedbackBtn?.addEventListener('click', () => this.openFeedback());
  }

  private openLoginFlow(): void {
    if (this.isLoginFlowOpen) return;
    
    this.isLoginFlowOpen = true;
    
    // Create login flow overlay
    const overlay = document.createElement('div');
    overlay.className = 'login-flow-overlay';
    overlay.innerHTML = `
      <div class="login-flow-container">
        <div id="login-flow-root"></div>
      </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Since we can't use React directly in the extension, we'll create a simplified version
    this.renderSimplifiedLoginFlow(overlay);
  }

  private renderSimplifiedLoginFlow(overlay: HTMLElement): void {
    const container = overlay.querySelector('#login-flow-root');
    if (!container) return;
    
    let currentStep = 'welcome';
    let phoneNumber = '';
    let otpCode = '';
    let userCards: CreditCard[] = [];
    
    const renderStep = () => {
      switch (currentStep) {
        case 'welcome':
          container.innerHTML = this.getWelcomeStepHTML();
          break;
        case 'phone':
          container.innerHTML = this.getPhoneStepHTML(phoneNumber);
          break;
        case 'otp':
          container.innerHTML = this.getOtpStepHTML(phoneNumber, otpCode);
          break;
        case 'addCard':
          container.innerHTML = this.getAddCardStepHTML(userCards);
          break;
        case 'success':
          container.innerHTML = this.getSuccessStepHTML(userCards);
          break;
      }
      
      // Setup step-specific event listeners
      this.setupStepEventListeners(currentStep, overlay, {
        setStep: (step: string) => {
          currentStep = step;
          renderStep();
        },
        setPhone: (phone: string) => {
          phoneNumber = phone;
        },
        setOtp: (otp: string) => {
          otpCode = otp;
        },
        addCard: (card: CreditCard) => {
          userCards.push(card);
          renderStep();
        },
        complete: (userData: UserData) => {
          this.userData = userData;
          chrome.storage.local.set({ wisorUserData: userData });
          overlay.remove();
          this.isLoginFlowOpen = false;
          this.render();
        }
      });
    };
    
    renderStep();
  }

  // Simplified login flow steps (HTML only)
  private getWelcomeStepHTML(): string {
    return `
      <div class="flow-step">
        <h2>Welcome to Wisor</h2>
        <p>Your AI-powered credit card optimization assistant</p>
        <button class="btn btn-primary" data-action="next">Get Started</button>
        <button class="btn btn-text" data-action="close">Maybe Later</button>
      </div>
    `;
  }

  private getPhoneStepHTML(phoneNumber: string): string {
    return `
      <div class="flow-step">
        <h2>Enter Your Phone Number</h2>
        <div class="demo-notice">Use 9999999999 for demo</div>
        <form class="phone-form">
          <input type="tel" id="phone-input" value="${phoneNumber}" placeholder="9999999999" maxlength="10">
          <button type="submit" class="btn btn-primary">Send OTP</button>
        </form>
        <button class="btn btn-text" data-action="back">Back</button>
      </div>
    `;
  }

  private getOtpStepHTML(phoneNumber: string, otpCode: string): string {
    return `
      <div class="flow-step">
        <h2>Enter Verification Code</h2>
        <p>Sent to +91 ${phoneNumber}</p>
        <form class="otp-form">
          <input type="text" id="otp-input" value="${otpCode}" placeholder="123456" maxlength="6">
          <button type="submit" class="btn btn-primary">Verify</button>
        </form>
        <button class="btn btn-text" data-action="back">Back</button>
      </div>
    `;
  }

  private getAddCardStepHTML(cards: CreditCard[]): string {
    return `
      <div class="flow-step">
        <h2>Add Your Credit Card</h2>
        <div class="quick-cards">
          <button class="quick-card-btn" data-card="hdfc-millennia">HDFC Millennia</button>
          <button class="quick-card-btn" data-card="sbi-simply">SBI SimplyCLICK</button>
          <button class="quick-card-btn" data-card="icici-amazon">ICICI Amazon Pay</button>
        </div>
        ${cards.length > 0 ? `
          <div class="added-cards">
            ${cards.map(card => `<div class="card-preview">${card.name}</div>`).join('')}
          </div>
          <button class="btn btn-primary" data-action="complete">Continue</button>
        ` : ''}
        <button class="btn btn-text" data-action="back">Back</button>
      </div>
    `;
  }

  private getSuccessStepHTML(cards: CreditCard[]): string {
    return `
      <div class="flow-step success">
        <div class="success-icon">✅</div>
        <h2>You're All Set!</h2>
        <p>${cards.length} card${cards.length !== 1 ? 's' : ''} added</p>
        <div class="download-section">
          <h3>🔗 Your Wisor Link is Ready!</h3>
          <button class="btn btn-primary download-btn" data-action="download">
            📱 Download Wisor Link
          </button>
        </div>
        <button class="btn btn-text" data-action="complete">Close</button>
      </div>
    `;
  }

  private setupStepEventListeners(step: string, overlay: HTMLElement, actions: any): void {
    const container = overlay.querySelector('#login-flow-root');
    if (!container) return;
    
    // Close button
    container.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      
      if (target.dataset.action === 'close') {
        overlay.remove();
        this.isLoginFlowOpen = false;
      } else if (target.dataset.action === 'next') {
        actions.setStep('phone');
      } else if (target.dataset.action === 'back') {
        const prevStep = this.getPreviousStep(step);
        actions.setStep(prevStep);
      } else if (target.dataset.action === 'complete') {
        const userData: UserData = {
          phone: actions.phone || '9999999999',
          cards: actions.cards || [],
          isVerified: true
        };
        actions.complete(userData);
      } else if (target.dataset.action === 'download') {
        this.downloadWisorLink();
      }
      
      // Quick card selection
      if (target.classList.contains('quick-card-btn')) {
        const cardType = target.dataset.card;
        const card = this.createQuickCard(cardType || '');
        actions.addCard(card);
      }
    });
    
    // Form submissions
    const phoneForm = container.querySelector('.phone-form');
    phoneForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      const phoneInput = container.querySelector('#phone-input') as HTMLInputElement;
      actions.setPhone(phoneInput.value);
      actions.setStep('otp');
    });
    
    const otpForm = container.querySelector('.otp-form');
    otpForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      const otpInput = container.querySelector('#otp-input') as HTMLInputElement;
      actions.setOtp(otpInput.value);
      if (otpInput.value === '123456') {
        actions.setStep('addCard');
      }
    });
  }

  private getPreviousStep(currentStep: string): string {
    const stepOrder = ['welcome', 'phone', 'otp', 'addCard', 'success'];
    const currentIndex = stepOrder.indexOf(currentStep);
    return stepOrder[Math.max(0, currentIndex - 1)];
  }

  private createQuickCard(cardType: string): CreditCard {
    const cardTemplates: Record<string, Partial<CreditCard>> = {
      'hdfc-millennia': { name: 'HDFC Millennia', bank: 'HDFC Bank' },
      'sbi-simply': { name: 'SBI SimplyCLICK', bank: 'State Bank of India' },
      'icici-amazon': { name: 'ICICI Amazon Pay', bank: 'ICICI Bank' }
    };
    
    const template = cardTemplates[cardType] || { name: 'Custom Card', bank: 'Bank' };
    
    return {
      id: Date.now().toString(),
      name: template.name || 'Custom Card',
      bank: template.bank || 'Bank',
      network: 'Visa',
      lastFour: Math.random().toString().slice(2, 6),
      expiryMonth: '12',
      expiryYear: '25',
      isActive: true
    };
  }

  private downloadWisorLink(): void {
    // Create a simple HTML file as the "Wisor Link"
    const wisorLinkContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Wisor - Your Credit Card Assistant</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
                   text-align: center; padding: 50px 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                   color: white; margin: 0; }
            .container { max-width: 400px; margin: 0 auto; }
            .logo { font-size: 3em; margin-bottom: 20px; }
            h1 { margin: 0 0 10px 0; }
            p { opacity: 0.9; margin-bottom: 30px; }
            .btn { background: rgba(255,255,255,0.2); border: 2px solid white; color: white; 
                   padding: 15px 30px; border-radius: 50px; text-decoration: none; 
                   display: inline-block; transition: all 0.3s; }
            .btn:hover { background: white; color: #667eea; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">💳</div>
            <h1>Wisor</h1>
            <p>Your AI-powered credit card optimization assistant</p>
            <a href="#" class="btn" onclick="alert('Wisor Extension Active!')">
              Launch Wisor
            </a>
          </div>
        </body>
      </html>
    `;
    
    // Create download
    const blob = new Blob([wisorLinkContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'wisor-link.html';
    a.click();
    URL.revokeObjectURL(url);
  }

  // Utility methods
  private getCurrentSiteName(): string {
    if (!this.currentTab?.url) return 'Unknown Site';
    
    try {
      const hostname = new URL(this.currentTab.url).hostname;
      const siteMappings: Record<string, string> = {
        'amazon.in': 'Amazon',
        'flipkart.com': 'Flipkart',
        'zomato.com': 'Zomato',
        'swiggy.com': 'Swiggy',
        'myntra.com': 'Myntra',
        'makemytrip.com': 'MakeMyTrip'
      };
      
      for (const [domain, name] of Object.entries(siteMappings)) {
        if (hostname.includes(domain)) return name;
      }
      
      return hostname.replace('www.', '').split('.')[0];
    } catch {
      return 'Current Site';
    }
  }

  private getSiteIcon(siteName: string): string {
    const iconMappings: Record<string, string> = {
      'Amazon': '🛒',
      'Flipkart': '🛍️',
      'Zomato': '🍕',
      'Swiggy': '🥘',
      'Myntra': '👕',
      'MakeMyTrip': '✈️'
    };
    
    return iconMappings[siteName] || '🌐';
  }

  private getSiteStatus(): string {
    if (this.currentOffers.length > 0) {
      return `${this.currentOffers.length} offers detected`;
    }
    return 'Monitoring for offers';
  }

  // Action methods
  private async optimizeCurrentSite(): Promise<void> {
    await chrome.tabs.sendMessage(this.currentTab?.id || 0, {
      type: 'OPTIMIZE_CURRENT_SITE'
    });
    window.close();
  }

  private async scanForOffers(): Promise<void> {
    await chrome.tabs.sendMessage(this.currentTab?.id || 0, {
      type: 'SCAN_FOR_OFFERS'
    });
    // Refresh offers after scan
    setTimeout(() => {
      this.loadCurrentOffers().then(() => this.render());
    }, 2000);
  }

  private viewAllOffers(): void {
    // Open offers view in a new popup or expand current view
    console.log('Viewing all offers:', this.currentOffers);
  }

  private openAddCardFlow(): void {
    // Open simplified add card flow
    console.log('Opening add card flow');
  }

  private openSettings(): void {
    chrome.runtime.openOptionsPage();
  }

  private logout(): void {
    chrome.storage.local.remove(['wisorUserData']);
    this.userData = null;
    this.render();
  }

  private openHelp(): void {
    chrome.tabs.create({ url: 'https://wisor.netlify.app/#help' });
  }

  private openFeedback(): void {
    chrome.tabs.create({ url: 'https://wisor.netlify.app/#feedback' });
  }
}

// Initialize enhanced popup
document.addEventListener('DOMContentLoaded', () => {
  new EnhancedWisorPopup();
});