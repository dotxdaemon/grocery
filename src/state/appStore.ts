// ABOUTME: Manages application state, persistence, and mutations for the grocery app.
// ABOUTME: Coordinates Dexie/localStorage storage, history tracking, and list/item actions.
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { DEFAULT_CATEGORIES, DEFAULT_CATEGORY_ORDER } from '../domain/categories'
import { buildHistorySuggestions, inferCategoryFromHistory } from '../domain/history'
import { validateImportedData } from '../domain/importExport'
import { parseQuickAddInput } from '../domain/parse'
import { sortItems } from '../domain/sort'
import type {
  Category,
  ExportPayload,
  Item,
  ItemHistoryEntry,
  List,
  SortMode,
  StoreProfile,
} from '../domain/types'
import {
  loadFromFallback,
  loadFromIndexedDb,
  saveToFallback,
  saveToIndexedDb,
  type StorageMode,
} from './storage'

interface Preferences {
  activeListId?: string
  movePurchasedToBottom: Record<string, boolean>
  searchQueryByList: Record<string, string>
}

interface UndoState {
  label: string
  snapshot: ExportPayload
}

export interface AppState {
  status: 'idle' | 'ready' | 'error'
  storageMode: StorageMode
  lists: List[]
  items: Item[]
  categories: Category[]
  itemHistory: ItemHistoryEntry[]
  storeProfiles: StoreProfile[]
  preferences: Preferences
  lastUndo?: UndoState
  error?: string
  init: () => Promise<void>
  setActiveList: (id?: string) => void
  setSearchQuery: (listId: string, query: string) => void
  setMovePurchasedToBottom: (listId: string, value: boolean) => void
  createList: (name: string) => Promise<void>
  renameList: (id: string, name: string) => Promise<void>
  reorderLists: (orderedIds: string[]) => Promise<void>
  deleteList: (id: string) => Promise<void>
  addItemQuick: (listId: string, input: string, categoryId?: string) => Promise<void>
  updateItem: (id: string, updates: Partial<Item>) => Promise<void>
  deleteItem: (id: string) => Promise<void>
  toggleItemPurchased: (id: string) => Promise<void>
  reorderItems: (listId: string, orderedIds: string[]) => Promise<void>
  clearPurchased: (listId: string) => Promise<void>
  setSortMode: (listId: string, mode: SortMode) => Promise<void>
  reorderCategories: (listId: string, order: string[]) => Promise<void>
  renameCategory: (id: string, name: string) => Promise<void>
  resetCategories: () => Promise<void>
  toggleFavoriteHistory: (id: string) => Promise<void>
  exportData: () => Promise<ExportPayload>
  importData: (payload: unknown) => Promise<ReturnType<typeof validateImportedData>>
  undo: () => Promise<void>
  clearUndo: () => void
}

const emptyData = (): ExportPayload => ({
  version: 1,
  exportedAt: Date.now(),
  lists: [],
  items: [],
  categories: DEFAULT_CATEGORIES,
  itemHistory: [],
  storeProfiles: [],
})

const snapshotFromState = (state: AppState): ExportPayload => ({
  version: 1,
  exportedAt: Date.now(),
  lists: state.lists,
  items: state.items,
  categories: state.categories,
  itemHistory: state.itemHistory,
  storeProfiles: state.storeProfiles,
})

const persistSnapshot = async (snapshot: ExportPayload, mode: StorageMode) => {
  if (mode === 'idb') {
    await saveToIndexedDb(snapshot)
  } else {
    saveToFallback(snapshot)
  }
}

const sortLists = (lists: List[]) =>
  [...lists].sort((a, b) => {
    if (a.position !== undefined && b.position !== undefined && a.position !== b.position) {
      return (a.position ?? 0) - (b.position ?? 0)
    }
    return b.updatedAt - a.updatedAt
  })

