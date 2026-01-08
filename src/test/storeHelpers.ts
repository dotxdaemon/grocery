// ABOUTME: Supplies helpers for preparing the app store state during tests.
// ABOUTME: Keeps tests deterministic by resetting the store to a known baseline.
import { DEFAULT_CATEGORIES } from '../domain/categories'
import { useAppStore } from '../state/appStore'

export const resetAppStore = () => {
  useAppStore.setState({
    status: 'ready',
    storageMode: 'fallback',
    lists: [],
    items: [],
    categories: DEFAULT_CATEGORIES,
    itemHistory: [],
    storeProfiles: [],
    preferences: { movePurchasedToBottom: {}, searchQueryByList: {}, themeMode: 'light' },
    lastUndo: undefined,
    error: undefined,
  })
}
