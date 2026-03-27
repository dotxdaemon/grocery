// ABOUTME: Verifies the build pipeline prepares offline OCR assets before bundling.
// ABOUTME: Keeps deploy builds from silently omitting screenshot import dependencies.
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('package scripts', () => {
  it('resolves OCR package files without hardcoding a flat node_modules layout', () => {
    const prepareScript = readFileSync(resolve(process.cwd(), 'scripts/prepare-tesseract-assets.mjs'), 'utf8')
    const usesPackageResolution = /createRequire/.test(prepareScript)
    const hardcodesCorePackagePath = /node_modules['"`],\s*['"`]tesseract\.js-core/.test(prepareScript)

    expect(usesPackageResolution).toBe(true)
    expect(hardcodesCorePackagePath).toBe(false)
  })

  it('runs OCR asset preparation before build', () => {
    const packageJson = readFileSync(resolve(process.cwd(), 'package.json'), 'utf8')
    const hasPrebuildOcrPrep = /"prebuild"\s*:\s*"node scripts\/prepare-tesseract-assets\.mjs"/.test(packageJson)

    expect(hasPrebuildOcrPrep).toBe(true)
  })

  it('tracks the OCR dependencies in the pnpm lockfile for CI installs', () => {
    const pnpmLock = readFileSync(resolve(process.cwd(), 'pnpm-lock.yaml'), 'utf8')
    const hasTesseractJs = /tesseract\.js:\s*\n\s+specifier:\s*\^7\.0\.0/.test(pnpmLock)
    const hasEnglishData = /'@tesseract\.js-data\/eng':\s*\n\s+specifier:\s*\^1\.0\.0/.test(pnpmLock)

    expect(hasTesseractJs).toBe(true)
    expect(hasEnglishData).toBe(true)
  })
})
