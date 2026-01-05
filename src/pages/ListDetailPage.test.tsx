// ABOUTME: Ensures the list detail view renders without runtime errors.
// ABOUTME: Validates that list navigation works and selects handle unassigned values safely.
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
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

  it('leans on the top bar and overflow sheet for controls', async () => {
    const now = Date.now()
    useAppStore.setState((state) => ({
      status: 'ready',
      lists: [
        {
          id: 'list-1',
          name: 'Cooking',
          createdAt: now,
          updatedAt: now,
          sortMode: 'category',
          categoryOrder: DEFAULT_CATEGORY_ORDER,
        },
      ],
      items: [
        {
          id: 'item-1',
          name: 'Onion',
          nameOriginal: 'Onion',
          listId: 'list-1',
          isPurchased: false,
          createdAt: now,
          updatedAt: now,
        },
      ],
      categories: state.categories,
      preferences: { ...state.preferences, activeListId: 'list-1' },
      itemHistory: [],
    }))

    render(
      <MemoryRouter initialEntries={['/list/list-1']}>
        <Routes>
          <Route path="/list/:id" element={<ListDetailPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByRole('button', { name: /back/i })).toBeInTheDocument()
    expect(screen.queryByPlaceholderText(/search within this list/i)).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /search list/i }))
    expect(screen.getByPlaceholderText(/search items/i)).toBeInTheDocument()

    expect(screen.queryByText(/clear purchased/i)).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /open list menu/i }))
    expect(await screen.findByText(/sort/i)).toBeInTheDocument()
    expect(screen.getByText(/move purchased to bottom/i)).toBeInTheDocument()
    expect(screen.getByText(/clear purchased/i)).toBeInTheDocument()
    expect(screen.getByText(/delete list/i)).toBeInTheDocument()
  })

  it('keeps the search input sized to prevent zoom when opened', async () => {
    const now = Date.now()
    useAppStore.setState((state) => ({
      status: 'ready',
      lists: [
        {
          id: 'list-1',
          name: 'Cooking',
          createdAt: now,
          updatedAt: now,
          sortMode: 'category',
          categoryOrder: DEFAULT_CATEGORY_ORDER,
        },
      ],
      items: [],
      categories: state.categories,
      preferences: { ...state.preferences, activeListId: 'list-1' },
      itemHistory: [],
    }))

    render(
      <MemoryRouter initialEntries={['/list/list-1']}>
        <Routes>
          <Route path="/list/:id" element={<ListDetailPage />} />
        </Routes>
      </MemoryRouter>,
    )

    await userEvent.click(screen.getByRole('button', { name: /search list/i }))
    expect(screen.getByPlaceholderText(/search items/i)).toHaveClass('text-base')
  })

  it('keeps the quick add input large enough to avoid viewport jumps while adding', async () => {
    const now = Date.now()
    useAppStore.setState((state) => ({
      status: 'ready',
      lists: [
        {
          id: 'list-1',
          name: 'Cooking',
          createdAt: now,
          updatedAt: now,
          sortMode: 'category',
          categoryOrder: DEFAULT_CATEGORY_ORDER,
        },
      ],
      items: [],
      categories: state.categories,
      preferences: { ...state.preferences, activeListId: 'list-1' },
      itemHistory: [],
    }))

    render(
      <MemoryRouter initialEntries={['/list/list-1']}>
        <Routes>
          <Route path="/list/:id" element={<ListDetailPage />} />
        </Routes>
      </MemoryRouter>,
    )

    const input = await screen.findByLabelText(/quick add item/i)
    expect(input).toHaveClass('text-base')
  })
})
