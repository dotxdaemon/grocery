// ABOUTME: Validates and prepares data for import/export operations.
// ABOUTME: Ensures persisted lists, items, and categories meet schema expectations.
import type { ExportPayload } from './types'

export interface ImportResult {
  valid: boolean
  data?: ExportPayload
  errors?: string[]
}

export function validateImportedData(payload: unknown): ImportResult {
  if (typeof payload !== 'object' || payload === null) {
    return { valid: false, errors: ['Payload must be an object'] }
  }

  const incoming = payload as Partial<ExportPayload>
  const errors: string[] = []

  const ensureArray = (value: unknown, label: string): unknown[] => {
    if (!Array.isArray(value)) {
      errors.push(`${label} must be an array`)
      return []
    }
    return value
  }

  const toRecord = (value: unknown): Record<string, unknown> | null =>
    typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null

  const lists = ensureArray(incoming.lists, 'lists').filter((list): list is ExportPayload['lists'][number] => {
    const candidate = toRecord(list)
    return (
      candidate !== null &&
      typeof candidate.id === 'string' &&
      candidate.id.trim() !== '' &&
      typeof candidate.name === 'string' &&
      typeof candidate.createdAt === 'number' &&
      typeof candidate.updatedAt === 'number' &&
      (candidate.sortMode === 'category' || candidate.sortMode === 'manual') &&
      Array.isArray(candidate.categoryOrder)
    )
  })

  const listIds = new Set(lists.map((list) => list.id))

  const items = ensureArray(incoming.items, 'items').filter((item): item is ExportPayload['items'][number] => {
    const candidate = toRecord(item)
    return (
      candidate !== null &&
      typeof candidate.id === 'string' &&
      candidate.id.trim() !== '' &&
      typeof candidate.listId === 'string' &&
      listIds.has(candidate.listId) &&
      typeof candidate.name === 'string' &&
      typeof candidate.nameOriginal === 'string' &&
      typeof candidate.isPurchased === 'boolean' &&
      typeof candidate.createdAt === 'number' &&
      typeof candidate.updatedAt === 'number'
    )
  })

  const categoriesSource = ensureArray(incoming.categories, 'categories')
  const categories = categoriesSource.filter(
    (category: unknown): category is ExportPayload['categories'][number] => {
      const candidate = toRecord(category)
      return (
        candidate !== null &&
        typeof candidate.id === 'string' &&
        typeof candidate.name === 'string' &&
        typeof candidate.defaultOrder === 'number'
      )
    },
  )

  const itemHistorySource = ensureArray(incoming.itemHistory, 'itemHistory')
  const itemHistory = itemHistorySource.filter(
    (entry: unknown): entry is ExportPayload['itemHistory'][number] => {
      const candidate = toRecord(entry)
      return (
        candidate !== null &&
        typeof candidate.id === 'string' &&
        typeof candidate.nameCanonical === 'string' &&
        typeof candidate.lastUsedAt === 'number' &&
        typeof candidate.timesUsed === 'number' &&
        typeof candidate.isFavorite === 'boolean'
      )
    },
  )

  const storeProfilesSource = ensureArray(incoming.storeProfiles, 'storeProfiles')
  const storeProfiles = storeProfilesSource.filter(
    (store: unknown): store is ExportPayload['storeProfiles'][number] => {
      const candidate = toRecord(store)
      return (
        candidate !== null &&
        typeof candidate.id === 'string' &&
        typeof candidate.name === 'string' &&
        Array.isArray(candidate.aisleOrder)
      )
    },
  )

  if (incoming.lists && lists.length !== incoming.lists.length) {
    errors.push('Some lists were skipped because they were missing required fields')
  }
  if (incoming.items && items.length !== incoming.items.length) {
    errors.push('Some items were skipped because they were missing required fields')
  }
  if (incoming.categories && categories.length !== categoriesSource.length) {
    errors.push('Some categories were skipped because they were missing required fields')
  }
  if (incoming.itemHistory && itemHistory.length !== itemHistorySource.length) {
    errors.push('Some history entries were skipped because they were missing required fields')
  }
  if (incoming.storeProfiles && storeProfiles.length !== storeProfilesSource.length) {
    errors.push('Some store profiles were skipped because they were missing required fields')
  }

  const criticalFields =
    typeof incoming.version === 'number' &&
    typeof incoming.exportedAt === 'number' &&
    Array.isArray(incoming.lists) &&
    Array.isArray(incoming.items) &&
    Array.isArray(incoming.categories) &&
    Array.isArray(incoming.itemHistory) &&
    Array.isArray(incoming.storeProfiles)

  const sanitized: ExportPayload = {
    version: incoming.version ?? 1,
    exportedAt: incoming.exportedAt ?? Date.now(),
    lists,
    items,
    categories,
    itemHistory,
    storeProfiles,
  }

  const hasData =
    lists.length + items.length + categories.length + itemHistory.length + storeProfiles.length > 0

  if (!criticalFields || !hasData) {
    return { valid: false, errors: errors.length ? errors : ['Missing required payload sections'] }
  }

  return {
    valid: true,
    data: sanitized,
    errors: errors.length ? errors : undefined,
  }
}
