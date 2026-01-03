// ABOUTME: Declares domain-level TypeScript types for grocery lists and items.
// ABOUTME: Provides shared interfaces used across the data, state, and UI layers.
export type SortMode = 'category' | 'manual'

export type QuantityUnit = 'lb' | 'lbs' | 'oz' | 'g' | 'kg' | 'ct' | 'pcs' | 'pc'

export interface List {
  id: string
  name: string
  createdAt: number
  updatedAt: number
  sortMode: SortMode
  categoryOrder: string[]
  storeProfileId?: string
  position?: number
}

export interface Item {
  id: string
  listId: string
  name: string
  nameOriginal: string
  quantity?: number
  unit?: QuantityUnit
  categoryId?: string
  notes?: string
  isPurchased: boolean
  position?: number
  createdAt: number
  updatedAt: number
  purchasedAt?: number
}

export interface Category {
  id: string
  name: string
  defaultOrder: number
}

export interface ItemHistoryEntry {
  id: string
  nameCanonical: string
  lastUsedAt: number
  timesUsed: number
  defaultCategoryId?: string
  isFavorite: boolean
}

export interface StoreProfile {
  id: string
  name: string
  aisleOrder: string[]
  perStoreCategoryAliases?: Record<string, string>
}

export interface ExportPayload {
  lists: List[]
  items: Item[]
  categories: Category[]
  itemHistory: ItemHistoryEntry[]
  storeProfiles: StoreProfile[]
  exportedAt: number
  version: number
}
