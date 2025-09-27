import { useState, useEffect } from "react"
import { CreditCard, Plus, Download, ExternalLink, RefreshCw } from "lucide-react"

import { supabase, type Card } from "~lib/supabase"
import { getUserSession, saveUserSession, clearUserSession } from "~lib/storage"
import { syncCardsFromServer, getCardRecommendations } from "~lib/cardSync"

import "./style.css"

function IndexPopup() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [cards, setCards] = useState<Card[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [recommendations, setRecommendations] = useState<any>(null)
  const [currentDomain, setCurrentDomain] = useState("")

  useEffect(() => {
    checkAuthAndLoadData()
    getCurrentDomain()
  }, [])

  const checkAuthAndLoadData = async () => {
    try {
      setIsLoading(true)

      // Check if user is logged in
      const session = await getUserSession()
      if (!session?.user) {
        setIsLoggedIn(false)
        setIsLoading(false)
        return
      }

      setIsLoggedIn(true)

      // Load user's cards
      const userCards = await syncCardsFromServer()
      setCards(userCards)

      // Get recommendations for current site
      if (currentDomain) {
        const recs = await getCardRecommendations(currentDomain)
        setRecommendations(recs)
      }
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getCurrentDomain = async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      if (tab?.url) {
        const url = new URL(tab.url)
        setCurrentDomain(url.hostname)
        
        // Get recommendations once we have the domain
        if (cards.length > 0) {
          const recs = await getCardRecommendations(url.hostname)
          setRecommendations(recs)
        }
      }
    } catch (error) {
      console.error("Error getting current domain:", error)
    }
  }

  const handleLogin = () => {
    const webAppUrl = process.env.PLASMO_PUBLIC_WEB_APP_URL || "http://localhost:3000"
    chrome.tabs.create({ url: webAppUrl })
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      await clearUserSession()
      setIsLoggedIn(false)
      setCards([])
      setRecommendations(null)
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  const refreshData = async () => {
    await checkAuthAndLoadData()
  }

  if (isLoading) {
    return (
      <div className="w-80 h-64 flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto mb-2"></div>
          <p className="text-slate-600 text-sm">Loading Wisor...</p>
        </div>
      </div>
    )
  }

  if (!isLoggedIn) {
    return (
      <div className="w-80 bg-gradient-to-br from-slate-50 to-blue-50 p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-xl">W</span>
          </div>
          <h1 className="text-xl font-bold text-slate-800 mb-2">Welcome to Wisor</h1>
          <p className="text-slate-600 text-sm mb-6">
            Login to get personalized credit card recommendations
          </p>
          <button
            onClick={handleLogin}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 px-4 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-600 transition-all duration-200 flex items-center justify-center"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Login to Wisor
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-80 bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-white/20 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">W</span>
            </div>
            <span className="font-semibold text-slate-800">Wisor</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={refreshData}
              className="p-1 hover:bg-slate-100 rounded"
              title="Refresh"
            >
              <RefreshCw className="h-4 w-4 text-slate-600" />
            </button>
            <button
              onClick={handleLogout}
              className="text-xs text-slate-600 hover:text-slate-800"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {recommendations?.recommendedCard && (
        <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 border-b border-white/20">
          <h3 className="text-sm font-semibold text-slate-800 mb-2 flex items-center">
            {recommendations.aiPowered ? '🤖' : '💡'} 
            <span className="ml-1">
              {recommendations.aiPowered ? 'AI Recommendation' : 'Smart Pick'} for {currentDomain}
            </span>
          </h3>
          <div className="bg-white/60 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-slate-800">
                {recommendations.recommendedCard.card_name}
              </span>
              <span className="text-xs text-green-600 font-semibold">
                Save ₹{recommendations.savings}
              </span>
            </div>
            <div className="text-xs text-slate-600 mb-2">
              •••• {recommendations.recommendedCard.card_last4} • {recommendations.recommendedCard.network}
            </div>
            {recommendations.reasoning && (
              <div className="text-xs text-slate-500 italic">
                {recommendations.reasoning}
              </div>
            )}
            {recommendations.aiPowered && (
              <div className="text-xs text-blue-600 font-medium mt-1">
                Powered by Claude AI ✨
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cards List */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-800">
            Your Cards ({cards.length})
          </h3>
          <button
            onClick={() => chrome.tabs.create({ url: process.env.PLASMO_PUBLIC_WEB_APP_URL || "http://localhost:3000" })}
            className="p-1 hover:bg-slate-100 rounded"
            title="Add Card"
          >
            <Plus className="h-4 w-4 text-slate-600" />
          </button>
        </div>

        {cards.length > 0 ? (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {cards.map((card) => (
              <div key={card.id} className="bg-white/60 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-slate-800">
                    {card.card_name}
                  </span>
                  <span className="text-xs text-slate-500">{card.network}</span>
                </div>
                <div className="text-xs text-slate-600">
                  •••• •••• •••• {card.card_last4}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <CreditCard className="h-8 w-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm text-slate-600 mb-3">No cards added yet</p>
            <button
              onClick={() => chrome.tabs.create({ url: process.env.PLASMO_PUBLIC_WEB_APP_URL || "http://localhost:3000" })}
              className="bg-gradient-to-r from-blue-500 to-purple-500 text-white py-2 px-4 rounded-lg font-medium text-sm hover:from-blue-600 hover:to-purple-600 transition-all duration-200"
            >
              Add Your First Card
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-white/20">
        <button
          onClick={() => chrome.tabs.create({ url: process.env.PLASMO_PUBLIC_WEB_APP_URL || "http://localhost:3000" })}
          className="w-full text-center text-xs text-blue-600 hover:text-blue-700 flex items-center justify-center"
        >
          <ExternalLink className="mr-1 h-3 w-3" />
          Open Wisor Dashboard
        </button>
      </div>
    </div>
  )
}

export default IndexPopup