document.addEventListener('DOMContentLoaded', function() {
  const currentSiteElement = document.getElementById('current-site');
  const detectionStatusElement = document.getElementById('detection-status');
  const monthlySavingsElement = document.getElementById('monthly-savings');
  const cardsCountElement = document.getElementById('cards-count');
  const cardsListElement = document.getElementById('cards-list');
  const addCardBtn = document.getElementById('add-card-btn');
  const optimizeBtn = document.getElementById('optimize-btn');
  const settingsBtn = document.getElementById('settings-btn');

  // Login flow variables
  let currentPhone = '';
  let userCards = [];
  let isLoggedIn = false;

  // Initialize popup
  initializePopup();
  setupLoginFlow();

  function initializePopup() {
    // Get current tab info
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      const currentTab = tabs[0];
      const hostname = new URL(currentTab.url).hostname.replace(/^www\./, '');
      
      // Update current site display
      const merchant = MERCHANT_CATEGORIES[hostname];
      if (merchant) {
        currentSiteElement.textContent = merchant.name;
        detectionStatusElement.innerHTML = `
          <span class="status-dot" style="background: #10b981;"></span>
          <span>Merchant detected</span>
        `;
      } else {
        currentSiteElement.textContent = hostname;
        detectionStatusElement.innerHTML = `
          <span class="status-dot" style="background: #6b7280;"></span>
          <span>No merchant data</span>
        `;
      }
    });

    // Load user data from storage
    loadUserData();
    
    // Load cards from storage and populate
    loadUserCards(() => {
      populateCardsList();
    });
  }

  function loadUserCards(callback) {
    // Try to load from chrome storage first
    if (chrome && chrome.storage) {
      chrome.storage.sync.get(['userCards'], (result) => {
        if (result.userCards && result.userCards.length > 0) {
          // Update global USER_CARDS with stored cards
          USER_CARDS.length = 0;
          result.userCards.forEach(cardId => USER_CARDS.push(cardId));
        }
        callback();
      });
    } else {
      callback();
    }
  }

  function loadUserData() {
    // Load user stats
    setTimeout(() => {
      monthlySavingsElement.textContent = '₹2,847';
      cardsCountElement.textContent = USER_CARDS.length.toString();
    }, 500);
  }

  function populateCardsList() {
    cardsListElement.innerHTML = '';
    
    USER_CARDS.forEach(cardId => {
      const card = INDIAN_CREDIT_CARDS[cardId];
      if (!card) return;
      
      const cardElement = document.createElement('div');
      cardElement.className = 'card-item';
      
      cardElement.innerHTML = `
        <div class="card-info">
          <div class="card-icon" style="background: ${card.color};">
            ${card.bank.charAt(0)}
          </div>
          <div class="card-details">
            <div class="card-name">${card.name}</div>
            <div class="card-bank">${card.bank}</div>
          </div>
        </div>
        <div class="card-status">Active</div>
      `;
      
      cardsListElement.appendChild(cardElement);
    });

    if (USER_CARDS.length === 0) {
      cardsListElement.innerHTML = `
        <div style="text-align: center; padding: 20px; opacity: 0.7;">
          <div style="font-size: 32px; margin-bottom: 8px;">💳</div>
          <div style="font-size: 14px;">No cards added yet</div>
          <div style="font-size: 12px; margin-top: 4px;">Click + to add your first card</div>
        </div>
      `;
    }
  }

  // Event listeners
  addCardBtn.addEventListener('click', function() {
    showAddCardModal();
  });

  optimizeBtn.addEventListener('click', function() {
    // Send message to content script to show recommendation
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'showRecommendation' });
      window.close();
    });
  });

  settingsBtn.addEventListener('click', function() {
    chrome.tabs.create({ url: 'chrome-extension://' + chrome.runtime.id + '/settings.html' });
  });

  function showAddCardModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>Add Credit Card</h3>
          <button class="modal-close">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Select Your Card:</label>
            <select class="card-select">
              <option value="">Choose a card...</option>
              ${Object.values(INDIAN_CREDIT_CARDS)
                .filter(card => !USER_CARDS.includes(card.id))
                .map(card => `<option value="${card.id}">${card.name} - ${card.bank}</option>`)
                .join('')}
            </select>
          </div>
          <div class="modal-actions">
            <button class="btn-cancel">Cancel</button>
            <button class="btn-add">Add Card</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Modal event listeners
    modal.querySelector('.modal-close').addEventListener('click', () => {
      document.body.removeChild(modal);
    });

    modal.querySelector('.btn-cancel').addEventListener('click', () => {
      document.body.removeChild(modal);
    });

    modal.querySelector('.btn-add').addEventListener('click', () => {
      const selectedCard = modal.querySelector('.card-select').value;
      if (selectedCard) {
        USER_CARDS.push(selectedCard);
        populateCardsList();
        cardsCountElement.textContent = USER_CARDS.length.toString();
        document.body.removeChild(modal);
        
        // Save to storage (in real app)
        // chrome.storage.sync.set({ userCards: USER_CARDS });
      }
    });
  }

  // Login Flow Functions
  function setupLoginFlow() {
    // Check if user is already logged in
    chrome.storage.local.get(['wisorUserData'], (result) => {
      if (result.wisorUserData) {
        isLoggedIn = true;
        userCards = result.wisorUserData.cards || [];
        console.log('User already logged in');
      } else {
        // Show login overlay for new users
        setTimeout(() => {
          showLoginOverlay();
        }, 1000);
      }
    });

    // Setup form handlers
    document.getElementById('phone-form').addEventListener('submit', handlePhoneSubmit);
    document.getElementById('otp-form').addEventListener('submit', handleOtpSubmit);
    
    // Setup OTP input handlers
    setupOtpInputs();
  }

  function showLoginOverlay() {
    document.getElementById('login-overlay').classList.remove('hidden');
  }

  function handlePhoneSubmit(e) {
    e.preventDefault();
    const phoneInput = document.getElementById('phone-input');
    const phone = phoneInput.value;
    
    if (phone.length !== 10) {
      alert('Please enter a valid 10-digit phone number');
      return;
    }

    currentPhone = phone;
    document.getElementById('phone-display').textContent = `+91 ${phone}`;
    
    // For demo numbers, auto-fill OTP
    if (phone === '9999999999' || phone === '1234567890') {
      setTimeout(() => {
        const otpInputs = document.querySelectorAll('.otp-digit');
        const demoOtp = ['1', '2', '3', '4', '5', '6'];
        otpInputs.forEach((input, index) => {
          input.value = demoOtp[index];
        });
      }, 1500);
    }
    
    goToStep('otp');
  }

  function handleOtpSubmit(e) {
    e.preventDefault();
    const otpInputs = document.querySelectorAll('.otp-digit');
    const otp = Array.from(otpInputs).map(input => input.value).join('');
    
    if (otp.length !== 6) {
      alert('Please enter complete 6-digit OTP');
      return;
    }

    if (otp === '123456' || otp === '000000') {
      goToStep('card');
    } else {
      alert('Invalid OTP. For demo, use 123456');
      // Clear OTP inputs
      otpInputs.forEach(input => input.value = '');
      otpInputs[0].focus();
    }
  }

  function setupOtpInputs() {
    const otpInputs = document.querySelectorAll('.otp-digit');
    otpInputs.forEach((input, index) => {
      input.addEventListener('input', (e) => {
        if (e.target.value.length === 1 && index < otpInputs.length - 1) {
          otpInputs[index + 1].focus();
        }
      });
      
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && e.target.value === '' && index > 0) {
          otpInputs[index - 1].focus();
        }
      });
    });
  }

  // Global functions for HTML onclick handlers
  window.goToStep = function(step) {
    document.querySelectorAll('.login-step').forEach(s => s.classList.add('hidden'));
    document.getElementById(step + '-step').classList.remove('hidden');
  };

  window.closeLogin = function() {
    document.getElementById('login-overlay').classList.add('hidden');
  };

  window.addQuickCard = function(cardName, cardBank) {
    const card = {
      id: Date.now().toString(),
      name: cardName,
      bank: cardBank,
      lastFour: Math.random().toString().slice(2, 6),
      isActive: true
    };
    
    userCards.push(card);
    updateAddedCardsDisplay();
    
    // Show continue button if cards added
    if (userCards.length > 0) {
      document.getElementById('continue-btn').classList.remove('hidden');
    }
  };

  function updateAddedCardsDisplay() {
    const addedCardsContainer = document.getElementById('added-cards');
    addedCardsContainer.innerHTML = userCards.map(card => `
      <div class="added-card">
        <span class="card-icon">💳</span>
        <div>
          <div class="card-name">${card.name}</div>
          <div class="card-details">${card.bank} •••• ${card.lastFour}</div>
        </div>
      </div>
    `).join('');
    
    document.getElementById('cards-added').textContent = userCards.length;
  }

  window.downloadWisorLink = function() {
    const wisorLinkContent = `<!DOCTYPE html>
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
               display: inline-block; transition: all 0.3s; cursor: pointer; }
        .btn:hover { background: white; color: #667eea; }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">💳</div>
        <h1>Wisor Enhanced</h1>
        <p>Your AI-powered credit card optimization assistant</p>
        <button class="btn" onclick="alert('Wisor Extension Active! Keep this link handy.')">
            🚀 Launch Wisor
        </button>
        <p style="margin-top: 30px; font-size: 0.9em; opacity: 0.7;">
            Cards: ${userCards.length} • Phone: +91 ${currentPhone}
        </p>
    </div>
</body>
</html>`;
    
    // Create download
    const blob = new Blob([wisorLinkContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'wisor-enhanced-link.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  window.completeLogin = function() {
    // Save user data
    const userData = {
      phone: currentPhone,
      cards: userCards,
      isVerified: true,
      loginTimestamp: Date.now()
    };
    
    chrome.storage.local.set({ wisorUserData: userData }, () => {
      isLoggedIn = true;
      closeLogin();
      
      // Refresh popup to show logged-in state
      location.reload();
    });
  };
});