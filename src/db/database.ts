// ABOUTME: Initializes the Dexie-powered IndexedDB for the grocery app.
// ABOUTME: Exposes typed tables for lists, items, categories, history, and stores.
import Dexie, { type Table } from 'dexie'
import type { Category, Item, ItemHistoryEntry, List, StoreProfile } from '../domain/types'

export class GroceryDatabase extends Dexie {
  lists!: Table<List>
  items!: Table<Item>
  categories!: Table<Category>
  itemHistory!: Table<ItemHistoryEntry>
  storeProfiles!: Table<StoreProfile>

  constructor() {
    super('grocery-db')
    this.version(1).stores({
      lists: 'id, updatedAt, name',
      items: 'id, listId, categoryId, isPurchased, name',
      categories: 'id, defaultOrder',
      itemHistory: 'id, nameCanonical, lastUsedAt, isFavorite',
      storeProfiles: 'id, name',
    })
  }
}

export const db = new GroceryDatabase()
