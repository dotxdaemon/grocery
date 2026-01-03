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

  const lists = ensureArray(incoming.lists, 'lists').filter(
    (list: any): list is ExportPayload['lists'][number] =>
      typeof list?.id === 'string' &&
      list.id.trim() !== '' &&
      typeof list.name === 'string' &&
      typeof list.createdAt === 'number' &&
      typeof list.updatedAt === 'number' &&
      (list.sortMode === 'category' || list.sortMode === 'manual') &&
      Array.isArray(list.categoryOrder),
  )

  const listIds = new Set(lists.map((list) => list.id))

  const items = ensureArray(incoming.items, 'items').filter(
    (item: any): item is ExportPayload['items'][number] =>
      typeof item?.id === 'string' &&
      item.id.trim() !== '' &&
      typeof item.listId === 'string' &&
      listIds.has(item.listId) &&
      typeof item.name === 'string' &&
      typeof item.nameOriginal === 'string' &&
      typeof item.isPurchased === 'boolean' &&
      typeof item.createdAt === 'number' &&
      typeof item.updatedAt === 'number',
  )

  const categoriesSource = ensureArray(incoming.categories, 'categories')
  const categories = categoriesSource.filter(
    (category: any): category is ExportPayload['categories'][number] =>
      typeof category?.id === 'string' &&
      typeof category.name === 'string' &&
      typeof category.defaultOrder === 'number',
  )

  const itemHistorySource = ensureArray(incoming.itemHistory, 'itemHistory')
  const itemHistory = itemHistorySource.filter(
    (entry: any): entry is ExportPayload['itemHistory'][number] =>
      typeof entry?.id === 'string' &&
      typeof entry.nameCanonical === 'string' &&
      typeof entry.lastUsedAt === 'number' &&
      typeof entry.timesUsed === 'number' &&
      typeof entry.isFavorite === 'boolean',
  )

  const storeProfilesSource = ensureArray(incoming.storeProfiles, 'storeProfiles')
  const storeProfiles = storeProfilesSource.filter(
    (store: any): store is ExportPayload['storeProfiles'][number] =>
      typeof store?.id === 'string' &&
      typeof store.name === 'string' &&
      Array.isArray(store.aisleOrder),
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
