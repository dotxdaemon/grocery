// ABOUTME: Verifies the App shell renders the branded neon grocery theme cues.
// ABOUTME: Ensures the top-level layout surfaces the errand-focused messaging.
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

  it('renders the neon-inspired branding without the retired reference', () => {
    render(<App />)
    expect(screen.getByText(/grocery list/i)).toBeInTheDocument()
    expect(screen.getByText(/night market errands/i)).toBeInTheDocument()
    expect(screen.queryByText(/generic romance/i)).not.toBeInTheDocument()
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
