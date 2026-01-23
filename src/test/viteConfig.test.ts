// ABOUTME: Verifies Vite configuration derives the base URL from environment.
// ABOUTME: Ensures builds can target different deployment base paths safely.
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('vite config', () => {
  it('uses VITE_BASE_URL with a / fallback', () => {
    const configSource = readFileSync(resolve(process.cwd(), 'vite.config.ts'), 'utf8')
    const usesBaseEnv = /base:\s*process\.env\.VITE_BASE_URL\s*\?\?\s*['"]\/['"]/.test(configSource)

    expect(usesBaseEnv).toBe(true)
  })
})
