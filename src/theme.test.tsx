// ABOUTME: Verifies the Berry Mint (Mint Primary) theme tokens and application.
// ABOUTME: Ensures the theme class mounts on the document for consistent styling.
import fs from 'node:fs'
import path from 'node:path'
import { render } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import App from './App'
import { resetAppStore } from './test/storeHelpers'
import { useAppStore } from './state/appStore'

const themeClass = 'theme-berry-mint-mint-primary'

describe('Berry Mint (Mint Primary) theme', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/grocery')
    resetAppStore()
    useAppStore.setState((state) => ({
      ...state,
      init: async () => {},
    }))
    document.body.className = ''
  })

  it('defines the mint-led palette tokens', () => {
    const cssPath = path.resolve(__dirname, 'index.css')
    const css = fs.readFileSync(cssPath, 'utf-8')
    const expectedTokens = [
      '--bg: #F7FBF9;',
      '--surface: #FFFFFF;',
      '--surface2: #EEF7F2;',
      '--text: #111827;',
      '--muted: #5F6B66;',
      '--divider: #DDE7E1;',
      '--primary: #34D399;',
      '--primary-hover: #10B981;',
      '--on-primary: #053321;',
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
})
