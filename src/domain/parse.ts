// ABOUTME: Parses quick-add user input into normalized grocery item fields.
// ABOUTME: Preserves numeric text as part of the item name while normalizing spacing.
import type { QuantityUnit } from './types'

export interface ParsedQuickAdd {
  nameCanonical: string
  nameOriginal: string
  quantity?: number
  unit?: QuantityUnit
}

export function splitQuickAddInput(raw: string): string[] {
  return raw
    .split(/\r?\n+/)
    .map((line) => line.trim())
    .map((line) => line.replace(/^([-*•]|\d+[.)])\s+/, '').trim())
    .filter(Boolean)
}

export function parseQuickAddInput(input: string): ParsedQuickAdd {
  const normalized = input.trim()

  if (!normalized) {
    return { nameCanonical: '', nameOriginal: '' }
  }

  const cleanedName = normalized.replace(/\s+/g, ' ').trim()
  if (!cleanedName) {
    return { nameCanonical: '', nameOriginal: '' }
  }
  const canonical = cleanedName.toLowerCase()

  return {
    nameCanonical: canonical || normalized.toLowerCase(),
    nameOriginal: cleanedName,
    quantity: undefined,
    unit: undefined,
  }
}
