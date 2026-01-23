// ABOUTME: Verifies the App shell renders the branded neon grocery theme cues.
// ABOUTME: Ensures the top-level layout surfaces the errand-focused messaging.
import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { resetAppStore } from './test/storeHelpers'
import { useAppStore } from './state/appStore'

const setBaseUrl = (baseUrl: string) => {
  vi.stubEnv('BASE_URL', baseUrl)
}

const renderApp = async () => {
  const { default: App } = await import('./App')
  return render(<App />)
}

describe('App theme', () => {
  beforeEach(() => {
    setBaseUrl('/')
    resetAppStore()
    useAppStore.setState((state) => ({
      ...state,
      init: async () => {},
    }))
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
  })

  it('renders the neon-inspired branding without the retired reference', async () => {
    window.history.replaceState({}, '', '/')
    await renderApp()
    expect(screen.getByText(/grocery list/i)).toBeInTheDocument()
    expect(screen.queryByText(/everyday grocery glow/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/night market errands/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/generic romance/i)).not.toBeInTheDocument()
  })

  it('keeps the undo toast hidden on the streamlined surface', async () => {
    window.history.replaceState({}, '', '/')
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
    await renderApp()
    expect(screen.queryByText(/undo available/i)).not.toBeInTheDocument()
  })

  it('renders routes when BASE_URL targets the root', async () => {
    setBaseUrl('/')
    window.history.replaceState({}, '', '/')
    await renderApp()
    expect(screen.getByText(/grocery list/i)).toBeInTheDocument()
  })

  it('renders routes when BASE_URL targets the repository subpath', async () => {
    setBaseUrl('/grocery/')
    window.history.replaceState({}, '', '/grocery')
    await renderApp()
    expect(screen.getByText(/grocery list/i)).toBeInTheDocument()
  })
})
