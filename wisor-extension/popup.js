document.addEventListener('DOMContentLoaded', function() {
  const currentSiteElement = document.getElementById('current-site');
  const detectionStatusElement = document.getElementById('detection-status');
  const monthlySavingsElement = document.getElementById('monthly-savings');
  const cardsCountElement = document.getElementById('cards-count');
  const cardsListElement = document.getElementById('cards-list');
  const addCardBtn = document.getElementById('add-card-btn');
  const optimizeBtn = document.getElementById('optimize-btn');
  const settingsBtn = document.getElementById('settings-btn');

  // Initialize popup
  initializePopup();

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

    // Load user data
    loadUserData();
    
    // Populate cards list
    populateCardsList();
  }

  function loadUserData() {
    // Simulate loading user data (in real app, this would come from chrome.storage)
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
});