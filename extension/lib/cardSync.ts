import { supabase, type Card } from './supabase'
import { 
  getUserSession, 
  saveUserCards, 
  getUserCards,
  setLastSyncTime,
  isSyncNeeded 
} from './storage'

// Sync cards from Supabase to local storage
export const syncCardsFromServer = async (): Promise<Card[]> => {
  try {
    const session = await getUserSession()
    if (!session?.user) {
      console.log('No user session found')
      return []
    }

    // Check if sync is needed
    if (!(await isSyncNeeded())) {
      console.log('Sync not needed, returning cached cards')
      return await getUserCards()
    }

    console.log('Syncing cards from server...')

    const { data: cards, error } = await supabase
      .from('cards')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error syncing cards:', error)
      // Return cached cards if server sync fails
      return await getUserCards()
    }

    // Save to local storage
    await saveUserCards(cards || [])
    await setLastSyncTime()

    console.log(`Synced ${cards?.length || 0} cards from server`)
    return cards || []
  } catch (error) {
    console.error('Sync error:', error)
    // Return cached cards if sync fails
    return await getUserCards()
  }
}

// Add a new card and sync back to server
export const addCardToServer = async (cardData: {
  card_name: string
  network: string
  card_last4: string
}): Promise<Card | null> => {
  try {
    const session = await getUserSession()
    if (!session?.user) {
      throw new Error('No user session found')
    }

    const { data: newCard, error } = await supabase
      .from('cards')
      .insert({
        user_id: session.user.id,
        ...cardData
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    // Update local cache
    const currentCards = await getUserCards()
    const updatedCards = [newCard, ...currentCards]
    await saveUserCards(updatedCards)

    console.log('Card added successfully:', newCard)
    return newCard
  } catch (error) {
    console.error('Error adding card:', error)
    throw error
  }
}

// Delete a card and sync back to server
export const deleteCardFromServer = async (cardId: string): Promise<boolean> => {
  try {
    const session = await getUserSession()
    if (!session?.user) {
      throw new Error('No user session found')
    }

    const { error } = await supabase
      .from('cards')
      .delete()
      .eq('id', cardId)
      .eq('user_id', session.user.id)

    if (error) {
      throw error
    }

    // Update local cache
    const currentCards = await getUserCards()
    const updatedCards = currentCards.filter((card: Card) => card.id !== cardId)
    await saveUserCards(updatedCards)

    console.log('Card deleted successfully:', cardId)
    return true
  } catch (error) {
    console.error('Error deleting card:', error)
    throw error
  }
}

// Get AI-powered card recommendations for current site
export const getCardRecommendations = async (domain: string, amount?: number): Promise<{
  recommendedCard: Card | null
  allCards: Card[]
  savings: string
  aiPowered?: boolean
  reasoning?: string
}> => {
  try {
    const cards = await syncCardsFromServer()
    
    if (cards.length === 0) {
      return {
        recommendedCard: null,
        allCards: [],
        savings: '0',
        aiPowered: false
      }
    }

    // Try AI-powered recommendation first
    try {
      const aiRecommendation = await getAIRecommendation(domain, amount || 0, cards)
      if (aiRecommendation) {
        return aiRecommendation
      }
    } catch (aiError) {
      console.log('AI recommendation failed, falling back to rules-based:', aiError.message)
    }

    // Fallback to rule-based recommendations
    let recommendedCard = cards[0]

    // Basic domain-based recommendations
    if (domain.includes('amazon')) {
      const amazonCard = cards.find(card => 
        card.card_name.toLowerCase().includes('amazon') ||
        card.card_name.toLowerCase().includes('cashback')
      )
      if (amazonCard) recommendedCard = amazonCard
    } else if (domain.includes('flipkart')) {
      const flipkartCard = cards.find(card => 
        card.card_name.toLowerCase().includes('flipkart') ||
        card.card_name.toLowerCase().includes('axis')
      )
      if (flipkartCard) recommendedCard = flipkartCard
    } else if (domain.includes('zomato') || domain.includes('swiggy')) {
      const diningCard = cards.find(card => 
        card.card_name.toLowerCase().includes('dining') ||
        card.card_name.toLowerCase().includes('swiggy') ||
        card.card_name.toLowerCase().includes('zomato')
      )
      if (diningCard) recommendedCard = diningCard
    }

    // Calculate estimated savings (simplified calculation)
    const estimatedSavings = amount ? (amount * 0.05).toFixed(0) : '50'

    return {
      recommendedCard,
      allCards: cards,
      savings: estimatedSavings,
      aiPowered: false,
      reasoning: 'Rule-based recommendation'
    }
  } catch (error) {
    console.error('Error getting recommendations:', error)
    return {
      recommendedCard: null,
      allCards: [],
      savings: '0',
      aiPowered: false
    }
  }
}

// AI-powered recommendation function
const getAIRecommendation = async (domain: string, cartValue: number, userCards: Card[]): Promise<{
  recommendedCard: Card | null
  allCards: Card[]
  savings: string
  aiPowered: boolean
  reasoning: string
} | null> => {
  try {
    // Backend URL - use the deployed backend
    const backendUrl = process.env.PLASMO_PUBLIC_BACKEND_URL || 'https://wisor-ai-backend.onrender.com'
    
    const response = await fetch(`${backendUrl}/api/ai/recommend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        merchant: domain,
        cartValue,
        userCards: userCards.map(card => ({
          card_name: card.card_name,
          network: card.network,
          card_last4: card.card_last4
        }))
      })
    })

    if (!response.ok) {
      throw new Error(`AI API response: ${response.status}`)
    }

    const data = await response.json()

    if (data.success && data.recommendation) {
      // Find the recommended card in user's cards
      const recommendedCard = userCards.find(card => 
        card.card_name === data.recommendation.recommendedCard ||
        card.card_name.includes(data.recommendation.recommendedCard)
      ) || userCards[0]

      return {
        recommendedCard,
        allCards: userCards,
        savings: data.recommendation.rewardValue?.toString() || '50',
        aiPowered: data.aiPowered || false,
        reasoning: data.recommendation.reasoning || 'AI-powered recommendation'
      }
    }

    return null
  } catch (error) {
    console.error('AI recommendation error:', error)
    throw error
  }
}