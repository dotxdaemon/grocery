// ABOUTME: Tests helpers for history-based category inference and suggestions.
// ABOUTME: Ensures favorites and frequent items influence autocomplete ordering.
import { describe, expect, it } from 'vitest'
import { buildHistorySuggestions, inferCategoryFromHistory } from '../history'
import type { ItemHistoryEntry } from '../types'

const sampleHistory: ItemHistoryEntry[] = [
  { id: '1', nameCanonical: 'milk', lastUsedAt: 5, timesUsed: 5, isFavorite: false, defaultCategoryId: 'dairy' },
  { id: '2', nameCanonical: 'bananas', lastUsedAt: 4, timesUsed: 2, isFavorite: true, defaultCategoryId: 'produce' },
  { id: '3', nameCanonical: 'banana chips', lastUsedAt: 3, timesUsed: 7, isFavorite: false, defaultCategoryId: 'snacks' },
]

describe('inferCategoryFromHistory', () => {
  it('returns the default category for a known item', () => {
    const categoryId = inferCategoryFromHistory('milk', sampleHistory)
    expect(categoryId).toBe('dairy')
  })

  it('returns undefined when no match exists', () => {
    const categoryId = inferCategoryFromHistory('unknown', sampleHistory)
    expect(categoryId).toBeUndefined()
  })
})

describe('buildHistorySuggestions', () => {
  it('prioritizes favorites when they match the query', () => {
    const suggestions = buildHistorySuggestions('ban', sampleHistory)
    expect(suggestions[0].id).toBe('2')
  })

  it('falls back to usage when no favorites are present', () => {
    const suggestions = buildHistorySuggestions('milk', sampleHistory.filter((entry) => !entry.isFavorite))
    expect(suggestions[0].nameCanonical).toBe('milk')
  })
})
