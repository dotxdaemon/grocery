// ABOUTME: Utilities for working with item history and suggestions.
// ABOUTME: Scores history entries for autocomplete and category inference.
import Fuse from 'fuse.js'
import type { ItemHistoryEntry } from './types'

export function inferCategoryFromHistory(
  canonicalName: string,
  history: ItemHistoryEntry[],
): string | undefined {
  const match = history.find((entry) => entry.nameCanonical === canonicalName)
  return match?.defaultCategoryId
}

export function buildHistorySuggestions(
  query: string,
  history: ItemHistoryEntry[],
  limit = 8,
): ItemHistoryEntry[] {
  const fuse = new Fuse(history, {
    keys: ['nameCanonical'],
    threshold: 0.4,
  })
  const matches = query ? fuse.search(query).map((result) => result.item) : history
  const sorted = [...matches].sort((a, b) => {
    if (a.isFavorite !== b.isFavorite) {
      return a.isFavorite ? -1 : 1
    }
    if (a.timesUsed !== b.timesUsed) {
      return b.timesUsed - a.timesUsed
    }
    return (b.lastUsedAt ?? 0) - (a.lastUsedAt ?? 0)
  })
  return sorted.slice(0, limit)
}
