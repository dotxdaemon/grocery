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
    expect(screen.getByText(/grocery list/i)).toBeInTheDocument()
    expect(screen.getByText(/generic romance/i)).toBeInTheDocument()
  })

  it('keeps the undo toast hidden on the streamlined surface', () => {
    useAppStore.setState((state) => ({
      ...state,
      lastUndo: {
        label: 'Created list',
        snapshot: {
          version: 1,
          exportedAt: Date.now(),
          lists: [],
          items: [],
          categories: state.categories,
          itemHistory: [],
          storeProfiles: [],
        },
      },
    }))
    render(<App />)
    expect(screen.queryByText(/undo available/i)).not.toBeInTheDocument()
  })
})
