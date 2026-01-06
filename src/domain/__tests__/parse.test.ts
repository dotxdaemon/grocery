// ABOUTME: Validates quick-add parsing produces clean item fields.
// ABOUTME: Ensures quantities and units do not pollute the stored name.
import { describe, expect, it } from 'vitest'
import { parseQuickAddInput } from '../parse'

describe('parseQuickAddInput', () => {
  it('returns empty-safe values for blank input', () => {
    const result = parseQuickAddInput('   ')
    expect(result).toEqual({ nameCanonical: '', nameOriginal: '' })
  })

  it('strips quantity and unit from the visible name portion', () => {
    const result = parseQuickAddInput('2 lb milk')
    expect(result.nameCanonical).toBe('milk')
    expect(result.nameOriginal).toBe('milk')
    expect(result.quantity).toBe(2)
    expect(result.unit).toBe('lb')
  })
})
