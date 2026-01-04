// ABOUTME: Ensures the list detail view renders without runtime errors.
// ABOUTME: Validates that list navigation works and selects handle unassigned values safely.
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ListDetailPage } from './ListDetailPage'
import { resetAppStore } from '../test/storeHelpers'
import { useAppStore } from '../state/appStore'
import { DEFAULT_CATEGORY_ORDER } from '../domain/categories'

describe('ListDetailPage', () => {
  beforeEach(() => {
    resetAppStore()
  })

  it('renders a list without throwing when categories are unassigned', async () => {
    const now = Date.now()
    useAppStore.setState((state) => ({
      status: 'ready',
      lists: [
        {
          id: 'list-1',
          name: 'Weekly Groceries',
          createdAt: now,
          updatedAt: now,
          sortMode: 'category',
          categoryOrder: DEFAULT_CATEGORY_ORDER,
        },
      ],
      preferences: { ...state.preferences, activeListId: 'list-1' },
    }))

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <MemoryRouter initialEntries={['/list/list-1']}>
        <Routes>
          <Route path="/list/:id" element={<ListDetailPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByRole('heading', { name: 'Weekly Groceries' })).toBeInTheDocument()
    expect(errorSpy).not.toHaveBeenCalled()

    errorSpy.mockRestore()
  })
})
