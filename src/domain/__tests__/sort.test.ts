// ABOUTME: Tests sorting helpers for items across category and manual modes.
// ABOUTME: Verifies purchased placement, category ordering, and manual positions.
import { describe, expect, it } from 'vitest'
import { DEFAULT_CATEGORIES } from '../categories'
import { sortItems, type SortOptions } from '../sort'
import type { Item } from '../types'

const baseItem = (overrides: Partial<Item>): Item => ({
  id: overrides.id ?? crypto.randomUUID(),
  listId: 'list-1',
  name: overrides.name ?? 'item',
  nameOriginal: overrides.nameOriginal ?? overrides.name ?? 'item',
  isPurchased: overrides.isPurchased ?? false,
  createdAt: overrides.createdAt ?? Date.now(),
  updatedAt: overrides.updatedAt ?? Date.now(),
  ...overrides,
})

const defaultOptions: SortOptions = {
  sortMode: 'category',
  categoryOrder: DEFAULT_CATEGORIES.map((c) => c.id),
  movePurchasedToBottom: true,
}

describe('sortItems', () => {
  it('sorts by category order then name with purchased last', () => {
    const items: Item[] = [
      baseItem({ id: '1', name: 'Bananas', categoryId: 'produce' }),
      baseItem({ id: '2', name: 'Milk', categoryId: 'dairy' }),
      baseItem({ id: '3', name: 'Zucchini', categoryId: 'produce' }),
      baseItem({ id: '4', name: 'Paper Towels', categoryId: 'household' }),
      baseItem({ id: '5', name: 'Ice Cream', categoryId: 'frozen', isPurchased: true, purchasedAt: 2 }),
      baseItem({ id: '6', name: 'Bread', categoryId: 'bakery', isPurchased: true, purchasedAt: 1 }),
    ]

    const sorted = sortItems(items, DEFAULT_CATEGORIES, defaultOptions)

    expect(sorted.map((item) => item.id)).toEqual(['1', '3', '2', '4', '5', '6'])
  })

  it('places purchased items first when configured', () => {
    const items: Item[] = [
      baseItem({ id: '1', name: 'Milk', categoryId: 'dairy' }),
      baseItem({ id: '2', name: 'Cereal', categoryId: 'pantry', isPurchased: true, purchasedAt: 5 }),
      baseItem({ id: '3', name: 'Apples', categoryId: 'produce', isPurchased: true, purchasedAt: 10 }),
    ]

    const sorted = sortItems(items, DEFAULT_CATEGORIES, {
      ...defaultOptions,
      movePurchasedToBottom: false,
    })

    expect(sorted.map((item) => item.id)).toEqual(['3', '2', '1'])
  })

  it('honors manual positions when sort mode is manual', () => {
    const items: Item[] = [
      baseItem({ id: '1', name: 'Milk', position: 2 }),
      baseItem({ id: '2', name: 'Apples', position: 1 }),
      baseItem({ id: '3', name: 'Bread', position: 3, isPurchased: true }),
    ]

    const sorted = sortItems(items, DEFAULT_CATEGORIES, {
      ...defaultOptions,
      sortMode: 'manual',
      movePurchasedToBottom: true,
    })

    expect(sorted.map((item) => item.id)).toEqual(['2', '1', '3'])
  })

  it('supports alphabetical ordering with purchased items at the end', () => {
    const items: Item[] = [
      baseItem({ id: '1', name: 'Banana' }),
      baseItem({ id: '2', name: 'Apple' }),
      baseItem({ id: '3', name: 'Carrot', isPurchased: true }),
      baseItem({ id: '4', name: 'Dates' }),
    ]

    const sorted = sortItems(items, DEFAULT_CATEGORIES, {
      ...defaultOptions,
      sortMode: 'alpha',
    })

    expect(sorted.map((item) => item.id)).toEqual(['2', '1', '4', '3'])
  })

  it('orders by recent additions when requested', () => {
    const items: Item[] = [
      baseItem({ id: '1', name: 'Banana', createdAt: 1 }),
      baseItem({ id: '2', name: 'Apple', createdAt: 3 }),
      baseItem({ id: '3', name: 'Carrot', createdAt: 2, isPurchased: true, purchasedAt: 10 }),
      baseItem({ id: '4', name: 'Dates', createdAt: 4 }),
    ]

    const sorted = sortItems(items, DEFAULT_CATEGORIES, {
      ...defaultOptions,
      sortMode: 'recent',
    })

    expect(sorted.map((item) => item.id)).toEqual(['4', '2', '1', '3'])
  })
})
