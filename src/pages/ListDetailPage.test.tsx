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
    setSearchQuery: () => {},
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

  it('keeps the quick entry input hidden until a plus entry is spawned', () => {
    renderListPage()

    expect(screen.getByRole('button', { name: /add item entry/i })).toBeInTheDocument()
    expect(screen.queryByPlaceholderText(/add items/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('textbox', { name: /new item entry/i })).not.toBeInTheDocument()
  })

  it('does not render a plus icon on the add entry control', () => {
    renderListPage()

    expect(document.querySelector('svg.lucide-plus')).toBeNull()
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

    const searchInput = screen.getByPlaceholderText(/search items/i)
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
