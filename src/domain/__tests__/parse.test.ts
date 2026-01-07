// ABOUTME: Validates quick-add parsing produces clean item fields.
// ABOUTME: Ensures quantities and units do not pollute the stored name.
import { describe, expect, it } from 'vitest'
import { parseQuickAddInput } from '../parse'

describe('parseQuickAddInput', () => {
  it('returns empty-safe values for blank input', () => {
    const result = parseQuickAddInput('   ')
    expect(result).toEqual({ nameCanonical: '', nameOriginal: '' })
  })

  it('keeps numeric text as part of the name', () => {
    const result = parseQuickAddInput('1/4 tbsp of cardamom')
    expect(result.nameCanonical).toBe('1/4 tbsp of cardamom')
    expect(result.nameOriginal).toBe('1/4 tbsp of cardamom')
    expect(result.quantity).toBeUndefined()
    expect(result.unit).toBeUndefined()
  })

  it('treats leading numbers as part of the name', () => {
    const result = parseQuickAddInput('2 lb milk')
    expect(result.nameCanonical).toBe('2 lb milk')
    expect(result.nameOriginal).toBe('2 lb milk')
    expect(result.quantity).toBeUndefined()
    expect(result.unit).toBeUndefined()
  })
})
