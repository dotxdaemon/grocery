// ABOUTME: Tests validation of import/export payloads for grocery data.
// ABOUTME: Ensures schemas are enforced and partial imports report skipped records.
import { describe, expect, it } from 'vitest'
import { DEFAULT_CATEGORIES } from '../categories'
import { validateImportedData } from '../importExport'
import type { ExportPayload } from '../types'

const validPayload: ExportPayload = {
  version: 1,
  exportedAt: 10,
  lists: [
    {
      id: 'l1',
      name: 'Costco',
      createdAt: 1,
      updatedAt: 1,
      sortMode: 'category',
      categoryOrder: DEFAULT_CATEGORIES.map((c) => c.id),
    },
  ],
  items: [
    {
      id: 'i1',
      listId: 'l1',
      name: 'Milk',
      nameOriginal: 'Milk',
      isPurchased: false,
      createdAt: 1,
      updatedAt: 1,
    },
  ],
  categories: DEFAULT_CATEGORIES,
  itemHistory: [
    {
      id: 'h1',
      nameCanonical: 'milk',
      lastUsedAt: 1,
      timesUsed: 2,
      isFavorite: false,
    },
  ],
  storeProfiles: [],
}

describe('validateImportedData', () => {
  it('accepts a valid payload', () => {
    const result = validateImportedData(validPayload)
    expect(result.valid).toBe(true)
    expect(result.data?.lists).toHaveLength(1)
    expect(result.errors).toBeUndefined()
  })

  it('keeps valid entries and reports invalid ones', () => {
    const payload = {
      ...validPayload,
      lists: [...validPayload.lists, { id: '', name: '', createdAt: 1, updatedAt: 1, sortMode: 'category', categoryOrder: [] }],
      items: [...validPayload.items, { id: 'missing', listId: 'unknown', name: 'Bad', nameOriginal: 'Bad', isPurchased: false, createdAt: 1, updatedAt: 1 }],
    }

    const result = validateImportedData(payload)
    expect(result.valid).toBe(true)
    expect(result.errors).toBeTruthy()
    expect(result.data?.lists).toHaveLength(1)
    expect(result.data?.items).toHaveLength(1)
  })

  it('rejects non-object payloads', () => {
    const result = validateImportedData('not-json')
    expect(result.valid).toBe(false)
    expect(result.errors?.length).toBeGreaterThan(0)
  })
})
