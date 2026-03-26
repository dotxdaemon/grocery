// ABOUTME: Tests cleanup rules for OCR text extracted from uploaded screenshots.
// ABOUTME: Ensures screenshot parsing yields item lines that quick-add can consume.
import { describe, expect, it } from 'vitest'
import { extractItemsFromScreenshotText } from './screenshotItems'

describe('extractItemsFromScreenshotText', () => {
  it('keeps grocery lines and removes bullets, checkboxes, and duplicates', () => {
    expect(
      extractItemsFromScreenshotText(`
        Ingredients
        [ ] 2 milk
        • bread
        1) eggs
        bread
      `),
    ).toEqual(['2 milk', 'bread', 'eggs'])
  })
})
