// ABOUTME: Verifies the App shell renders the branded neon Kowloon theme cues.
// ABOUTME: Ensures the top-level layout surfaces the romance-inspired messaging.
import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import App from './App'
import { resetAppStore } from './test/storeHelpers'
import { useAppStore } from './state/appStore'

describe('App theme', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/grocery')
    resetAppStore()
    useAppStore.setState((state) => ({
      ...state,
      init: async () => {},
    }))
  })

  it('renders the Kowloon romance-inspired branding', () => {
    render(<App />)
    expect(screen.getByText(/kowloon night market/i)).toBeInTheDocument()
    expect(screen.getByText(/neon shopping companion/i)).toBeInTheDocument()
    expect(screen.getByText(/generic romance/i)).toBeInTheDocument()
  })
})
