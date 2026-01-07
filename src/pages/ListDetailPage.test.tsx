// ABOUTME: Validates list detail interactions for capturing new groceries efficiently.
// ABOUTME: Ensures the header add bar keeps items visible and focused while adding.
import { render, screen, waitFor, within } from '@testing-library/react'
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

describe('ListDetailPage header add bar', () => {
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
    const addInput = screen.getByPlaceholderText(/add an item/i)

    await user.type(addInput, 'eggs')

    expect(screen.getByText('Milk')).toBeInTheDocument()
    expect(screen.getByText('Bread')).toBeInTheDocument()
  })

  it('adds via enter and keeps the add input focused', async () => {
    const addItemQuick = vi.fn().mockResolvedValue(undefined)
    useAppStore.setState((state) => ({ ...state, addItemQuick }))

    renderListPage()
    const user = userEvent.setup()
    const addInput = screen.getByPlaceholderText(/add an item/i)

    addInput.focus()
    await user.type(addInput, 'eggs{enter}')

    await waitFor(() => expect(addItemQuick).toHaveBeenCalledWith(listId, 'eggs', undefined))
    expect(addInput).toHaveFocus()
    expect(addInput).toHaveValue('')
  })
})

describe('ListDetailPage item actions', () => {
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

  it('edits item names from the menu dialog', async () => {
    renderListPage()
    const user = userEvent.setup()

    const milkRow = screen.getByText('Milk').closest('[role="button"]')
    if (!milkRow) throw new Error('Milk row not found')
    await user.click(within(milkRow).getByRole('button', { name: /^Edit$/ }))

    const nameInput = await screen.findByLabelText('Name')
    await user.clear(nameInput)
    await user.type(nameInput, 'Almond Milk')
    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    expect(screen.getByText('Almond Milk')).toBeInTheDocument()
  })

  it('deletes items from the menu', async () => {
    renderListPage()
    const user = userEvent.setup()

    const breadRow = screen.getByText('Bread').closest('[role="button"]')
    if (!breadRow) throw new Error('Bread row not found')
    await user.click(within(breadRow).getByRole('button', { name: /^Delete$/ }))

    await waitFor(() => expect(screen.queryByText('Bread')).not.toBeInTheDocument())
  })
})
