// ABOUTME: Exercises the ListsPage component rendering and data wiring.
// ABOUTME: Guards against regressions that prevent the lists overview from mounting.
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useParams } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { ListsPage } from './ListsPage'
import { resetAppStore } from '../test/storeHelpers'
import { useAppStore } from '../state/appStore'
import { DEFAULT_CATEGORY_ORDER } from '../domain/categories'

describe('ListsPage', () => {
  beforeEach(() => {
    resetAppStore()
  })

  it('renders the lists overview without crashing', () => {
    const now = Date.now()
    useAppStore.setState((state) => ({
      status: 'ready',
      lists: [
        {
          id: 'list-1',
          name: 'Weekend',
          createdAt: now,
          updatedAt: now,
          sortMode: 'category',
          categoryOrder: DEFAULT_CATEGORY_ORDER,
        },
      ],
      items: [
        {
          id: 'item-1',
          listId: 'list-1',
          name: 'Milk',
          nameOriginal: 'Milk',
          isPurchased: false,
          createdAt: now,
          updatedAt: now,
        },
      ],
      preferences: { ...state.preferences, activeListId: 'list-1' },
    }))

    render(
      <MemoryRouter>
        <ListsPage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: /your lists/i })).toBeInTheDocument()
    expect(screen.getByText('Weekend')).toBeInTheDocument()
  })

  it('lets shoppers open a list by clicking its name', async () => {
    const now = Date.now()
    useAppStore.setState((state) => ({
      status: 'ready',
      lists: [
        {
          id: 'list-1',
          name: 'Weekend',
          createdAt: now,
          updatedAt: now,
          sortMode: 'category',
          categoryOrder: DEFAULT_CATEGORY_ORDER,
        },
      ],
      items: [],
      preferences: { ...state.preferences, activeListId: undefined },
    }))

    function DetailProbe() {
      const { id } = useParams()
      return <p>Detail for {id}</p>
    }

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<ListsPage />} />
          <Route path="/list/:id" element={<DetailProbe />} />
        </Routes>
      </MemoryRouter>,
    )

    await userEvent.click(await screen.findByRole('link', { name: 'Weekend' }))

    expect(await screen.findByText('Detail for list-1')).toBeInTheDocument()
    expect(useAppStore.getState().preferences.activeListId).toBe('list-1')
  })
})
