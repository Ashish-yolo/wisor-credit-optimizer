import { supabase } from "~lib/supabase"
import { saveUserSession, clearUserSession, getUserSession } from "~lib/storage"
import { syncCardsFromServer } from "~lib/cardSync"

// Listen for auth state changes from the web app
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "AUTH_STATE_CHANGED") {
    handleAuthStateChange(message.session)
    sendResponse({ success: true })
  } else if (message.type === "SYNC_CARDS") {
    syncCardsFromServer().then((cards) => {
      sendResponse({ success: true, cards })
    }).catch((error) => {
      sendResponse({ success: false, error: error.message })
    })
    return true // Keep the message channel open for async response
  }
})

async function handleAuthStateChange(session: any) {
  try {
    if (session) {
      await saveUserSession(session)
      // Sync cards when user logs in
      await syncCardsFromServer()
      console.log("User logged in, session saved")
    } else {
      await clearUserSession()
      console.log("User logged out, session cleared")
    }
  } catch (error) {
    console.error("Error handling auth state change:", error)
  }
}

// Periodic sync every 10 minutes when extension is active
setInterval(async () => {
  try {
    const session = await getUserSession()
    if (session?.user) {
      await syncCardsFromServer()
      console.log("Background sync completed")
    }
  } catch (error) {
    console.error("Background sync error:", error)
  }
}, 10 * 60 * 1000) // 10 minutes

// Listen for tab updates to show recommendations
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    try {
      const session = await getUserSession()
      if (session?.user) {
        // Inject content script for recommendations
        const url = new URL(tab.url)
        if (isSupportedSite(url.hostname)) {
          chrome.scripting.executeScript({
            target: { tabId },
            files: ['content.js']
          }).catch(console.error)
        }
      }
    } catch (error) {
      console.error("Error handling tab update:", error)
    }
  }
})

function isSupportedSite(hostname: string): boolean {
  const supportedSites = [
    'amazon.in',
    'amazon.com',
    'flipkart.com',
    'myntra.com',
    'zomato.com',
    'swiggy.com',
    'makemytrip.com',
    'bigbasket.com',
    'bookmyshow.com',
    'nykaa.com',
    'croma.com'
  ]
  
  return supportedSites.some(site => hostname.includes(site))
}