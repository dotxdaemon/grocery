// ABOUTME: Verifies the build pipeline prepares offline OCR assets before bundling.
// ABOUTME: Keeps deploy builds from silently omitting screenshot import dependencies.
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('package scripts', () => {
  it('runs OCR asset preparation before build', () => {
    const packageJson = readFileSync(resolve(process.cwd(), 'package.json'), 'utf8')
    const hasPrebuildOcrPrep = /"prebuild"\s*:\s*"node scripts\/prepare-tesseract-assets\.mjs"/.test(packageJson)

    expect(hasPrebuildOcrPrep).toBe(true)
  })
})
