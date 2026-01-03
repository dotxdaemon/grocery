// ABOUTME: Handles persistence to IndexedDB and a localStorage fallback.
// ABOUTME: Provides helper functions to load and save the full dataset snapshot.
import { db } from '../db/database'
import { DEFAULT_CATEGORIES } from '../domain/categories'
import type { ExportPayload } from '../domain/types'

const FALLBACK_KEY = 'grocery-fallback-data'

export type StorageMode = 'idb' | 'fallback'

export async function loadFromIndexedDb(): Promise<ExportPayload> {
  await db.open()
  const [lists, items, categories, itemHistory, storeProfiles] = await Promise.all([
    db.lists.toArray(),
    db.items.toArray(),
    db.categories.toArray(),
    db.itemHistory.toArray(),
    db.storeProfiles.toArray(),
  ])

  const payload: ExportPayload = {
    version: 1,
    exportedAt: Date.now(),
    lists,
    items,
    categories: categories.length ? categories : DEFAULT_CATEGORIES,
    itemHistory,
    storeProfiles,
  }

  if (!categories.length) {
    await saveToIndexedDb(payload)
  }

  return payload
}

export async function saveToIndexedDb(payload: ExportPayload): Promise<void> {
  await db.transaction('rw', [db.lists, db.items, db.categories, db.itemHistory, db.storeProfiles], async () => {
    await Promise.all([
      db.lists.clear(),
      db.items.clear(),
      db.categories.clear(),
      db.itemHistory.clear(),
      db.storeProfiles.clear(),
    ])
    await db.lists.bulkAdd(payload.lists)
    await db.items.bulkAdd(payload.items)
    await db.categories.bulkAdd(payload.categories)
    await db.itemHistory.bulkAdd(payload.itemHistory)
    if (payload.storeProfiles.length) {
      await db.storeProfiles.bulkAdd(payload.storeProfiles)
    }
  })
}

export function loadFromFallback(): ExportPayload | null {
  if (typeof localStorage === 'undefined') return null
  const raw = localStorage.getItem(FALLBACK_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as ExportPayload
    return parsed
  } catch (error) {
    console.error('Unable to parse fallback data', error)
    return null
  }
}

export function saveToFallback(payload: ExportPayload) {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(FALLBACK_KEY, JSON.stringify(payload))
}
