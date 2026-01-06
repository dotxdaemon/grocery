// ABOUTME: Validates list detail interactions for capturing new groceries efficiently.
// ABOUTME: Ensures adding from the quick bar keeps items visible and the input focused.
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ListDetailPage } from './ListDetailPage'
import { resetAppStore } from '../test/storeHelpers'
import { useAppStore } from '../state/appStore'

const listId = 'list-1'

const renderListPage = () =>
  render(
    <MemoryRouter initialEntries={[`/list/${listId}`]}>
      <Routes>
        <Route path="/list/:id" element={<ListDetailPage />} />
      </Routes>
    </MemoryRouter>,
  )

describe('ListDetailPage quick add', () => {
  beforeEach(() => {
    resetAppStore()
    useAppStore.setState((state) => ({
      ...state,
      lists: [
        {
          id: listId,
          name: 'Weekly',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          sortMode: 'category',
          categoryOrder: state.categories.map((category) => category.id),
        },
      ],
      items: [
        {
          id: 'item-1',
          listId,
          name: 'Milk',
          nameOriginal: 'Milk',
          isPurchased: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: 'item-2',
          listId,
          name: 'Bread',
          nameOriginal: 'Bread',
          isPurchased: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ],
      preferences: {
        ...state.preferences,
        movePurchasedToBottom: {},
        searchQueryByList: { [listId]: '' },
      },
    }))
  })

  it('keeps existing items visible while typing a new entry', async () => {
    renderListPage()
    const user = userEvent.setup()
    const addInput = screen.getByPlaceholderText(/add items/i)

    await user.type(addInput, 'eggs')

    expect(screen.getByText('Milk')).toBeInTheDocument()
    expect(screen.getByText('Bread')).toBeInTheDocument()
  })

  it('keeps the add input focused after submitting', async () => {
    const addItemQuick = vi.fn().mockResolvedValue(undefined)
    useAppStore.setState((state) => ({ ...state, addItemQuick }))

    renderListPage()
    const user = userEvent.setup()
    const addInput = screen.getByPlaceholderText(/add items/i)

    addInput.focus()
    await user.type(addInput, 'eggs{enter}')

    await waitFor(() => expect(addItemQuick).toHaveBeenCalledWith(listId, 'eggs'))
    expect(addInput).toHaveFocus()
    expect(addInput).not.toBeDisabled()
  })
})
