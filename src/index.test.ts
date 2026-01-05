// ABOUTME: Validates the HTML shell metadata for viewport stability.
// ABOUTME: Ensures mobile input focus does not trigger unwanted zooming.
import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

describe('index.html viewport', () => {
  it('keeps viewport scaling locked to avoid focus zoom', () => {
    const indexPath = path.resolve(__dirname, '..', 'index.html')
    const html = fs.readFileSync(indexPath, 'utf-8')
    const match = html.match(/<meta\s+name=["']viewport["'][^>]+content=["']([^"']+)["']/i)

    expect(match).not.toBeNull()

    const content = match?.[1] ?? ''
    expect(content).toContain('width=device-width')
    expect(content).toMatch(/maximum-scale\s*=\s*1(?:\.0)?/i)
    expect(content).toMatch(/user-scalable\s*=\s*no/i)
  })
})
