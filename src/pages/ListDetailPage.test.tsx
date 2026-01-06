// ABOUTME: Confirms the list detail page adds entries directly from the header input.
// ABOUTME: Exercises the flow of typing into the header field and submitting with enter.
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_CATEGORIES, DEFAULT_CATEGORY_ORDER } from '../domain/categories'
import { ListDetailPage } from './ListDetailPage'
import { resetAppStore } from '../test/storeHelpers'
import { useAppStore } from '../state/appStore'

const listId = 'list-1'

const renderListPage = (
  options: {
    addItemQuick?: (listId: string, input: string, categoryId?: string) => Promise<void>
    items?: {
      id: string
      listId: string
      name: string
      nameOriginal: string
      isPurchased: boolean
      createdAt: number
      updatedAt: number
      categoryId?: string
    }[]
    deleteItem?: (id: string) => Promise<void> | void
  } = {},
) => {
  resetAppStore()
  const now = Date.now()
  const addItemQuick = options.addItemQuick ?? vi.fn(async () => {})
  const deleteItem = options.deleteItem ?? vi.fn(async () => {})
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
    items: options.items ?? [],
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
      updateItem: async () => {},
      deleteItem,
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

  return { addItemQuick, deleteItem }
}

describe('ListDetailPage quick entry', () => {
  beforeEach(() => {
    resetAppStore()
  })

  it('adds an item from the header input when pressing enter', async () => {
    const user = userEvent.setup()
    const { addItemQuick } = renderListPage()

    const entryInput = screen.getByPlaceholderText(/add items/i)
    await user.type(entryInput, 'bananas{enter}')

    await waitFor(() => {
      expect(addItemQuick).toHaveBeenCalledWith(listId, 'bananas')
    })
    expect(entryInput).toHaveValue('')
  })

  it('does not show the old add entry button', () => {
    renderListPage()

    expect(screen.queryByRole('button', { name: /add item entry/i })).not.toBeInTheDocument()
  })
})

describe('ListDetailPage list utilities', () => {
  beforeEach(() => {
    resetAppStore()
  })

  it('shows the search bar above list items by default', () => {
    const now = Date.now()
    renderListPage({
      items: [
        {
          id: 'item-1',
          listId,
          name: 'milk',
          nameOriginal: 'Milk',
          isPurchased: false,
          createdAt: now,
          updatedAt: now,
        },
      ],
    })

    const searchInput = screen.getByPlaceholderText(/add items/i)
    const firstItem = screen.getByText('Milk')
    expect(searchInput).toBeInTheDocument()
    expect(searchInput.compareDocumentPosition(firstItem)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
  })

  it('deletes an item immediately without asking for confirmation', async () => {
    const user = userEvent.setup()
    const now = Date.now()
    const deleteItem = vi.fn(async () => {})
    const confirmSpy = vi.spyOn(window, 'confirm')

    renderListPage({
      items: [
        {
          id: 'item-1',
          listId,
          name: 'milk',
          nameOriginal: 'Milk',
          isPurchased: false,
          createdAt: now,
          updatedAt: now,
        },
      ],
      deleteItem,
    })

    await user.click(screen.getByRole('button', { name: /delete/i }))

    await waitFor(() => {
      expect(deleteItem).toHaveBeenCalledWith('item-1')
    })
    expect(confirmSpy).not.toHaveBeenCalled()
    confirmSpy.mockRestore()
  })
})
