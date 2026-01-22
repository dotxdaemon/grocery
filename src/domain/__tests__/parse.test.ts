// ABOUTME: Validates quick-add parsing produces clean item fields.
// ABOUTME: Ensures quantities and units do not pollute the stored name.
import { describe, expect, it } from 'vitest'
import { parseQuickAddInput, splitQuickAddInput } from '../parse'

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

describe('splitQuickAddInput', () => {
  it('splits windows newlines into trimmed entries', () => {
    const result = splitQuickAddInput('apples\r\nbananas\r\ncarrots')
    expect(result).toEqual(['apples', 'bananas', 'carrots'])
  })

  it('drops blank lines and trailing newlines', () => {
    const result = splitQuickAddInput('apples\n\nbananas\n')
    expect(result).toEqual(['apples', 'bananas'])
  })

  it('strips common bullet prefixes', () => {
    const result = splitQuickAddInput('- apples\n• bananas\n* carrots')
    expect(result).toEqual(['apples', 'bananas', 'carrots'])
  })

  it('strips numbered list prefixes', () => {
    const result = splitQuickAddInput('1) apples\n2. bananas\n10) carrots')
    expect(result).toEqual(['apples', 'bananas', 'carrots'])
  })
})
