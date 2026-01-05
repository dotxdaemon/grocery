// ABOUTME: Confirms the list detail add bar uses plus-triggered text entries instead of a fixed input.
// ABOUTME: Exercises the flow of creating and submitting a new item via the plus control.
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_CATEGORIES, DEFAULT_CATEGORY_ORDER } from '../domain/categories'
import { ListDetailPage } from './ListDetailPage'
import { resetAppStore } from '../test/storeHelpers'
import { useAppStore } from '../state/appStore'

const listId = 'list-1'

const renderListPage = (addItemQuick = vi.fn(async () => {})) => {
  resetAppStore()
  const now = Date.now()
  useAppStore.setState((state) => ({
    ...state,
    lists: [
      {
        id: listId,
        name: 'Pantry',
        createdAt: now,
        updatedAt: now,
        sortMode: 'category',
        categoryOrder: DEFAULT_CATEGORY_ORDER,
      },
    ],
    items: [],
    categories: DEFAULT_CATEGORIES,
    preferences: {
      ...state.preferences,
      movePurchasedToBottom: { [listId]: true },
      searchQueryByList: { [listId]: '' },
      activeListId: listId,
    },
    addItemQuick,
    toggleItemPurchased: async () => {},
    clearPurchased: async () => {},
    setSortMode: async () => {},
    setMovePurchasedToBottom: async () => {},
    setSearchQuery: () => {},
    updateItem: async () => {},
    deleteItem: async () => {},
    deleteList: async () => {},
    reorderItems: async () => {},
    toggleFavoriteHistory: async () => {},
    setActiveList: () => {},
  }))

  render(
    <MemoryRouter initialEntries={[`/list/${listId}`]}>
      <Routes>
        <Route path="/list/:id" element={<ListDetailPage />} />
      </Routes>
    </MemoryRouter>,
  )

  return { addItemQuick }
}

describe('ListDetailPage quick entry', () => {
  beforeEach(() => {
    resetAppStore()
  })

  it('keeps the quick entry input hidden until a plus entry is spawned', () => {
    renderListPage()

    expect(screen.getByRole('button', { name: /add item entry/i })).toBeInTheDocument()
    expect(screen.queryByPlaceholderText(/add items/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('textbox', { name: /new item entry/i })).not.toBeInTheDocument()
  })

  it('creates a text entry through the plus control and submits it', async () => {
    const user = userEvent.setup()
    const { addItemQuick } = renderListPage()

    await user.click(screen.getByRole('button', { name: /add item entry/i }))
    const entryInput = screen.getByRole('textbox', { name: /new item entry/i })
    await user.type(entryInput, 'bananas')
    await user.click(screen.getByRole('button', { name: /save item/i }))

    await waitFor(() => {
      expect(addItemQuick).toHaveBeenCalledWith(listId, 'bananas', undefined)
    })
    await waitFor(() => {
      expect(screen.queryByRole('textbox', { name: /new item entry/i })).not.toBeInTheDocument()
    })
  })
})
