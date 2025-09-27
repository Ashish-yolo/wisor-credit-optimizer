import { getCardRecommendations } from "~lib/cardSync"

// Create and inject Wisor recommendation widget
async function createRecommendationWidget() {
  try {
    const currentDomain = window.location.hostname
    const recommendations = await getCardRecommendations(currentDomain)

    if (!recommendations.recommendedCard) {
      console.log("No card recommendations available")
      return
    }

    // Remove existing widget if present
    const existingWidget = document.getElementById('wisor-widget')
    if (existingWidget) {
      existingWidget.remove()
    }

    // Create widget container
    const widget = document.createElement('div')
    widget.id = 'wisor-widget'
    widget.innerHTML = `
      <div id="wisor-recommendation" style="
        position: fixed;
        top: 20px;
        right: 20px;
        width: 320px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 16px;
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        transition: all 0.3s ease;
        border: 1px solid rgba(255,255,255,0.2);
      ">
        <div style="display: flex; align-items: center; justify-content: between; margin-bottom: 12px;">
          <div style="display: flex; align-items: center;">
            <div style="
              width: 24px;
              height: 24px;
              background: white;
              border-radius: 6px;
              display: flex;
              align-items: center;
              justify-content: center;
              margin-right: 8px;
            ">
              <span style="color: #667eea; font-weight: bold; font-size: 12px;">W</span>
            </div>
            <span style="font-weight: 600; font-size: 12px;">Wisor Recommendation</span>
          </div>
          <button id="wisor-close" style="
            background: none;
            border: none;
            color: white;
            cursor: pointer;
            font-size: 18px;
            line-height: 1;
            padding: 0;
            margin-left: auto;
          ">×</button>
        </div>
        
        <div style="
          background: rgba(255,255,255,0.15);
          border-radius: 8px;
          padding: 12px;
          margin-bottom: 12px;
        ">
          <div style="font-weight: 600; margin-bottom: 4px; font-size: 14px; display: flex; align-items: center;">
            ${recommendations.aiPowered ? '🤖' : '💳'} ${recommendations.recommendedCard.card_name}
          </div>
          <div style="font-size: 12px; opacity: 0.9; margin-bottom: 6px;">
            •••• •••• •••• ${recommendations.recommendedCard.card_last4} • ${recommendations.recommendedCard.network}
          </div>
          ${recommendations.reasoning ? `
          <div style="font-size: 11px; opacity: 0.8; margin-bottom: 4px; font-style: italic;">
            ${recommendations.reasoning}
          </div>
          ` : ''}
          <div style="
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-size: 12px;
          ">
            <span>💰 Save ₹${recommendations.savings}</span>
            <span style="
              background: rgba(255,255,255,0.2);
              padding: 2px 6px;
              border-radius: 4px;
              font-size: 10px;
            ">${recommendations.aiPowered ? 'AI Powered' : 'Smart Pick'}</span>
          </div>
        </div>
        
        <div style="text-align: center;">
          <button id="wisor-open-extension" style="
            background: white;
            color: #667eea;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            font-weight: 600;
            cursor: pointer;
            font-size: 12px;
            transition: all 0.2s ease;
          ">View All Cards</button>
        </div>
      </div>
    `

    // Add widget to page
    document.body.appendChild(widget)

    // Add event listeners
    const closeButton = document.getElementById('wisor-close')
    const openExtensionButton = document.getElementById('wisor-open-extension')

    closeButton?.addEventListener('click', () => {
      widget.remove()
    })

    openExtensionButton?.addEventListener('click', () => {
      // This will trigger the extension popup
      chrome.runtime.sendMessage({ type: 'OPEN_POPUP' })
    })

    // Auto-hide after 30 seconds
    setTimeout(() => {
      if (document.getElementById('wisor-widget')) {
        widget.style.opacity = '0.7'
        widget.style.transform = 'translateX(10px)'
      }
    }, 30000)

    console.log('Wisor recommendation widget created')
  } catch (error) {
    console.error('Error creating Wisor widget:', error)
  }
}

// Initialize widget when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', createRecommendationWidget)
} else {
  createRecommendationWidget()
}

// Listen for page navigation (SPA support)
let lastUrl = location.href
new MutationObserver(() => {
  const url = location.href
  if (url !== lastUrl) {
    lastUrl = url
    setTimeout(createRecommendationWidget, 2000) // Delay for SPA routing
  }
}).observe(document, { subtree: true, childList: true })