const nextPosition = (lists: List[]) => {
  if (!lists.length) return 0
  const positions = lists.map((list) => list.position ?? 0)
  return Math.max(...positions) + 1
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      status: 'idle',
      storageMode: 'idb',
      lists: [],
      items: [],
      categories: DEFAULT_CATEGORIES,
      itemHistory: [],
      storeProfiles: [],
      preferences: { movePurchasedToBottom: {}, searchQueryByList: {} },
      async init() {
        try {
          const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000))
          const payload = await Promise.race([
            loadFromIndexedDb().then((data) => ({ mode: 'idb' as const, data })),
            timeout,
          ])
          if (payload && payload !== null) {
            set({
              status: 'ready',
              storageMode: payload.mode,
              lists: sortLists(payload.data.lists),
              items: payload.data.items,
              categories: payload.data.categories.length ? payload.data.categories : DEFAULT_CATEGORIES,
              itemHistory: payload.data.itemHistory,
              storeProfiles: payload.data.storeProfiles,
              error: undefined,
            })
          } else {
            const fallback = loadFromFallback() ?? emptyData()
            set({
              status: 'ready',
              storageMode: 'fallback',
              lists: sortLists(fallback.lists),
              items: fallback.items,
              categories: fallback.categories.length ? fallback.categories : DEFAULT_CATEGORIES,
              itemHistory: fallback.itemHistory,
              storeProfiles: fallback.storeProfiles,
              error: 'Using limited storage. IndexedDB unavailable.',
            })
          }
        } catch {
          const fallback = loadFromFallback() ?? emptyData()
          set({
            status: 'ready',
            storageMode: 'fallback',
            lists: sortLists(fallback.lists),
            items: fallback.items,
            categories: fallback.categories.length ? fallback.categories : DEFAULT_CATEGORIES,
            itemHistory: fallback.itemHistory,
            storeProfiles: fallback.storeProfiles,
            error: 'Using limited storage. IndexedDB unavailable.',
          })
        }
      },
      setActiveList(id) {
        set((state) => ({
          preferences: { ...state.preferences, activeListId: id },
        }))
      },
      setSearchQuery(listId, query) {
        set((state) => ({
          preferences: {
            ...state.preferences,
            searchQueryByList: { ...state.preferences.searchQueryByList, [listId]: query },
          },
        }))
      },
      setMovePurchasedToBottom(listId, value) {
        set((state) => ({
          preferences: {
            ...state.preferences,
            movePurchasedToBottom: { ...state.preferences.movePurchasedToBottom, [listId]: value },
          },
        }))
      },
      async createList(name) {
        const state = get()
        const now = Date.now()
        const list: List = {
          id: crypto.randomUUID(),
          name: name.trim() || 'List',
          createdAt: now,
          updatedAt: now,
          sortMode: 'category',
          categoryOrder: DEFAULT_CATEGORY_ORDER,
          position: nextPosition(state.lists),
        }
        const snapshot = snapshotFromState(state)
        const lists = sortLists([...state.lists, list])
        const after: AppState = { ...state, lists, preferences: { ...state.preferences, activeListId: list.id } }
        set({ ...after, lastUndo: { label: 'Created list', snapshot } })
        await persistSnapshot(snapshotFromState(after), after.storageMode)
      },
      async renameList(id, name) {
        const state = get()
        const snapshot = snapshotFromState(state)
        const lists = state.lists.map((list) =>
          list.id === id ? { ...list, name: name.trim() || list.name, updatedAt: Date.now() } : list,
        )
        set({ lists, lastUndo: { label: 'Renamed list', snapshot } })
        await persistSnapshot(snapshotFromState({ ...state, lists }), state.storageMode)
      },
      async reorderLists(orderedIds) {
        const state = get()
        const snapshot = snapshotFromState(state)
        const mapped = orderedIds
          .map((id, index) => {
            const list = state.lists.find((entry) => entry.id === id)
            if (!list) return null
            return { ...list, position: index }
          })
          .filter(Boolean) as List[]
        const remaining = state.lists
          .filter((list) => !orderedIds.includes(list.id))
          .map((list, index) => ({ ...list, position: mapped.length + index }))
        const lists = sortLists([...mapped, ...remaining])
        set({ lists, lastUndo: { label: 'Reordered lists', snapshot } })
        await persistSnapshot(snapshotFromState({ ...state, lists }), state.storageMode)
      },
      async deleteList(id) {
        const state = get()
        const snapshot = snapshotFromState(state)
        const lists = state.lists.filter((list) => list.id !== id)
        const items = state.items.filter((item) => item.listId !== id)
        const preferences = { ...state.preferences }
        if (preferences.activeListId === id) {
          preferences.activeListId = lists[0]?.id
        }
        set({ lists, items, preferences, lastUndo: { label: 'Deleted list', snapshot } })
        await persistSnapshot(snapshotFromState({ ...state, lists, items }), state.storageMode)
      },
      async addItemQuick(listId, input, categoryId) {
        const state = get()
        const chunks = input
          .split(/[,\n;]+/)
          .map((chunk) => chunk.trim())
          .filter(Boolean)
        if (!chunks.length) return

        const snapshot = snapshotFromState(state)
        const now = Date.now()
        let itemHistory = state.itemHistory
        const newItems: Item[] = []
        let positionCursor = state.items.filter(
          (entry) => entry.listId === listId && !entry.isPurchased,
        ).length

        for (const chunk of chunks) {
          const parsed = parseQuickAddInput(chunk)
          if (!parsed.nameCanonical) continue

          const inferredCategory =
            categoryId ?? inferCategoryFromHistory(parsed.nameCanonical, itemHistory)
          const item: Item = {
            id: crypto.randomUUID(),
            listId,
            name: parsed.nameCanonical,
            nameOriginal: parsed.nameOriginal,
            quantity: parsed.quantity,
            unit: parsed.unit,
            categoryId: inferredCategory,
            notes: '',
            isPurchased: false,
            position: positionCursor,
            createdAt: now,
            updatedAt: now,
          }
          positionCursor += 1
          newItems.push(item)

          const existingHistory = itemHistory.find(
            (entry) => entry.nameCanonical === parsed.nameCanonical,
          )
          if (existingHistory) {
            itemHistory = itemHistory.map((entry) =>
              entry.id === existingHistory.id
                ? {
                    ...entry,
                    timesUsed: entry.timesUsed + 1,
                    lastUsedAt: now,
                    defaultCategoryId: inferredCategory ?? entry.defaultCategoryId,
                  }
                : entry,
            )
          } else {
            itemHistory = [
              ...itemHistory,
              {
                id: crypto.randomUUID(),
                nameCanonical: parsed.nameCanonical,
                defaultCategoryId: inferredCategory,
                lastUsedAt: now,
                timesUsed: 1,
                isFavorite: false,
              },
            ]
          }
        }

        if (!newItems.length) return

        const items = [...state.items, ...newItems]
        const lists = state.lists.map((list) =>
          list.id === listId ? { ...list, updatedAt: now } : list,
        )

        set({ items, lists, itemHistory, lastUndo: { label: 'Added item', snapshot } })
        await persistSnapshot(snapshotFromState({ ...state, items, lists, itemHistory }), state.storageMode)
      },
      async updateItem(id, updates) {
        const state = get()
        const snapshot = snapshotFromState(state)
        const now = Date.now()
        const items = state.items.map((item) =>
          item.id === id ? { ...item, ...updates, updatedAt: now } : item,
        )
        const lists = state.lists.map((list) =>
          state.items.find((item) => item.id === id && item.listId === list.id)
            ? { ...list, updatedAt: now }
            : list,
        )
        let itemHistory = state.itemHistory
        if (updates.categoryId) {
          const target = state.items.find((item) => item.id === id)
          if (target) {
            itemHistory = state.itemHistory.map((entry) =>
              entry.nameCanonical === target.name
                ? { ...entry, defaultCategoryId: updates.categoryId ?? entry.defaultCategoryId }
                : entry,
            )
          }
        }
        set({ items, lists, itemHistory, lastUndo: { label: 'Updated item', snapshot } })
        await persistSnapshot(
          snapshotFromState({ ...state, items, lists, itemHistory }),
          state.storageMode,
        )
      },
      async deleteItem(id) {
        const state = get()
        const snapshot = snapshotFromState(state)
        const target = state.items.find((item) => item.id === id)
        const items = state.items.filter((item) => item.id !== id)
        const lists =
          target !== undefined
            ? state.lists.map((list) =>
                list.id === target.listId ? { ...list, updatedAt: Date.now() } : list,
              )
            : state.lists
        set({ items, lists, lastUndo: { label: 'Deleted item', snapshot } })
        await persistSnapshot(snapshotFromState({ ...state, items, lists }), state.storageMode)
      },
      async toggleItemPurchased(id) {
        const state = get()
        const snapshot = snapshotFromState(state)
        const now = Date.now()
        const items = state.items.map((item) =>
          item.id === id
            ? {
                ...item,
                isPurchased: !item.isPurchased,
                purchasedAt: item.isPurchased ? undefined : now,
                updatedAt: now,
              }
            : item,
        )
        const lists = state.lists.map((list) =>
          state.items.find((item) => item.id === id && item.listId === list.id)
            ? { ...list, updatedAt: now }
            : list,
        )
        const target = items.find((item) => item.id === id)
        const itemHistory =
          target && target.isPurchased
            ? state.itemHistory.map((entry) =>
                entry.nameCanonical === target.name
                  ? { ...entry, timesUsed: entry.timesUsed + 1, lastUsedAt: now }
                  : entry,
              )
            : state.itemHistory
        set({ items, lists, itemHistory, lastUndo: { label: 'Toggled purchase', snapshot } })
        await persistSnapshot(snapshotFromState({ ...state, items, lists, itemHistory }), state.storageMode)
      },
      async reorderItems(listId, orderedIds) {
        const state = get()
        const snapshot = snapshotFromState(state)
        const items = state.items.map((item) => {
          if (item.listId !== listId) return item
          const newIndex = orderedIds.indexOf(item.id)
          if (newIndex === -1) return item
          return { ...item, position: newIndex }
        })
        const lists = state.lists.map((list) =>
          list.id === listId ? { ...list, updatedAt: Date.now() } : list,
        )
        set({ items, lists, lastUndo: { label: 'Reordered items', snapshot } })
        await persistSnapshot(snapshotFromState({ ...state, items, lists }), state.storageMode)
      },
      async clearPurchased(listId) {
        const state = get()
        const snapshot = snapshotFromState(state)
        const items = state.items.filter((item) => !(item.listId === listId && item.isPurchased))
        const lists = state.lists.map((list) =>
          list.id === listId ? { ...list, updatedAt: Date.now() } : list,
        )
        set({ items, lists, lastUndo: { label: 'Cleared purchased', snapshot } })
        await persistSnapshot(snapshotFromState({ ...state, items, lists }), state.storageMode)
      },
      async setSortMode(listId, mode) {
        const state = get()
        const snapshot = snapshotFromState(state)
        const lists = state.lists.map((list) =>
          list.id === listId ? { ...list, sortMode: mode, updatedAt: Date.now() } : list,
        )

        let items = state.items
        if (mode === 'manual') {
          const ordered = sortItems(
            state.items.filter((item) => item.listId === listId),
            state.categories,
            {
              sortMode: 'category',
              categoryOrder: lists.find((l) => l.id === listId)?.categoryOrder ?? DEFAULT_CATEGORY_ORDER,
              movePurchasedToBottom: true,
            },
          )
          items = state.items.map((item) => {
            const index = ordered.findIndex((entry) => entry.id === item.id)
            return index >= 0 ? { ...item, position: index } : item
          })
        }

        set({ lists, items, lastUndo: { label: 'Changed sort mode', snapshot } })
        await persistSnapshot(snapshotFromState({ ...state, lists, items }), state.storageMode)
      },
      async reorderCategories(listId, order) {
        const state = get()
        const snapshot = snapshotFromState(state)
        const lists = state.lists.map((list) =>
          list.id === listId ? { ...list, categoryOrder: order, updatedAt: Date.now() } : list,
        )
        set({ lists, lastUndo: { label: 'Reordered categories', snapshot } })
        await persistSnapshot(snapshotFromState({ ...state, lists }), state.storageMode)
      },
      async renameCategory(id, name) {
        const state = get()
        const snapshot = snapshotFromState(state)
        const categories = state.categories.map((category) =>
          category.id === id ? { ...category, name: name.trim() || category.name } : category,
        )
        set({ categories, lastUndo: { label: 'Renamed category', snapshot } })
        await persistSnapshot(snapshotFromState({ ...state, categories }), state.storageMode)
      },
      async resetCategories() {
        const state = get()
        const snapshot = snapshotFromState(state)
        const categories = DEFAULT_CATEGORIES
        const lists = state.lists.map((list) => ({ ...list, categoryOrder: DEFAULT_CATEGORY_ORDER }))
        set({ categories, lists, lastUndo: { label: 'Reset categories', snapshot } })
        await persistSnapshot(snapshotFromState({ ...state, categories, lists }), state.storageMode)
      },
      async toggleFavoriteHistory(id) {
        const state = get()
        const snapshot = snapshotFromState(state)
        const itemHistory = state.itemHistory.map((entry) =>
          entry.id === id ? { ...entry, isFavorite: !entry.isFavorite } : entry,
        )
        set({ itemHistory, lastUndo: { label: 'Updated favorite', snapshot } })
        await persistSnapshot(snapshotFromState({ ...state, itemHistory }), state.storageMode)
      },
      async exportData() {
        return snapshotFromState(get())
      },
      async importData(payload) {
        const result = validateImportedData(payload)
        if (!result.valid || !result.data) {
          return result
        }
        const state = get()
        const snapshot = snapshotFromState(state)
        const applied = {
          ...result.data,
          categories: result.data.categories.length ? result.data.categories : DEFAULT_CATEGORIES,
        }
        const preferences =
          get().preferences.activeListId && !result.data.lists.find((l) => l.id === get().preferences.activeListId)
            ? { ...get().preferences, activeListId: result.data.lists[0]?.id }
            : get().preferences

        set({
          lists: sortLists(applied.lists),
          items: applied.items,
          categories: applied.categories,
          itemHistory: applied.itemHistory,
          storeProfiles: applied.storeProfiles,
          preferences,
          lastUndo: { label: 'Import data', snapshot },
        })
        await persistSnapshot(applied, state.storageMode)
        return result
      },
      async undo() {
        const state = get()
        if (!state.lastUndo) return
        set({
          lists: sortLists(state.lastUndo.snapshot.lists),
          items: state.lastUndo.snapshot.items,
          categories: state.lastUndo.snapshot.categories,
          itemHistory: state.lastUndo.snapshot.itemHistory,
          storeProfiles: state.lastUndo.snapshot.storeProfiles,
          lastUndo: undefined,
        })
        await persistSnapshot(state.lastUndo.snapshot, state.storageMode)
      },
      clearUndo() {
        set({ lastUndo: undefined })
      },
    }),
    {
      name: 'grocery-preferences',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ preferences: state.preferences }),
    },
  ),
)

export type HistorySuggestion = ReturnType<typeof buildHistorySuggestions>[number]
