import { Storage } from '@plasmohq/storage'

const storage = new Storage()

// User session storage
export const saveUserSession = async (session: any) => {
  await storage.set('user_session', JSON.stringify(session))
}

export const getUserSession = async () => {
  const session = await storage.get('user_session')
  return session ? JSON.parse(session) : null
}

export const clearUserSession = async () => {
  await storage.remove('user_session')
}

// Cards cache storage
export const saveUserCards = async (cards: any[]) => {
  await storage.set('user_cards', JSON.stringify(cards))
}

export const getUserCards = async () => {
  const cards = await storage.get('user_cards')
  return cards ? JSON.parse(cards) : []
}

export const clearUserCards = async () => {
  await storage.remove('user_cards')
}

// Sync status
export const setLastSyncTime = async () => {
  await storage.set('last_sync_time', Date.now().toString())
}

export const getLastSyncTime = async () => {
  const time = await storage.get('last_sync_time')
  return time ? parseInt(time) : 0
}

// Check if sync is needed (sync every 5 minutes)
export const isSyncNeeded = async () => {
  const lastSync = await getLastSyncTime()
  const fiveMinutes = 5 * 60 * 1000
  return Date.now() - lastSync > fiveMinutes
}