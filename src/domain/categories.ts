// ABOUTME: Defines default grocery categories and helpers for ordering.
// ABOUTME: Supplies base category data used for sorting and UI initialization.
import type { Category } from './types'

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'produce', name: 'Produce', defaultOrder: 0 },
  { id: 'dairy', name: 'Dairy', defaultOrder: 1 },
  { id: 'meat', name: 'Meat', defaultOrder: 2 },
  { id: 'pantry', name: 'Pantry', defaultOrder: 3 },
  { id: 'frozen', name: 'Frozen', defaultOrder: 4 },
  { id: 'bakery', name: 'Bakery', defaultOrder: 5 },
  { id: 'household', name: 'Household', defaultOrder: 6 },
  { id: 'other', name: 'Other', defaultOrder: 7 },
]

export const DEFAULT_CATEGORY_ORDER = DEFAULT_CATEGORIES.map((category) => category.id)
