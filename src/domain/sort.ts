// ABOUTME: Provides sorting helpers for grocery list items.
// ABOUTME: Orders items by category, purchase status, and manual positions.
import type { Category, Item, SortMode } from './types'

export interface SortOptions {
  sortMode: SortMode
  categoryOrder: string[]
  movePurchasedToBottom: boolean
}

export function sortItems(
  items: Item[],
  categories: Category[],
  options: SortOptions,
): Item[] {
  const orderMap = new Map<string, number>()
  options.categoryOrder.forEach((id, index) => orderMap.set(id, index))

  const purchasedPlacement = options.movePurchasedToBottom ? 1 : -1

  const resolveCategoryOrder = (categoryId?: string) => {
    if (!categoryId) return categories.length
    return orderMap.get(categoryId) ?? categories.length
  }

  const withOrder = [...items]
  withOrder.sort((a, b) => {
    if (a.isPurchased !== b.isPurchased) {
      return a.isPurchased ? purchasedPlacement : -purchasedPlacement
    }

    if (a.isPurchased && b.isPurchased) {
      const timeA = a.purchasedAt ?? 0
      const timeB = b.purchasedAt ?? 0
      return timeB - timeA
    }

    if (options.sortMode === 'manual') {
      const positionA = a.position ?? Number.POSITIVE_INFINITY
      const positionB = b.position ?? Number.POSITIVE_INFINITY
      if (positionA !== positionB) return positionA - positionB
      return a.name.localeCompare(b.name)
    }

    if (options.sortMode === 'alpha') {
      return a.name.localeCompare(b.name)
    }

    if (options.sortMode === 'recent') {
      if (a.createdAt !== b.createdAt) return b.createdAt - a.createdAt
      return a.name.localeCompare(b.name)
    }

    const categoryA = resolveCategoryOrder(a.categoryId)
    const categoryB = resolveCategoryOrder(b.categoryId)
    if (categoryA !== categoryB) return categoryA - categoryB
    return a.name.localeCompare(b.name)
  })
  return withOrder
}
