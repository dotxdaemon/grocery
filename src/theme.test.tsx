// ABOUTME: Verifies the Berry Mint (Mint Primary) theme tokens and application.
// ABOUTME: Ensures the theme class mounts on the document for consistent styling.
import fs from 'node:fs'
import path from 'node:path'
import { render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { resetAppStore } from './test/storeHelpers'
import { useAppStore } from './state/appStore'

const themeClass = 'theme-berry-mint-mint-primary'

describe('Berry Mint (Mint Primary) theme', () => {
  beforeEach(() => {
    vi.stubEnv('BASE_URL', '/grocery/')
    window.history.replaceState({}, '', '/grocery')
    resetAppStore()
    useAppStore.setState((state) => ({
      ...state,
      init: async () => {},
    }))
    document.body.className = ''
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
  })

  it('defines the editorial palette tokens', () => {
    const cssPath = path.resolve(__dirname, 'index.css')
    const css = fs.readFileSync(cssPath, 'utf-8')
    const expectedTokens = [
      '--bg: #F4F7F6;',
      '--surface: #FFFFFF;',
      '--surface2: #ECF2EF;',
      '--text: #0B1117;',
      '--muted: #5F6B66;',
      '--divider: #D7DFDB;',
      '--primary: #0B1117;',
      '--primary-hover: #1F2937;',
      '--on-primary: #F4F7F6;',
      '--chip: #E6FAF1;',
      '--accent: #E11D48;',
      '--on-accent: #FFFFFF;',
      '--danger: #EF4444;',
      '--success: #10B981;',
      '--warning: #F59E0B;',
    ]

    expect(css).toContain(`.${themeClass}`)
    expectedTokens.forEach((token) => expect(css).toContain(token))
  })

  it('applies the theme to the document body', () => {
    render(<App />)
    expect(document.body.classList.contains(themeClass)).toBe(true)
  })

  it('applies the dark theme class when selected', () => {
    useAppStore.setState((state) => ({
      ...state,
      preferences: { ...state.preferences, themeMode: 'dark' },
    }))
    render(<App />)
    expect(document.body.classList.contains('theme-dark')).toBe(true)
  })

  it('uses the Inter typeface for the global font stack', () => {
    const cssPath = path.resolve(__dirname, 'index.css')
    const css = fs.readFileSync(cssPath, 'utf-8')
    expect(css).toContain("family=Inter:wght@400;500;600")
    expect(css).toContain("font-family: 'Inter'")
  })
})
