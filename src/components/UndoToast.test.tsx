// ABOUTME: Confirms the undo toast appears for destructive actions only.
// ABOUTME: Ensures undo and dismiss handlers are wired to the app store.
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { UndoToast } from './UndoToast'
import { resetAppStore } from '../test/storeHelpers'
import { useAppStore } from '../state/appStore'

const baseSnapshot = {
  version: 1,
  exportedAt: Date.now(),
  lists: [],
  items: [],
  categories: [],
  itemHistory: [],
  storeProfiles: [],
}

describe('UndoToast', () => {
  beforeEach(() => {
    resetAppStore()
  })

  it('renders undo controls for destructive labels', async () => {
    const user = userEvent.setup()
    const undo = vi.fn()
    const clearUndo = vi.fn()
    useAppStore.setState((state) => ({
      ...state,
      lastUndo: { label: 'Deleted item', snapshot: baseSnapshot },
      undo,
      clearUndo,
    }))

    render(<UndoToast />)

    expect(screen.getByText(/deleted item/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /undo/i }))
    expect(undo).toHaveBeenCalled()
  })

  it('remains hidden for non-destructive labels', () => {
    useAppStore.setState((state) => ({
      ...state,
      lastUndo: { label: 'Created list', snapshot: baseSnapshot },
    }))

    render(<UndoToast />)

    expect(screen.queryByText(/undo/i)).not.toBeInTheDocument()
  })
})
