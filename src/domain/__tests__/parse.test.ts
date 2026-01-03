// ABOUTME: Tests the quick-add parser to ensure quantities and units are detected correctly.
// ABOUTME: Covers parsing heuristics for leading/trailing numbers and preserving original input.
import { describe, expect, it } from 'vitest'
import { parseQuickAddInput } from '../parse'

const baseCases = [
  ['2 milk', { quantity: 2, unit: undefined, nameCanonical: 'milk' }],
  ['milk 2', { quantity: 2, unit: undefined, nameCanonical: 'milk' }],
  ['2x milk', { quantity: 2, unit: undefined, nameCanonical: 'milk' }],
  ['milk x2', { quantity: 2, unit: undefined, nameCanonical: 'milk' }],
  ['1.5 lb chicken', { quantity: 1.5, unit: 'lb', nameCanonical: 'chicken' }],
  ['3 apples', { quantity: 3, unit: undefined, nameCanonical: 'apples' }],
  ['apples 3', { quantity: 3, unit: undefined, nameCanonical: 'apples' }],
  ['apples (honeycrisp) 6', { quantity: 6, unit: undefined, nameCanonical: 'apples (honeycrisp)' }],
]

describe('parseQuickAddInput', () => {
  it.each(baseCases)('parses "%s"', (input, expected) => {
    const result = parseQuickAddInput(input)
    expect(result.nameOriginal).toBe(input)
    expect(result.quantity).toBe(expected.quantity)
    expect(result.unit).toBe(expected.unit)
    expect(result.nameCanonical).toBe(expected.nameCanonical)
  })

  it('keeps original text when quantity cannot be parsed', () => {
    const result = parseQuickAddInput('bag of milkish x?')
    expect(result.quantity).toBeUndefined()
    expect(result.unit).toBeUndefined()
    expect(result.nameCanonical).toBe('bag of milkish x?')
    expect(result.nameOriginal).toBe('bag of milkish x?')
  })
})
